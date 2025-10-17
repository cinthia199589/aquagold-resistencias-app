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
 * Guarda o actualiza una prueba en Firestore
 */
export const saveTestToFirestore = async (test: ResistanceTest): Promise<void> => {
  if (!db) {
    console.error('❌ Firestore no está configurado. Los datos no se guardarán.');
    alert('⚠️ Firebase no está configurado. Por favor, configura Firestore en Firebase Console.');
    return;
  }
  
  try {
    console.log('💾 Intentando guardar prueba:', test.lotNumber);
    const testRef = doc(db, TESTS_COLLECTION, test.id);
    
    // Limpiar datos antes de guardar
    const cleanedTest = cleanDataForFirestore({
      ...test,
      updatedAt: Timestamp.now()
    });
    
    await setDoc(testRef, cleanedTest);
    console.log(`✅ Prueba ${test.lotNumber} guardada en Firestore correctamente`);
  } catch (error: any) {
    console.error('❌ Error al guardar en Firestore:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    
    if (error.code === 'permission-denied') {
      alert('⚠️ Permiso denegado. Verifica:\n1. Que Firestore esté activado\n2. Las reglas de seguridad\n3. Que hayas iniciado sesión');
    } else if (error.code === 'unavailable') {
      alert('⚠️ Firestore no está disponible. Verifica:\n1. Que Firestore Database esté activado en Firebase Console\n2. Tu conexión a internet');
    } else {
      alert(`❌ Error al guardar: ${error.message}`);
    }
    
    throw new Error(`Error al guardar: ${error.message}`);
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
 */
export const getInProgressTests = async (): Promise<ResistanceTest[]> => {
  if (!db) {
    console.warn('⚠️ Firestore no está configurado. Retornando array vacío.');
    return [];
  }
  
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
    
    console.log(`✅ ${tests.length} pruebas en progreso cargadas`);
    return tests;
  } catch (error: any) {
    console.error('❌ Error al cargar pruebas:', error);
    throw new Error(`Error al cargar: ${error.message}`);
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
 */
export const getAllTests = async (): Promise<ResistanceTest[]> => {
  try {
    const testsRef = collection(db, TESTS_COLLECTION);
    const q = query(testsRef, orderBy('date', 'desc'));
    
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => cleanDataFromFirestore({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];
    
    console.log(`✅ ${tests.length} resistencias cargadas (historial completo)`);
    return tests;
  } catch (error: any) {
    console.error('❌ Error al cargar historial:', error);
    throw new Error(`Error al cargar historial: ${error.message}`);
  }
};

/**
 * Busca pruebas por múltiples criterios
 */
export const searchTests = async (searchTerm: string): Promise<ResistanceTest[]> => {
  try {
    const testsRef = collection(db, TESTS_COLLECTION);
    const snapshot = await getDocs(testsRef);
    
    const allTests = snapshot.docs.map(doc => cleanDataFromFirestore({
      ...doc.data(),
      id: doc.id
    })) as ResistanceTest[];
    
    // Filtrado en cliente para búsqueda flexible
    const filtered = allTests.filter(test => 
      test.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.pool.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`✅ ${filtered.length} pruebas encontradas para "${searchTerm}"`);
    return filtered;
  } catch (error: any) {
    console.error('❌ Error al buscar:', error);
    throw new Error(`Error al buscar: ${error.message}`);
  }
};

/**
 * Obtiene una prueba por ID
 */
export const getTestById = async (id: string): Promise<ResistanceTest | null> => {
  try {
    const testRef = doc(db, TESTS_COLLECTION, id);
    const snapshot = await getDoc(testRef);
    
    if (snapshot.exists()) {
      return cleanDataFromFirestore({ ...snapshot.data(), id: snapshot.id }) as ResistanceTest;
    }
    return null;
  } catch (error: any) {
    console.error('❌ Error al obtener prueba:', error);
    throw new Error(`Error al obtener: ${error.message}`);
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
 * Elimina una resistencia de Firestore
 */
export const deleteTest = async (testId: string): Promise<void> => {
  if (!db) {
    console.error('❌ Firestore no está configurado.');
    alert('⚠️ Firebase no está configurado.');
    return;
  }
  
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const testRef = doc(db, TESTS_COLLECTION, testId);
    await deleteDoc(testRef);
    console.log(`✅ Resistencia ${testId} eliminada correctamente`);
  } catch (error: any) {
    console.error('❌ Error al eliminar resistencia:', error);
    throw new Error(`Error al eliminar: ${error.message}`);
  }
};