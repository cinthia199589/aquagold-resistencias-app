/**
 * 📸 PHOTO UPLOAD SERVICE - CON CONFIABILIDAD MEJORADA
 *
 * Servicio avanzado para subida de fotos con:
 * - Sistema de reintentos automáticos
 * - Validación de conectividad
 * - Compresión de imágenes
 * - Backup local
 * - Queue de operaciones pendientes
 * - Validación de archivos
 */

import { IPublicClientApplication } from "@azure/msal-browser";
import { ResistanceTest, TestType } from "./types";
import { uploadPhotoToOneDrive } from "./graphService";
import { addPendingOperation } from "./backgroundSyncService";

interface PhotoUploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  compressionQuality?: number;
  maxFileSize?: number; // en MB
  enableLocalBackup?: boolean;
  enableQueue?: boolean;
}

interface UploadProgress {
  stage: 'validating' | 'compressing' | 'uploading' | 'saving' | 'completed';
  progress: number; // 0-100
  message: string;
  retryCount?: number;
}

interface PhotoUploadResult {
  success: boolean;
  photoUrl?: string;
  localBackupUrl?: string;
  error?: string;
  retryCount: number;
  compressedSize?: number;
  originalSize?: number;
}

/**
 * Valida la conectividad y calidad de conexión
 */
export const validateConnectivity = async (): Promise<{
  isOnline: boolean;
  quality: 'good' | 'fair' | 'poor';
  latency?: number;
}> => {
  if (!navigator.onLine) {
    return { isOnline: false, quality: 'poor' };
  }

  try {
    const startTime = Date.now();
    // Hacer una petición rápida a un endpoint confiable
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return { isOnline: false, quality: 'poor' };
    }

    // Clasificar calidad basado en latencia
    let quality: 'good' | 'fair' | 'poor';
    if (latency < 500) quality = 'good';
    else if (latency < 2000) quality = 'fair';
    else quality = 'poor';

    return { isOnline: true, quality, latency };
  } catch (error) {
    return { isOnline: false, quality: 'poor' };
  }
};

/**
 * Valida archivo de imagen antes de subir
 */
export const validateImageFile = (file: File): {
  isValid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    type: string;
  };
} => {
  // Validar tipo MIME
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(', ')}`
    };
  }

  // Validar tamaño (máximo 10MB por defecto)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Archivo demasiado grande. Máximo permitido: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Validar tamaño mínimo
  if (file.size < 1024) { // 1KB mínimo
    return {
      isValid: false,
      error: 'Archivo demasiado pequeño o corrupto'
    };
  }

  return { isValid: true };
};

/**
 * Comprime imagen manteniendo calidad aceptable
 */
export const compressImage = async (
  file: File,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen comprimida
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Error al cargar imagen para compresión'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Guarda foto localmente como backup
 */
export const saveLocalBackup = async (file: Blob, filename: string): Promise<string> => {
  try {
    // Usar IndexedDB o localStorage para guardar backup
    const backupKey = `photo_backup_${filename}_${Date.now()}`;

    // Convertir a base64 para almacenamiento
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    localStorage.setItem(backupKey, JSON.stringify({
      data: base64,
      timestamp: Date.now(),
      filename,
      type: file.type
    }));

    console.log(`💾 Backup local guardado: ${backupKey}`);
    return backupKey;
  } catch (error) {
    console.warn('⚠️ Error guardando backup local:', error);
    throw error;
  }
};

/**
 * Función principal de subida de fotos con confiabilidad mejorada
 */
export const uploadPhotoReliably = async (
  msalInstance: IPublicClientApplication,
  scopes: string[],
  lotNumber: string,
  sampleId: string,
  file: File,
  testType: TestType,
  options: PhotoUploadOptions = {},
  onProgress?: (progress: UploadProgress) => void
): Promise<PhotoUploadResult> => {

  const {
    maxRetries = 3,
    retryDelay = 1000,
    maxRetryDelay = 10000,
    compressionQuality = 0.8,
    maxFileSize = 5, // 5MB
    enableLocalBackup = true,
    enableQueue = true
  } = options;

  let retryCount = 0;
  let lastError: string = '';
  let localBackupUrl: string | undefined;

  // FASE 1: Validación inicial
  onProgress?.({
    stage: 'validating',
    progress: 10,
    message: 'Validando archivo y conectividad...'
  });

  // Validar archivo
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
      retryCount: 0
    };
  }

  // Validar conectividad
  const connectivity = await validateConnectivity();
  if (!connectivity.isOnline) {
    return {
      success: false,
      error: 'Sin conexión a internet',
      retryCount: 0
    };
  }

  // FASE 2: Compresión (si es necesario)
  let processedFile: Blob = file;
  let originalSize = file.size;

  if (file.size > maxFileSize * 1024 * 1024) {
    onProgress?.({
      stage: 'compressing',
      progress: 30,
      message: 'Comprimiendo imagen...'
    });

    try {
      processedFile = await compressImage(file, compressionQuality);
      console.log(`🗜️ Imagen comprimida: ${originalSize} → ${processedFile.size} bytes`);
    } catch (error) {
      console.warn('⚠️ Error comprimiendo imagen, usando original:', error);
    }
  }

  // FASE 3: Backup local (si está habilitado)
  if (enableLocalBackup) {
    try {
      localBackupUrl = await saveLocalBackup(processedFile, `foto_${sampleId}.jpg`);
    } catch (error) {
      console.warn('⚠️ Error guardando backup local:', error);
    }
  }

  // FASE 4: Subida con reintentos
  while (retryCount <= maxRetries) {
    try {
      onProgress?.({
        stage: 'uploading',
        progress: 50 + (retryCount * 10),
        message: retryCount > 0 ? `Reintentando subida... (${retryCount}/${maxRetries})` : 'Subiendo foto...',
        retryCount
      });

      const photoUrl = await uploadPhotoToOneDrive(
        msalInstance,
        scopes,
        lotNumber,
        sampleId,
        processedFile,
        testType
      );

      // FASE 5: Verificación final
      onProgress?.({
        stage: 'saving',
        progress: 90,
        message: 'Verificando subida...'
      });

      // Verificar que la URL es accesible (opcional pero recomendado)
      try {
        const response = await fetch(photoUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
          throw new Error('URL subida no es accesible');
        }
      } catch (verifyError) {
        console.warn('⚠️ No se pudo verificar URL subida:', verifyError);
        // No fallar por esto, continuar
      }

      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: '¡Foto subida exitosamente!'
      });

      return {
        success: true,
        photoUrl,
        localBackupUrl,
        retryCount,
        compressedSize: processedFile.size,
        originalSize
      };

    } catch (error: any) {
      lastError = error.message;
      retryCount++;

      if (retryCount <= maxRetries) {
        // Calcular delay con backoff exponencial
        const delay = Math.min(retryDelay * Math.pow(2, retryCount - 1), maxRetryDelay);

        console.log(`⏳ Reintentando en ${delay}ms... (${retryCount}/${maxRetries})`);

        onProgress?.({
          stage: 'uploading',
          progress: 40 + (retryCount * 10),
          message: `Error: ${lastError}. Reintentando en ${Math.round(delay/1000)}s...`,
          retryCount
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Si llegamos aquí, todos los reintentos fallaron
  // Agregar a queue de operaciones pendientes si está habilitado
  if (enableQueue) {
    try {
      await addPendingOperation('upload_photo', {
        lotNumber,
        sampleId,
        fileData: localBackupUrl, // Usar backup local si existe
        testType,
        originalFile: file,
        retryCount
      });
      console.log('📝 Foto agregada a cola de sincronización');
    } catch (queueError) {
      console.warn('⚠️ Error agregando a cola de sync:', queueError);
    }
  }

  return {
    success: false,
    error: `Falló después de ${maxRetries} reintentos. Último error: ${lastError}`,
    localBackupUrl,
    retryCount,
    compressedSize: processedFile.size,
    originalSize
  };
};

/**
 * Procesa operaciones pendientes de subida de fotos
 */
export const processPendingPhotoUploads = async (
  msalInstance: IPublicClientApplication,
  scopes: string[]
): Promise<void> => {
  const { getPendingOperations } = await import('./backgroundSyncService');
  const operations = getPendingOperations().filter(op => op.type === 'upload_photo');

  for (const operation of operations) {
    try {
      console.log(`🔄 Procesando subida pendiente: ${operation.id}`);

      const { lotNumber, sampleId, fileData, testType, originalFile } = operation.data;

      // Recuperar archivo del backup local si existe
      let file: File;
      if (fileData && localStorage.getItem(fileData)) {
        const backup = JSON.parse(localStorage.getItem(fileData)!);
        const binaryString = atob(backup.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        file = new File([bytes], backup.filename, { type: backup.type });
      } else if (originalFile) {
        file = originalFile;
      } else {
        console.warn(`⚠️ No se pudo recuperar archivo para ${operation.id}`);
        continue;
      }

      // Intentar subir nuevamente
      const result = await uploadPhotoReliably(
        msalInstance,
        scopes,
        lotNumber,
        sampleId,
        file,
        testType,
        { maxRetries: 2, enableQueue: false } // Menos reintentos para evitar loops
      );

      if (result.success) {
        // Remover de operaciones pendientes
        const { removePendingOperation } = await import('./backgroundSyncService');
        await removePendingOperation(operation.id);
        console.log(`✅ Subida pendiente completada: ${operation.id}`);
      } else {
        console.warn(`❌ Subida pendiente falló nuevamente: ${operation.id}`);
      }

    } catch (error) {
      console.error(`❌ Error procesando subida pendiente ${operation.id}:`, error);
    }
  }
};

export default {
  uploadPhotoReliably,
  validateConnectivity,
  validateImageFile,
  compressImage,
  saveLocalBackup,
  processPendingPhotoUploads
};