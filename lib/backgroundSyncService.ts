/**
 * 🔄 Background Sync Service
 * Gestiona la sincronización automática de datos cuando la app vuelve online
 */

interface PendingOperation {
  id: string;
  type: 'save_test' | 'update_test' | 'delete_test' | 'upload_photo';
  data: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'pending_sync_operations';
const MAX_RETRIES = 3;

/**
 * Registrar Service Worker para Background Sync
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker no soportado');
    return false;
  }

  if (!('SyncManager' in window)) {
    console.warn('⚠️ Background Sync no soportado');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - Background Sync API no está en tipos de TypeScript aún
    if ('sync' in registration) {
      // @ts-ignore
      await registration.sync.register('sync-resistance-data');
      console.log('✅ Background Sync registrado correctamente');
      return true;
    } else {
      console.warn('⚠️ Background Sync no disponible en este navegador');
      return false;
    }
  } catch (error) {
    console.error('❌ Error registrando Background Sync:', error);
    return false;
  }
}

/**
 * Agregar operación a la cola de sincronización
 */
export async function addPendingOperation(
  type: PendingOperation['type'],
  data: any
): Promise<void> {
  try {
    const operations = getPendingOperations();
    
    const newOperation: PendingOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    operations.push(newOperation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    
    console.log(`📝 Operación ${type} agregada a cola de sync`);
    
    // Intentar registrar background sync inmediatamente
    await registerBackgroundSync();
    
  } catch (error) {
    console.error('❌ Error agregando operación pendiente:', error);
    throw error;
  }
}

/**
 * Obtener todas las operaciones pendientes
 */
export function getPendingOperations(): PendingOperation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('❌ Error obteniendo operaciones pendientes:', error);
    return [];
  }
}

/**
 * Obtener cantidad de operaciones pendientes
 */
export function getPendingOperationsCount(): number {
  return getPendingOperations().length;
}

/**
 * Limpiar operaciones completadas o con demasiados reintentos
 */
export function cleanupPendingOperations(): void {
  try {
    const operations = getPendingOperations();
    const filtered = operations.filter(op => op.retryCount < MAX_RETRIES);
    
    if (filtered.length !== operations.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(`🧹 ${operations.length - filtered.length} operaciones limpiadas`);
    }
  } catch (error) {
    console.error('❌ Error limpiando operaciones:', error);
  }
}

/**
 * Limpiar todas las operaciones pendientes (usar con cuidado)
 */
export function clearAllPendingOperations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🧹 Todas las operaciones pendientes eliminadas');
  } catch (error) {
    console.error('❌ Error limpiando operaciones:', error);
  }
}

/**
 * Sincronización manual (fallback si Background Sync no está disponible)
 */
export async function manualSync(): Promise<{ success: number; failed: number }> {
  console.log('🔄 Iniciando sincronización manual...');
  
  const operations = getPendingOperations();
  
  if (operations.length === 0) {
    console.log('✅ No hay operaciones pendientes');
    return { success: 0, failed: 0 };
  }
  
  let successCount = 0;
  let failedCount = 0;
  const remainingOperations: PendingOperation[] = [];
  
  for (const operation of operations) {
    try {
      // Aquí irían las llamadas reales a Firebase/OneDrive
      // Por ahora solo simulamos
      await simulateNetworkCall(operation);
      successCount++;
      console.log(`✅ Operación ${operation.id} sincronizada`);
    } catch (error) {
      console.error(`❌ Error en operación ${operation.id}:`, error);
      failedCount++;
      
      // Incrementar contador de reintentos
      operation.retryCount++;
      
      // Mantener en cola si no ha superado límite de reintentos
      if (operation.retryCount < MAX_RETRIES) {
        remainingOperations.push(operation);
      } else {
        console.warn(`⚠️ Operación ${operation.id} descartada (max reintentos)`);
      }
    }
  }
  
  // Actualizar localStorage con operaciones restantes
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingOperations));
  
  console.log(`🎉 Sync manual completado: ${successCount} éxito, ${failedCount} fallos`);
  
  return { success: successCount, failed: failedCount };
}

/**
 * Simular llamada de red (reemplazar con lógica real)
 */
async function simulateNetworkCall(operation: PendingOperation): Promise<void> {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simular éxito/fallo aleatorio para testing
  if (Math.random() > 0.9) {
    throw new Error('Simulated network error');
  }
}

/**
 * Hook para inicializar Background Sync al cargar la app
 */
export function initBackgroundSync(): void {
  if (typeof window === 'undefined') return;
  
  // Registrar service worker y background sync
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Intentar registrar background sync
        await registerBackgroundSync();
        
        // Limpiar operaciones antiguas
        cleanupPendingOperations();
        
        // Mostrar contador de operaciones pendientes
        const pendingCount = getPendingOperationsCount();
        if (pendingCount > 0) {
          console.log(`📋 ${pendingCount} operaciones pendientes de sincronizar`);
        }
        
      } catch (error) {
        console.error('❌ Error inicializando Background Sync:', error);
      }
    });
  }
  
  // Listener para detectar cuando vuelve la conexión
  window.addEventListener('online', async () => {
    console.log('🌐 Conexión restaurada, intentando sincronizar...');
    
    // Intentar background sync automático
    const bgSyncRegistered = await registerBackgroundSync();
    
    // Si no está disponible, hacer sync manual
    if (!bgSyncRegistered) {
      await manualSync();
    }
  });
}

/**
 * Remover operación específica de la cola
 */
export function removePendingOperation(operationId: string): void {
  try {
    const operations = getPendingOperations();
    const filtered = operations.filter(op => op.id !== operationId);

    if (filtered.length !== operations.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(`🗑️ Operación ${operationId} removida de la cola`);
    }
  } catch (error) {
    console.error('❌ Error removiendo operación:', error);
  }
}

/**
 * Componente React para mostrar estado de sincronización
 */
export function usePendingOperations() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    const updateCount = () => {
      setCount(getPendingOperationsCount());
    };
    
    updateCount();
    const interval = setInterval(updateCount, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return count;
}

// Export para React
import React from 'react';
