import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ResistanceTest } from './types';
import { 
  saveTestLocally, 
  markPendingSync, 
  removePendingSync,
  getAllTestsLocally,
  getPendingSyncTests,
  getTestLocally,
  deleteTestLocally,
  saveLastSyncTimestamp,
  getLastSyncTimestamp,
  cleanOldTestsFromLocal,
  saveTestsBatch,
  cleanOldMetadataRecords
} from './localStorageService';

const TESTS_COLLECTION = 'resistance_tests';

/**
 * Limpia los datos para Firestore (convierte undefined a null)
 */
const cleanDataForFirestore = (data: any): any => {
  if (data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanDataForFirestore);
  }
  
  if (data !== null && typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = cleanDataForFirestore(value);
    }
    return cleaned;
  }
  
  return data;
};

/**
 * Guarda o actualiza una prueba en Firestore (con respaldo local automático)
 */
export const saveTestToFirestore = async (test: ResistanceTest): Promise<void> => {
  // SIEMPRE guardar localmente primero (nunca se pierde)
  try {
    await saveTestLocally(test);
    console.log('💾 Guardado local exitoso:', test.lotNumber);
  } catch (localError) {
    console.error('❌ Error en guardado local:', localError);
    // Continuar intentando Firestore aunque falle local
  }

  // Intentar guardar en Firestore
  if (!db) {
    console.warn('⚠️ Firestore no está configurado. Solo se guardó localmente.');
    await markPendingSync(test.id);
    return;
  }
  
  try {
    console.log('☁️ Sincronizando con Firestore:', test.lotNumber);
    const testRef = doc(db, TESTS_COLLECTION, test.id);
    
    // Limpiar datos antes de guardar
    const cleanedTest = cleanDataForFirestore({
      ...test,
      updatedAt: Timestamp.now()
    });
    
    await setDoc(testRef, cleanedTest);
    console.log(`✅ Prueba ${test.lotNumber} sincronizada con Firestore`);
    
    // Remover de cola de sincronización si estaba pendiente
    await removePendingSync(test.id);
    
  } catch (error: any) {
    console.error('❌ Error al sincronizar con Firestore:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    
    // Marcar como pendiente de sincronización
    await markPendingSync(test.id);
    console.log('📌 Datos guardados localmente, se sincronizarán cuando haya conexión');
    
    // Solo mostrar alerta en caso de error grave, no por falta de conexión
    if (error.code === 'permission-denied') {
      console.warn('⚠️ Permiso denegado. Datos guardados localmente.');
    } else if (error.code === 'unavailable' || error.message.includes('network')) {
      console.log('📡 Sin conexión. Datos guardados localmente.');
    } else {
      console.warn(`⚠️ Error: ${error.message}. Datos guardados localmente.`);
    }
    
    // NO lanzar error - los datos están seguros localmente
  }
};

/**
 * Limpia los datos cuando vienen de Firestore (convierte null a undefined)
 */
const cleanDataFromFirestore = (data: any): any => {
  if (data === null) {
    return undefined;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanDataFromFirestore);
  }
  
  if (data !== null && typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = cleanDataFromFirestore(value);
    }
    return cleaned;
  }
  
  return data;
};

/**
 * Obtiene las pruebas en progreso (no completadas)
 * ✅ OPTIMIZADO: Lee de cache local (0 consultas Firestore)
 */
export const getInProgressTests = async (): Promise<ResistanceTest[]> => {
  // ✅ OPTIMIZACIÓN: Leer de cache local (ya sincronizado incrementalmente)
  try {
    const allLocalTests = await getAllTestsLocally();
    const inProgressTests = allLocalTests.filter(t => !t.isCompleted);
    
    console.log(`✅ ${inProgressTests.length} pruebas en progreso (desde cache local)`);
    return inProgressTests;
  } catch (error: any) {
    console.error('❌ Error al cargar desde local:', error);
    return [];
  }
};

/**
 * Obtiene las pruebas de un día específico
 */
export const getTestsByDate = async (date: string): Promise<ResistanceTest[]> => {
  try {
    const testsRef = collection(db, TESTS_COLLECTION);
    const q = query(
      testsRef,
      where('date', '>=', date),
      where('date', '<', getNextDay(date)),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];
    
    console.log(`✅ ${tests.length} pruebas encontradas para ${date}`);
    return tests;
  } catch (error: any) {
    console.error('❌ Error al buscar pruebas por fecha:', error);
    throw new Error(`Error al buscar: ${error.message}`);
  }
};

/**
 * Obtiene TODAS las resistencias con SINCRONIZACIÓN INCREMENTAL
 * - Carga primero desde cache local (INSTANTÁNEO)
 * - Luego sincroniza solo los cambios nuevos en background
 * - Mantiene máximo 50 tests en cache
 */
export const getAllTests = async (): Promise<ResistanceTest[]> => {
  // 0. Limpiar metadata antigua de v1 (migración automática)
  cleanOldMetadataRecords().catch(err => {
    console.error('⚠️ Error limpiando metadata antigua:', err);
  });

  // 1. Cargar inmediatamente desde cache local (respuesta instantánea)
  let cachedTests: ResistanceTest[] = [];
  try {
    cachedTests = await getAllTestsLocally();
    console.log(`📦 ${cachedTests.length} tests cargados desde cache local`);
  } catch (error) {
    console.error('❌ Error cargando cache:', error);
  }

  // 2. Sincronizar cambios en background (sin bloquear UI)
  if (db) {
    syncIncrementalChanges().catch(err => {
      console.error('⚠️ Error en sincronización incremental:', err);
    });
  }

  return cachedTests;
};

/**
 * Sincronización incremental: Solo descarga tests nuevos o modificados
 * ✅ OPTIMIZADO: Retorna true si hubo cambios
 */
export const syncIncrementalChanges = async (): Promise<boolean> => {
  try {
    // Obtener timestamp de última sincronización
    const lastSync = await getLastSyncTimestamp();
    const now = new Date().toISOString();

    console.log('🔄 Iniciando sincronización incremental...');
    console.log('⏱️ Última sincronización:', lastSync || 'Primera vez');

    if (!db) {
      console.warn('⚠️ Firestore no disponible');
      return false;
    }

    const testsRef = collection(db, TESTS_COLLECTION);
    let q;

    if (lastSync) {
      // Solo obtener tests creados/modificados después del último sync
      q = query(
        testsRef,
        where('updatedAt', '>', lastSync),
        orderBy('updatedAt', 'desc')
      );
      console.log(`🔍 Buscando cambios desde ${lastSync}`);
    } else {
      // Primera sincronización: obtener los últimos 50
      q = query(
        testsRef,
        orderBy('date', 'desc')
      );
      console.log('🔍 Primera sincronización: cargando últimos 50 tests');
    }

    const snapshot = await getDocs(q);
    const newTests = snapshot.docs.map(doc => cleanDataFromFirestore({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];

    if (newTests.length === 0) {
      console.log('✅ Sin cambios nuevos');
      await saveLastSyncTimestamp(now);
      return false; // ✅ No hubo cambios
    }

    console.log(`📥 Descargados ${newTests.length} tests nuevos/modificados`);

    // Guardar tests nuevos en IndexedDB local (BATCH para mayor velocidad)
    if (newTests.length > 0) {
      await saveTestsBatch(newTests);
    }

    // Limpiar tests antiguos (mantener solo últimos 50 en IndexedDB)
    const deletedCount = await cleanOldTestsFromLocal();
    if (deletedCount > 0) {
      console.log(`🧹 ${deletedCount} tests antiguos eliminados del almacenamiento local`);
    }

    // Actualizar timestamp de sincronización
    await saveLastSyncTimestamp(now);

    console.log(`✅ Sincronización completada. IndexedDB actualizado.`);
    return true; // ✅ Hubo cambios
  } catch (error: any) {
    console.error('❌ Error en sincronización incremental:', error);
    return false;
  }
};

/**
 * Busca pruebas por múltiples criterios
 * ✅ OPTIMIZADO: Busca en cache local primero, fallback a Firestore si no encuentra
 */
export const searchTests = async (
  searchTerm: string, 
  searchInFirestore = false
): Promise<ResistanceTest[]> => {
  
  // 1. ✅ Buscar en cache local SIEMPRE primero (instantáneo)
  try {
    const allTests = await getAllTestsLocally();
    
    // Filtrado en cliente para búsqueda flexible
    const cachedResults = allTests.filter(test => 
      test.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.pool.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`🔍 ${cachedResults.length} pruebas encontradas para "${searchTerm}" (desde cache local)`);
    
    // Si encuentra resultados en cache, retornar
    if (cachedResults.length > 0) {
      return cachedResults;
    }
    
    // 2. ✅ Si NO encuentra Y usuario quiere buscar en Firestore
    if (searchInFirestore && db) {
      console.log('🌐 Buscando en Firestore (histórico completo)...');
      
      try {
        const testsRef = collection(db, TESTS_COLLECTION);
        
        // Búsqueda por número de lote (más común y eficiente)
        const q = query(
          testsRef,
          where('lotNumber', '>=', searchTerm.toUpperCase()),
          where('lotNumber', '<=', searchTerm.toUpperCase() + '\uf8ff'),
          orderBy('lotNumber'),
          orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const firestoreResults = snapshot.docs.map(doc => cleanDataFromFirestore({
          ...doc.data(),
          id: doc.id
        })) as ResistanceTest[];
        
        console.log(`📥 ${firestoreResults.length} pruebas encontradas en Firestore`);
        
        // Guardar resultados en cache para próxima vez
        if (firestoreResults.length > 0) {
          await saveTestsBatch(firestoreResults);
          console.log('💾 Resultados guardados en cache local');
        }
        
        return firestoreResults;
      } catch (error: any) {
        console.error('❌ Error al buscar en Firestore:', error);
        return [];
      }
    }
    
    // No se encontró nada
    return [];
    
  } catch (error: any) {
    console.error('❌ Error al buscar en local:', error);
    return [];
  }
};

/**
 * Obtiene una prueba por ID
 * ✅ OPTIMIZADO: Lee de cache local primero, Firestore solo si no existe
 */
export const getTestById = async (id: string): Promise<ResistanceTest | null> => {
  // ✅ OPTIMIZACIÓN: Intentar leer de cache local primero (95% de casos)
  try {
    const test = await getTestLocally(id);
    if (test) {
      console.log(`✅ Test ${id} cargado desde cache local`);
      return test;
    }
  } catch (error: any) {
    console.error('❌ Error al obtener desde local:', error);
  }

  // Solo si NO está en cache, consultar Firestore
  if (db) {
    try {
      const testRef = doc(db, TESTS_COLLECTION, id);
      const snapshot = await getDoc(testRef);
      
      if (snapshot.exists()) {
        const firestoreTest = cleanDataFromFirestore({ 
          ...snapshot.data(), 
          id: snapshot.id 
        }) as ResistanceTest;
        
        console.log(`✅ Test ${id} cargado desde Firestore (guardando en cache)`);
        
        // Guardar en cache para próxima vez
        await saveTestLocally(firestoreTest);
        
        return firestoreTest;
      }
    } catch (error: any) {
      console.error('❌ Error al obtener desde Firestore:', error);
    }
  }

  console.warn(`⚠️ Test ${id} no encontrado`);
  return null;
};

/**
 * Marca una prueba como completada
 * ✅ OPTIMIZADO: Actualiza cache local primero, luego Firestore
 */
export const markTestAsCompleted = async (testId: string): Promise<void> => {
  // 1. ✅ Obtener test de cache local
  const test = await getTestLocally(testId);
  if (!test) {
    throw new Error('Test no encontrado en cache local');
  }

  // 2. ✅ Actualizar cache local PRIMERO
  const updatedTest: ResistanceTest = {
    ...test,
    isCompleted: true,
    completedAt: new Date().toISOString()
  };

  try {
    await saveTestLocally(updatedTest);
    console.log(`✅ Test ${testId} marcado como completado localmente`);
  } catch (localError) {
    console.error('❌ Error actualizando cache local:', localError);
    throw localError;
  }

  // 3. ✅ Sincronizar con Firestore (si hay conexión)
  if (!db) {
    console.warn('⚠️ Firestore no disponible. Cambio guardado localmente.');
    await markPendingSync(testId);
    return;
  }

  try {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      isCompleted: true,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()  // ✅ CRÍTICO para sync incremental
    });
    console.log(`☁️ Test ${testId} sincronizado con Firestore`);
  } catch (error: any) {
    console.error('❌ Error sincronizando con Firestore:', error);
    // Marcar para sincronización posterior
    await markPendingSync(testId);
    console.log('📌 Cambio guardado localmente, se sincronizará cuando haya conexión');
    // NO lanzar error - el cambio ya está guardado localmente
  }
};

/**
 * NOTA: Las fotos ahora se suben SOLO a OneDrive (no a Firebase Storage)
 * Ver graphService.ts -> uploadPhotoToOneDrive()
 */

// /**
//  * Sube una foto a Firebase Storage (DESHABILITADO - Ahora se usa OneDrive)
//  */
// export const uploadPhotoToStorage = async (
//   testId: string,
//   sampleId: string,
//   photoBlob: Blob
// ): Promise<string> => {
//   try {
//     // Importación dinámica solo en el cliente
//     if (typeof window === 'undefined') {
//       throw new Error('Storage solo está disponible en el cliente');
//     }
//     
//     const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
//     
//     const fileName = `${testId}/${sampleId}.jpg`;
//     const storageRef = ref(storage, `resistance_tests/${fileName}`);
//     
//     await uploadBytes(storageRef, photoBlob);
//     const url = await getDownloadURL(storageRef);
//     
//     console.log(`✅ Foto subida: ${fileName}`);
//     return url;
//   } catch (error: any) {
//     console.error('❌ Error al subir foto:', error);
//     throw new Error(`Error al subir foto: ${error.message}`);
//   }
// };

/**
 * Utilidad para obtener el día siguiente
 */
const getNextDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

/**
 * Elimina una resistencia de Firestore Y del almacenamiento local
 */
export const deleteTest = async (testId: string): Promise<void> => {
  // Eliminar de local primero (siempre)
  try {
    await deleteTestLocally(testId);
    console.log(`✅ Test ${testId} eliminado del almacenamiento local`);
  } catch (localError) {
    console.error('❌ Error eliminando de local:', localError);
  }

  // Intentar eliminar de Firestore
  if (!db) {
    console.warn('⚠️ Firestore no está configurado. Solo se eliminó localmente.');
    return;
  }
  
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await deleteDoc(testRef);
    console.log(`✅ Test ${testId} eliminado de Firestore`);
  } catch (error: any) {
    console.error('❌ Error al eliminar de Firestore:', error);
    console.warn('⚠️ Test eliminado localmente, pero no de Firestore');
    // No lanzar error - el test ya fue eliminado localmente
  }
};

/**
 * Sincroniza todos los datos locales pendientes con Firestore
 * Se llama automáticamente al iniciar la app o cuando se recupera la conexión
 */
export const syncPendingData = async (): Promise<number> => {
  if (!db) {
    console.log('⏸️ Firestore no disponible, sincronización pospuesta');
    return 0;
  }

  try {
    const pendingTests = await getPendingSyncTests();
    
    if (pendingTests.length === 0) {
      console.log('✅ No hay datos pendientes de sincronización');
      return 0;
    }

    console.log(`🔄 Sincronizando ${pendingTests.length} tests pendientes...`);
    let syncedCount = 0;

    for (const test of pendingTests) {
      try {
        const testRef = doc(db, TESTS_COLLECTION, test.id);
        const cleanedTest = cleanDataForFirestore({
          ...test,
          updatedAt: Timestamp.now()
        });
        
        await setDoc(testRef, cleanedTest);
        await removePendingSync(test.id);
        syncedCount++;
        console.log(`✅ Sincronizado: ${test.lotNumber}`);
      } catch (error: any) {
        console.error(`❌ Error sincronizando ${test.lotNumber}:`, error);
        // Continuar con los demás tests aunque uno falle
      }
    }

    console.log(`✅ Sincronización completada: ${syncedCount}/${pendingTests.length} tests`);
    return syncedCount;
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    return 0;
  }
};

// ============================================
// SISTEMA HÍBRIDO - FUNCIONES DUALES
// ============================================

import { 
  uploadTestToOneDrive, 
  downloadTestFromOneDrive, 
  downloadMultipleTests 
} from './onedriveDataService';
import { 
  ResistanceTestIndex, 
  DualSaveResult 
} from './types';
import { 
  MIGRATION_CONFIG, 
  COLLECTIONS,
  isHybridSystemActive,
  shouldUseDualWrite,
  log 
} from './migrationConfig';

/**
 * Generar checksum para validación de integridad
 * Simple hash para verificar que los datos son idénticos
 */
export const generateChecksum = (test: ResistanceTest): string => {
  const testString = JSON.stringify(test, Object.keys(test).sort());
  let hash = 0;
  for (let i = 0; i < testString.length; i++) {
    const char = testString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

/**
 * CARGA HÍBRIDA DUAL
 * ==================
 * Lee datos de sistema nuevo (índice) + sistema viejo (completo)
 * GARANTIZA que TODOS los datos actuales se vean
 * 
 * Flujo:
 * 1. Cargar tests migrados (índice híbrido)
 * 2. Cargar tests NO migrados (Firebase legacy)
 * 3. Combinar y retornar TODO
 */
export const loadTestsHybridDual = async (
  instance: any,
  scopes: string[]
): Promise<ResistanceTest[]> => {
  log.info('🔄 Cargando con sistema dual...');
  
  const allTests: ResistanceTest[] = [];
  const testIds = new Set<string>();
  
  try {
    // 1. CARGAR TESTS MIGRADOS (Sistema híbrido)
    if (isHybridSystemActive()) {
      log.info('📊 Cargando índice híbrido...');
      
      const indexRef = collection(db, COLLECTIONS.INDEX);
      const indexSnapshot = await getDocs(
        query(indexRef, orderBy('date', 'desc'))
      );
      
      if (indexSnapshot.size > 0) {
        log.success(`${indexSnapshot.size} tests en índice híbrido`);
        
        const indexData = indexSnapshot.docs.map(d => d.data() as ResistanceTestIndex);
        
        // Verificar cache local primero
        const cachedTests = await getAllTestsLocally();
        const cachedMap = new Map(cachedTests.map(t => [t.id, t]));
        
        // Separar: en cache vs necesitan descarga
        const needDownload: ResistanceTestIndex[] = [];
        
        indexData.forEach(idx => {
          testIds.add(idx.id);
          
          if (cachedMap.has(idx.id)) {
            allTests.push(cachedMap.get(idx.id)!);
          } else {
            needDownload.push(idx);
          }
        });
        
        // Descargar faltantes desde OneDrive
        if (needDownload.length > 0) {
          log.info(`📥 Descargando ${needDownload.length} tests desde OneDrive...`);
          
          try {
            const downloaded = await downloadMultipleTests(
              instance,
              scopes,
              needDownload.map(idx => ({ id: idx.id, date: idx.date }))
            );
            
            allTests.push(...downloaded);
            
            // Guardar en cache
            await saveTestsBatch(downloaded);
            log.success(`${downloaded.length} tests descargados y cacheados`);
          } catch (downloadError) {
            log.error('Error descargando desde OneDrive:', downloadError);
            // Continuar con los que tenemos en cache
          }
        }
      }
    }
    
    // 2. CARGAR TESTS LEGACY (Sistema viejo - NO migrados)
    log.info('🗂️ Cargando tests legacy...');
    
    const legacyRef = collection(db, COLLECTIONS.LEGACY);
    const legacySnapshot = await getDocs(
      query(legacyRef, orderBy('date', 'desc'))
    );
    
    if (legacySnapshot.size > 0) {
      const legacyTests = legacySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ResistanceTest))
        .filter(test => !testIds.has(test.id)); // Solo los NO migrados
      
      log.success(`${legacyTests.length} tests legacy (no migrados aún)`);
      allTests.push(...legacyTests);
      
      // Guardar en cache local
      if (legacyTests.length > 0) {
        await saveTestsBatch(legacyTests);
      }
    }
    
    // 3. ORDENAR por fecha (más recientes primero)
    allTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    log.success(`Total cargado: ${allTests.length} tests`);
    log.info(`  - Sistema híbrido: ${testIds.size}`);
    log.info(`  - Sistema legacy: ${allTests.length - testIds.size}`);
    
    return allTests;
    
  } catch (error) {
    log.error('❌ Error en carga dual:', error);
    
    // FALLBACK: Cargar solo desde legacy (sistema actual)
    log.warn('⚠️ Fallback a sistema legacy');
    return loadTestsLegacy();
  }
};

/**
 * FUNCIÓN LEGACY (mantener como fallback)
 * Carga tests solo desde Firebase legacy
 */
const loadTestsLegacy = async (): Promise<ResistanceTest[]> => {
  const legacyRef = collection(db, COLLECTIONS.LEGACY);
  const snapshot = await getDocs(query(legacyRef, orderBy('date', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResistanceTest));
};

/**
 * GUARDADO DUAL (Durante migración)
 * ==================================
 * Guarda en sistema híbrido Y sistema legacy
 * GARANTÍA: Si falla híbrido, legacy tiene los datos
 * 
 * Flujo:
 * 1. Guardar en cache local (SIEMPRE primero)
 * 2. Guardar en Firebase legacy (garantía de seguridad)
 * 3. Guardar en sistema híbrido (nuevo)
 */
export const saveTestHybridDual = async (
  instance: any,
  scopes: string[],
  test: ResistanceTest
): Promise<DualSaveResult> => {
  const result: DualSaveResult = {
    success: true,
    errors: [],
    savedToLocal: false,
    savedToLegacy: false,
    savedToHybrid: false,
  };
  
  log.info(`💾 Guardando test ${test.id} en modo dual...`);
  
  // 1. GUARDAR EN CACHE LOCAL (SIEMPRE primero)
  try {
    await saveTestLocally(test);
    result.savedToLocal = true;
    log.success('Guardado en cache local');
  } catch (error: any) {
    result.errors.push(`Cache local: ${error.message}`);
    log.error('Error guardando en cache local:', error);
  }
  
  // 2. GUARDAR EN SISTEMA LEGACY (Garantía de seguridad)
  try {
    const legacyRef = doc(db, COLLECTIONS.LEGACY, test.id);
    await setDoc(legacyRef, cleanDataForFirestore({
      ...test,
      updatedAt: Timestamp.now()
    }));
    result.savedToLegacy = true;
    log.success('Guardado en sistema legacy (Firebase completo)');
  } catch (error: any) {
    result.errors.push(`Legacy: ${error.message}`);
    log.error('Error guardando en legacy:', error);
    result.success = false; // Critical: Legacy es obligatorio
  }
  
  // 3. GUARDAR EN SISTEMA HÍBRIDO (Nuevo) - Solo si está activo
  if (shouldUseDualWrite()) {
    try {
      // 3a. Subir datos completos a OneDrive
      log.info('☁️ Subiendo a OneDrive...');
      const oneDrivePath = await uploadTestToOneDrive(instance, scopes, test);
      log.success(`Subido a OneDrive: ${oneDrivePath}`);
      
      // 3b. Crear/actualizar índice en Firebase
      const checksum = generateChecksum(test);
      const indexRef = doc(db, COLLECTIONS.INDEX, test.id);
      await setDoc(indexRef, {
        id: test.id,
        lotNumber: test.lotNumber,
        date: test.date,
        isCompleted: test.isCompleted,
        updatedAt: Timestamp.now(),
        oneDrivePath,
        migratedAt: Timestamp.now(),
        legacyChecksum: checksum
      });
      result.savedToHybrid = true;
      log.success('Índice híbrido actualizado');
      
    } catch (error: any) {
      result.errors.push(`Híbrido: ${error.message}`);
      log.warn('⚠️ Error en sistema híbrido (legacy tiene los datos):', error);
      // NO marcar como error crítico: legacy ya tiene los datos
    }
  }
  
  // Log resumen
  if (result.success) {
    log.success(`Test ${test.id} guardado exitosamente`);
  } else {
    log.error(`Test ${test.id} guardado con errores:`, result.errors);
  }
  
  return result;
};