/**
 * 🔄 Componente para mostrar estado de sincronización en background
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getPendingOperationsCount, manualSync } from '../lib/backgroundSyncService';

export function BackgroundSyncIndicator() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Actualizar contador de pendientes cada 5 segundos
  useEffect(() => {
    const updateCount = () => {
      const count = getPendingOperationsCount();
      setPendingCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // Detectar estado online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronización manual
  const handleManualSync = async () => {
    if (!isOnline || isSyncing || pendingCount === 0) return;

    setIsSyncing(true);
    try {
      const result = await manualSync();
      setLastSync(new Date());
      
      if (result.success > 0) {
        // Mostrar notificación de éxito (opcional)
        console.log(`✅ ${result.success} operaciones sincronizadas`);
      }
      
      // Actualizar contador
      setPendingCount(getPendingOperationsCount());
    } catch (error) {
      console.error('❌ Error en sincronización manual:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // No mostrar nada si no hay operaciones pendientes y está online
  if (pendingCount === 0 && isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Badge de operaciones pendientes */}
      {pendingCount > 0 && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border-2 transition-all ${
            isOnline
              ? 'border-blue-500 hover:shadow-xl cursor-pointer'
              : 'border-yellow-500'
          }`}
          onClick={isOnline ? handleManualSync : undefined}
        >
          <div className="flex items-center gap-3">
            {/* Ícono */}
            <div className="relative">
              {isSyncing ? (
                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              ) : isOnline ? (
                <Clock className="h-5 w-5 text-blue-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              
              {/* Badge con número */}
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>

            {/* Texto */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isSyncing
                  ? 'Sincronizando...'
                  : isOnline
                  ? 'Pendientes de sync'
                  : 'Sin conexión'}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isSyncing
                  ? 'Por favor espera'
                  : isOnline
                  ? `${pendingCount} ${pendingCount === 1 ? 'operación' : 'operaciones'} • Click para sincronizar`
                  : 'Se sincronizará al reconectar'}
              </span>
            </div>

            {/* Indicador de última sincronización */}
            {lastSync && !isSyncing && (
              <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
            )}
          </div>

          {/* Barra de progreso (si está sincronizando) */}
          {isSyncing && (
            <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '70%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mini indicador para mostrar en header
 */
export function SyncBadge() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setPendingCount(getPendingOperationsCount());
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) return null;

  return (
    <div className="relative inline-flex items-center justify-center">
      <RefreshCw className="h-4 w-4 text-blue-500" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
        {pendingCount > 9 ? '9' : pendingCount}
      </span>
    </div>
  );
}
