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
const DB_VERSION = 2; // Incrementado para agregar metadata store
const STORE_NAME = 'resistance_tests';
const PENDING_SYNC_STORE = 'pending_sync';
const METADATA_STORE = 'sync_metadata';

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

      // Crear store para metadata (timestamps de sync, etc)
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        console.log('✅ Store de metadata creado');
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
 * Obtener todos los tests locales (filtra metadata y registros reservados)
 */
export const getAllTestsLocally = async (): Promise<ResistanceTest[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const allRecords = await new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Filtrar registros metadata y registros reservados (que empiezan con __)
    const tests = allRecords.filter(record => {
      // Excluir si el ID empieza con __ (metadata o reservados)
      if (record.id && record.id.startsWith('__')) {
        return false;
      }
      // Excluir si no tiene estructura de test válida
      if (!record.lotNumber || !record.date) {
        return false;
      }
      return true;
    }) as ResistanceTest[];

    db.close();
    console.log(`📂 ${tests.length} tests válidos en almacenamiento local (${allRecords.length - tests.length} registros metadata filtrados)`);
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

// ============================================
// SINCRONIZACIÓN INCREMENTAL INTELIGENTE
// ============================================

const MAX_LOCAL_TESTS = 50; // Mantener solo las últimas 50 resistencias localmente

/**
 * Guardar timestamp de última sincronización en IndexedDB (SOLO local, NO en Firestore)
 */
export const saveLastSyncTimestamp = async (timestamp: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(METADATA_STORE);

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key: 'lastSync', timestamp });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log('⏱️ Última sincronización guardada:', timestamp);
  } catch (error) {
    console.error('❌ Error guardando timestamp:', error);
  }
};

/**
 * Obtener timestamp de última sincronización desde IndexedDB (SOLO local)
 */
export const getLastSyncTimestamp = async (): Promise<string | null> => {
  try {
    const db = await initDB();

    if (!db.objectStoreNames.contains(METADATA_STORE)) {
      db.close();
      return null;
    }

    const transaction = db.transaction([METADATA_STORE], 'readonly');
    const store = transaction.objectStore(METADATA_STORE);

    const result = await new Promise<string | null>((resolve) => {
      const request = store.get('lastSync');
      request.onsuccess = () => {
        const data = request.result;
        resolve(data?.timestamp || null);
      };
      request.onerror = () => resolve(null);
    });

    db.close();
    return result;
  } catch (error) {
    console.error('❌ Error obteniendo timestamp:', error);
    return null;
  }
};

/**
 * Mantener solo las últimas 50 resistencias en IndexedDB
 * Elimina las más antiguas automáticamente
 */
export const cleanOldTestsFromLocal = async (): Promise<number> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');

    // Obtener todos los tests ordenados por fecha (más recientes primero)
    const allTests = await new Promise<ResistanceTest[]>((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // 'prev' = descendente
      const tests: ResistanceTest[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const value = cursor.value;
          // Excluir metadata (como __lastSync__)
          if (!value.id?.startsWith('__')) {
            tests.push(value);
          }
          cursor.continue();
        } else {
          resolve(tests);
        }
      };
      request.onerror = () => reject(request.error);
    });

    // Si hay más de 50, eliminar los más antiguos
    if (allTests.length > MAX_LOCAL_TESTS) {
      const testsToDelete = allTests.slice(MAX_LOCAL_TESTS);
      
      for (const test of testsToDelete) {
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(test.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }

      db.close();
      console.log(`🧹 Eliminados ${testsToDelete.length} tests antiguos (manteniendo últimos ${MAX_LOCAL_TESTS})`);
      return testsToDelete.length;
    }

    db.close();
    return 0;
  } catch (error) {
    console.error('❌ Error limpiando tests antiguos:', error);
    return 0;
  }
};

/**
 * Guardar múltiples tests en IndexedDB (batch save)
 */
export const saveTestsBatch = async (tests: ResistanceTest[]): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const test of tests) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(test);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    db.close();
    console.log(`💾 ${tests.length} tests guardados localmente en batch`);
  } catch (error) {
    console.error('❌ Error en batch save:', error);
    throw error;
  }
};

/**
 * Limpiar registros metadata antiguos (migración de v1 a v2)
 * Elimina el registro __lastSync__ que quedó en resistance_tests
 */
export const cleanOldMetadataRecords = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Buscar y eliminar registros que empiecen con __
    const allKeys = await new Promise<string[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });

    const keysToDelete = allKeys.filter(key => key.startsWith('__'));
    
    if (keysToDelete.length > 0) {
      for (const key of keysToDelete) {
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }
      console.log(`🧹 Eliminados ${keysToDelete.length} registros metadata antiguos (${keysToDelete.join(', ')})`);
    }

    db.close();
  } catch (error) {
    console.error('❌ Error limpiando metadata antigua:', error);
  }
};

