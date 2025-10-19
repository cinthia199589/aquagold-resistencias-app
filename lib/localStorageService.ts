/**
 * Servicio de persistencia local usando IndexedDB
 * Los datos se guardan localmente y NO se pierden aunque:
 * - Se cierre la app
 * - Se limpie la cache del navegador
 * - Se pierda la conexión a internet
 * 
 * Se sincronizan automáticamente con Firestore cuando hay conexión
 */

import { ResistanceTest } from './types';

const DB_NAME = 'AquagoldResistenciasDB';
const DB_VERSION = 1;
const STORE_NAME = 'resistance_tests';
const PENDING_SYNC_STORE = 'pending_sync';

// Inicializar IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB solo funciona en el navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear store para tests si no existe
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('isCompleted', 'isCompleted', { unique: false });
        console.log('✅ Store de tests creado');
      }

      // Crear store para sincronización pendiente
      if (!db.objectStoreNames.contains(PENDING_SYNC_STORE)) {
        const syncStore = db.createObjectStore(PENDING_SYNC_STORE, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('✅ Store de sincronización creado');
      }
    };
  });
};

/**
 * Guardar test en IndexedDB local
 */
export const saveTestLocally = async (test: ResistanceTest): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(test);
      request.onsuccess = () => {
        console.log('💾 Test guardado localmente:', test.id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('❌ Error guardando localmente:', error);
    throw error;
  }
};

/**
 * Marcar test como pendiente de sincronización
 */
export const markPendingSync = async (testId: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PENDING_SYNC_STORE], 'readwrite');
    const store = transaction.objectStore(PENDING_SYNC_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        id: testId,
        timestamp: Date.now()
      });
      request.onsuccess = () => {
        console.log('📌 Test marcado para sincronización:', testId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('❌ Error marcando para sync:', error);
  }
};

/**
 * Obtener tests pendientes de sincronización
 */
export const getPendingSyncTests = async (): Promise<ResistanceTest[]> => {
  try {
    const db = await initDB();

    // Obtener IDs pendientes
    const syncTransaction = db.transaction([PENDING_SYNC_STORE], 'readonly');
    const syncStore = syncTransaction.objectStore(PENDING_SYNC_STORE);
    
    const pendingIds = await new Promise<string[]>((resolve, reject) => {
      const request = syncStore.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });

    if (pendingIds.length === 0) {
      db.close();
      return [];
    }

    // Obtener tests completos
    const testsTransaction = db.transaction([STORE_NAME], 'readonly');
    const testsStore = testsTransaction.objectStore(STORE_NAME);

    const tests: ResistanceTest[] = [];
    for (const id of pendingIds) {
      const test = await new Promise<ResistanceTest | null>((resolve, reject) => {
        const request = testsStore.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      if (test) tests.push(test);
    }

    db.close();
    console.log(`📋 ${tests.length} tests pendientes de sincronización`);
    return tests;
  } catch (error) {
    console.error('❌ Error obteniendo tests pendientes:', error);
    return [];
  }
};

/**
 * Remover test de la cola de sincronización
 */
export const removePendingSync = async (testId: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([PENDING_SYNC_STORE], 'readwrite');
    const store = transaction.objectStore(PENDING_SYNC_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(testId);
      request.onsuccess = () => {
        console.log('✅ Test sincronizado, removido de cola:', testId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('❌ Error removiendo de sync:', error);
  }
};

/**
 * Obtener test local por ID
 */
export const getTestLocally = async (id: string): Promise<ResistanceTest | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const test = await new Promise<ResistanceTest | null>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return test;
  } catch (error) {
    console.error('❌ Error obteniendo test local:', error);
    return null;
  }
};

/**
 * Obtener todos los tests locales
 */
export const getAllTestsLocally = async (): Promise<ResistanceTest[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const tests = await new Promise<ResistanceTest[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log(`📂 ${tests.length} tests en almacenamiento local`);
    return tests;
  } catch (error) {
    console.error('❌ Error obteniendo tests locales:', error);
    return [];
  }
};

/**
 * Eliminar test local
 */
export const deleteTestLocally = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log('🗑️ Test eliminado localmente:', id);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('❌ Error eliminando test local:', error);
    throw error;
  }
};

/**
 * Limpiar todos los datos locales (solo para testing/debug)
 */
export const clearAllLocalData = async (): Promise<void> => {
  try {
    const db = await initDB();
    
    const transaction = db.transaction([STORE_NAME, PENDING_SYNC_STORE], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(STORE_NAME).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(PENDING_SYNC_STORE).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);

    db.close();
    console.log('🧹 Todos los datos locales eliminados');
  } catch (error) {
    console.error('❌ Error limpiando datos locales:', error);
  }
};
