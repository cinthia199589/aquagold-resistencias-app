/**
 * SERVICIO DE ALMACENAMIENTO ONEDRIVE PARA DATOS JSON
 * ==================================================
 * 
 * Almacena tests completos en OneDrive como archivos JSON
 * Complementa el sistema híbrido:
 * - Firebase: Índice ligero (queries rápidas)
 * - OneDrive: Datos completos (almacenamiento gratis)
 * 
 * Estructura en OneDrive:
 * /Aquagold_Resistencias/
 *   ├── database/
 *   │   ├── tests/
 *   │   │   ├── 2025-10/
 *   │   │   │   ├── test-001.json
 *   │   │   │   ├── test-002.json
 *   │   │   │   └── ...
 *   │   │   └── 2025-11/
 *   │   └── manifest.json
 *   ├── fotos/
 *   └── excel/
 */

import { ResistanceTest } from './types';
import { 
  MIGRATION_CONFIG, 
  getTestOneDrivePath, 
  getOneDriveFolderPath,
  log 
} from './migrationConfig';

/**
 * Subir test completo a OneDrive como JSON
 * 
 * @param instance MSAL instance
 * @param scopes MSAL scopes
 * @param test Test completo a subir
 * @returns URL del archivo en OneDrive
 */
export const uploadTestToOneDrive = async (
  instance: any,
  scopes: string[],
  test: ResistanceTest
): Promise<string> => {
  try {
    // Validar que hay cuenta activa
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuenta activa en MSAL');
    }
    
    log.info(`Subiendo test ${test.id} a OneDrive...`);
    
    // 1. Obtener ruta OneDrive
    const oneDrivePath = getTestOneDrivePath(test.id, test.date);
    const folderPath = getOneDriveFolderPath(test.date);
    const fileName = `test-${test.id}.json`;
    
    // 2. Convertir test a JSON con formato bonito
    const testJson = JSON.stringify(test, null, 2);
    const testBlob = new Blob([testJson], { type: 'application/json' });
    
    // 3. Subir a OneDrive (reutiliza función existente de graphService)
    const url = await uploadFileToOneDriveInternal(
      instance,
      scopes,
      folderPath,
      fileName,
      testBlob
    );
    
    log.success(`Test ${test.id} subido exitosamente: ${oneDrivePath}`);
    return url;
    
  } catch (error) {
    log.error(`Error subiendo test ${test.id} a OneDrive:`, error);
    throw error;
  }
};

/**
 * Descargar test desde OneDrive
 * 
 * @param instance MSAL instance
 * @param scopes MSAL scopes
 * @param testId ID del test
 * @param date Fecha del test (para ubicar carpeta)
 * @returns Test completo
 */
export const downloadTestFromOneDrive = async (
  instance: any,
  scopes: string[],
  testId: string,
  date: string
): Promise<ResistanceTest> => {
  try {
    // Validar que hay cuenta activa
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuenta activa en MSAL');
    }
    
    log.info(`Descargando test ${testId} desde OneDrive...`);
    
    // 1. Construir ruta del archivo
    const oneDrivePath = getTestOneDrivePath(testId, date);
    
    // 2. Descargar archivo
    const content = await downloadFileFromOneDriveInternal(
      instance,
      scopes,
      oneDrivePath
    );
    
    // 3. Parsear JSON
    const test = JSON.parse(content) as ResistanceTest;
    
    log.success(`Test ${testId} descargado exitosamente`);
    return test;
    
  } catch (error) {
    log.error(`Error descargando test ${testId} desde OneDrive:`, error);
    throw error;
  }
};

/**
 * Descargar múltiples tests en paralelo (para sincronización)
 * 
 * @param instance MSAL instance
 * @param scopes MSAL scopes
 * @param testIds Array de {id, date}
 * @returns Array de tests completos
 */
export const downloadMultipleTests = async (
  instance: any,
  scopes: string[],
  testIds: Array<{ id: string; date: string }>
): Promise<ResistanceTest[]> => {
  try {
    log.info(`Descargando ${testIds.length} tests desde OneDrive...`);
    
    // Descargar en paralelo (máximo 5 a la vez para no saturar)
    const batchSize = 5;
    const results: ResistanceTest[] = [];
    
    for (let i = 0; i < testIds.length; i += batchSize) {
      const batch = testIds.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(({ id, date }) =>
          downloadTestFromOneDrive(instance, scopes, id, date)
        )
      );
      
      results.push(...batchResults);
      
      // Log progreso
      log.info(`Progreso: ${Math.min(i + batchSize, testIds.length)}/${testIds.length} tests descargados`);
    }
    
    log.success(`${results.length} tests descargados exitosamente`);
    return results;
    
  } catch (error) {
    log.error('Error descargando múltiples tests:', error);
    throw error;
  }
};

/**
 * Verificar si un test existe en OneDrive
 * 
 * @param instance MSAL instance
 * @param scopes MSAL scopes
 * @param testId ID del test
 * @param date Fecha del test
 * @returns true si existe, false si no
 */
export const testExistsInOneDrive = async (
  instance: any,
  scopes: string[],
  testId: string,
  date: string
): Promise<boolean> => {
  try {
    const oneDrivePath = getTestOneDrivePath(testId, date);
    
    // Intentar obtener metadata del archivo
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuenta activa en MSAL');
    }
    const account = accounts[0];

    const response = await instance.acquireTokenSilent({
      scopes,
      account,
    });

    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${oneDrivePath}`,
      {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      }
    );

    return graphResponse.ok;
    
  } catch (error) {
    return false;
  }
};

/**
 * Eliminar test de OneDrive
 * NOTA: Solo usar en rollback o limpieza
 * 
 * @param instance MSAL instance
 * @param scopes MSAL scopes
 * @param testId ID del test
 * @param date Fecha del test
 */
export const deleteTestFromOneDrive = async (
  instance: any,
  scopes: string[],
  testId: string,
  date: string
): Promise<void> => {
  try {
    log.warn(`Eliminando test ${testId} de OneDrive...`);
    
    const oneDrivePath = getTestOneDrivePath(testId, date);
    
    const accounts = instance.getAllAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error('No hay cuenta activa en MSAL');
    }
    const account = accounts[0];

    const response = await instance.acquireTokenSilent({
      scopes,
      account,
    });

    await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${oneDrivePath}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      }
    );

    log.success(`Test ${testId} eliminado de OneDrive`);
    
  } catch (error) {
    log.error(`Error eliminando test ${testId} de OneDrive:`, error);
    throw error;
  }
};

// ============================================
// FUNCIONES INTERNAS (reutilizan graphService)
// ============================================

/**
 * Subir archivo a OneDrive (interno)
 * Reutiliza lógica existente de graphService.ts
 */
const uploadFileToOneDriveInternal = async (
  instance: any,
  scopes: string[],
  folderPath: string,
  fileName: string,
  fileBlob: Blob
): Promise<string> => {
  // Usar getAllAccounts() en lugar de getActiveAccount()
  const accounts = instance.getAllAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No hay cuenta activa en MSAL');
  }
  const account = accounts[0];

  // Obtener token
  const response = await instance.acquireTokenSilent({
    scopes,
    account,
  });

  // Crear carpeta si no existe
  await ensureFolderExists(instance, scopes, folderPath);

  // Subir archivo
  const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}/${fileName}:/content`;
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${response.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Error subiendo archivo: ${errorText}`);
  }

  const result = await uploadResponse.json();
  return result.webUrl || result['@microsoft.graph.downloadUrl'];
};

/**
 * Descargar archivo de OneDrive (interno)
 */
const downloadFileFromOneDriveInternal = async (
  instance: any,
  scopes: string[],
  filePath: string
): Promise<string> => {
  const accounts = instance.getAllAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No hay cuenta activa en MSAL');
  }
  const account = accounts[0];

  const response = await instance.acquireTokenSilent({
    scopes,
    account,
  });

  // Obtener URL de descarga
  const metadataUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}`;
  
  const metadataResponse = await fetch(metadataUrl, {
    headers: {
      Authorization: `Bearer ${response.accessToken}`,
    },
  });

  if (!metadataResponse.ok) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }

  const metadata = await metadataResponse.json();
  const downloadUrl = metadata['@microsoft.graph.downloadUrl'];

  // Descargar contenido
  const contentResponse = await fetch(downloadUrl);
  const content = await contentResponse.text();

  return content;
};

/**
 * Asegurar que una carpeta existe en OneDrive
 */
const ensureFolderExists = async (
  instance: any,
  scopes: string[],
  folderPath: string
): Promise<void> => {
  const accounts = instance.getAllAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No hay cuenta activa en MSAL');
  }
  const account = accounts[0];

  const response = await instance.acquireTokenSilent({
    scopes,
    account,
  });

  // Dividir path en partes
  const parts = folderPath.split('/').filter(p => p.length > 0);
  let currentPath = '';

  // Crear cada carpeta en la ruta
  for (const part of parts) {
    currentPath += `/${part}`;
    
    try {
      // Intentar crear la carpeta
      await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:${currentPath.substring(0, currentPath.lastIndexOf('/'))}:/children`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${response.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: part,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail', // Si existe, no crear duplicado
          }),
        }
      );
    } catch (error) {
      // Ignorar si la carpeta ya existe
    }
  }
};
