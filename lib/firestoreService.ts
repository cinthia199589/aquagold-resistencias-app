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
  deleteTestLocally 
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
 * Si Firestore no está disponible, lee de IndexedDB local
 */
export const getInProgressTests = async (): Promise<ResistanceTest[]> => {
  // Intentar leer de Firestore primero
  if (db) {
    try {
      const testsRef = collection(db, TESTS_COLLECTION);
      const q = query(
        testsRef,
        where('isCompleted', '==', false),
        orderBy('date', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map(doc => cleanDataFromFirestore({
        ...doc.data(),
        id: doc.id
      })) as ResistanceTest[];
      
      console.log(`✅ ${tests.length} pruebas en progreso cargadas desde Firestore`);
      return tests;
    } catch (error: any) {
      console.error('❌ Error al cargar desde Firestore:', error);
      console.log('📂 Intentando cargar desde almacenamiento local...');
      // Si falla Firestore, leer de local
    }
  }

  // Si Firestore no está disponible o falló, leer de local
  try {
    const allLocalTests = await getAllTestsLocally();
    const inProgressTests = allLocalTests.filter(t => !t.isCompleted);
    console.log(`✅ ${inProgressTests.length} pruebas en progreso cargadas desde local`);
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
 * Obtiene TODAS las resistencias (historial completo)
 * Si Firestore no está disponible, lee de IndexedDB local
 */
export const getAllTests = async (): Promise<ResistanceTest[]> => {
  // Intentar leer de Firestore primero
  if (db) {
    try {
      const testsRef = collection(db, TESTS_COLLECTION);
      const q = query(testsRef, orderBy('date', 'desc'));
      
      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map(doc => cleanDataFromFirestore({
        ...doc.data(),
        id: doc.id
      })) as ResistanceTest[];
      
      console.log(`✅ ${tests.length} resistencias cargadas desde Firestore (historial completo)`);
      return tests;
    } catch (error: any) {
      console.error('❌ Error al cargar historial desde Firestore:', error);
      console.log('📂 Intentando cargar desde almacenamiento local...');
      // Si falla Firestore, leer de local
    }
  }

  // Si Firestore no está disponible o falló, leer de local
  try {
    const localTests = await getAllTestsLocally();
    console.log(`✅ ${localTests.length} resistencias cargadas desde local (historial completo)`);
    return localTests;
  } catch (error: any) {
    console.error('❌ Error al cargar historial desde local:', error);
    return [];
  }
};

/**
 * Busca pruebas por múltiples criterios
 * Si Firestore no está disponible, busca en IndexedDB local
 */
export const searchTests = async (searchTerm: string): Promise<ResistanceTest[]> => {
  let allTests: ResistanceTest[] = [];

  // Intentar leer de Firestore primero
  if (db) {
    try {
      const testsRef = collection(db, TESTS_COLLECTION);
      const snapshot = await getDocs(testsRef);
      
      allTests = snapshot.docs.map(doc => cleanDataFromFirestore({
        ...doc.data(),
        id: doc.id
      })) as ResistanceTest[];
      
      console.log(`✅ Búsqueda en Firestore: ${allTests.length} tests disponibles`);
    } catch (error: any) {
      console.error('❌ Error al buscar en Firestore:', error);
      console.log('📂 Buscando en almacenamiento local...');
    }
  }

  // Si Firestore falló o no está disponible, leer de local
  if (allTests.length === 0) {
    try {
      allTests = await getAllTestsLocally();
      console.log(`✅ Búsqueda en local: ${allTests.length} tests disponibles`);
    } catch (error: any) {
      console.error('❌ Error al buscar en local:', error);
      return [];
    }
  }
  
  // Filtrado en cliente para búsqueda flexible
  const filtered = allTests.filter(test => 
    test.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.pool.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log(`✅ ${filtered.length} pruebas encontradas para "${searchTerm}"`);
  return filtered;
};

/**
 * Obtiene una prueba por ID
 * Si Firestore no está disponible, busca en IndexedDB local
 */
export const getTestById = async (id: string): Promise<ResistanceTest | null> => {
  // Intentar leer de Firestore primero
  if (db) {
    try {
      const testRef = doc(db, TESTS_COLLECTION, id);
      const snapshot = await getDoc(testRef);
      
      if (snapshot.exists()) {
        const test = cleanDataFromFirestore({ ...snapshot.data(), id: snapshot.id }) as ResistanceTest;
        console.log(`✅ Test ${id} cargado desde Firestore`);
        return test;
      }
    } catch (error: any) {
      console.error('❌ Error al obtener desde Firestore:', error);
      console.log('📂 Intentando cargar desde local...');
    }
  }

  // Si Firestore falló o no está disponible, leer de local
  try {
    const test = await getTestLocally(id);
    if (test) {
      console.log(`✅ Test ${id} cargado desde local`);
    }
    return test;
  } catch (error: any) {
    console.error('❌ Error al obtener desde local:', error);
    return null;
  }
};

/**
 * Marca una prueba como completada
 */
export const markTestAsCompleted = async (testId: string): Promise<void> => {
  try {
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await updateDoc(testRef, {
      isCompleted: true,
      completedAt: Timestamp.now()
    });
    console.log(`✅ Prueba ${testId} marcada como completada`);
  } catch (error: any) {
    console.error('❌ Error al completar prueba:', error);
    throw new Error(`Error al completar: ${error.message}`);
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