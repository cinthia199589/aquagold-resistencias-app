/**
 * 🌐 DETECTOR DE CONEXIÓN - MODO OFFLINE
 * 
 * Detecta si hay conexión a internet y permite trabajar offline
 * con datos locales de IndexedDB.
 */

import React, { useEffect, useState } from 'react';

/**
 * Hook para detectar estado de conexión
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log('🌐 Conexión restaurada');
      setIsOnline(true);
      setWasOffline(true);
      
      // Reset wasOffline después de 3 segundos
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      console.log('📴 Sin conexión - Modo offline activado');
      setIsOnline(false);
    };

    // Escuchar cambios de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};

/**
 * Verifica si hay conexión a internet
 */
export const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

/**
 * Intenta hacer ping a Firebase para verificar conectividad real
 */
export const checkFirebaseConnectivity = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    // Intentar fetch a Firebase con timeout corto
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://firestore.googleapis.com/', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 404; // 404 es OK, significa que Firebase responde
  } catch (error) {
    console.log('⚠️ Firebase no disponible, usando modo offline');
    return false;
  }
};

/**
 * Banner de estado offline
 */
export const OfflineBanner = ({ isOnline, wasOffline }: { isOnline: boolean; wasOffline: boolean }) => {
  if (isOnline && !wasOffline) {
    return null; // No mostrar nada si está online
  }

  if (!isOnline) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-400 dark:border-yellow-600 px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-yellow-800 dark:text-yellow-300 font-medium">
            📴 Sin conexión - Trabajando en modo offline
          </span>
        </div>
        <p className="text-xs text-yellow-700 dark:text-yellow-400 text-center mt-1">
          Los datos se sincronizarán automáticamente cuando vuelva la conexión
        </p>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="bg-green-100 dark:bg-green-900/30 border-b-2 border-green-400 dark:border-green-600 px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-green-800 dark:text-green-300 font-medium">
            ✅ Conexión restaurada - Sincronizando datos...
          </span>
        </div>
      </div>
    );
  }

  return null;
};
