// Service Worker para PWA - Resistencias SPA
const CACHE_NAME = 'resistencias-v2.3.1'; // ⬅️ VERSIÓN ACTUALIZADA - Nombre simplificado
const RUNTIME_CACHE = 'runtime-cache-v2.3.1';

// Recursos críticos para cachear en instalación (MÍNIMOS NECESARIOS)
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v2.2.1...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache creado, añadiendo assets críticos...');
      // Intentar cachear assets críticos, pero no fallar si algunos no están disponibles
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(new Request(url, { cache: 'reload' }))
            .catch(err => console.log(`[SW] No se pudo cachear ${url}:`, err))
        )
      );
    }).then(() => {
      console.log('[SW] Service Worker instalado correctamente');
    })
  );
  self.skipWaiting(); // Activar inmediatamente
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Interceptar solicitudes (OFFLINE FIRST - prioridad cache para SPA)
self.addEventListener('fetch', (event) => {
  // Solo interceptar solicitudes GET
  if (event.request.method !== 'GET') {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin y chrome extensions
  if (!url.origin.startsWith(self.location.origin) || url.protocol === 'chrome-extension:') {
    return;
  }

  // 🔥 CRÍTICO: Para navegación (abrir app), SIEMPRE devolver del cache primero
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Si hay cache, devolverlo INMEDIATAMENTE (funciona offline)
        if (cachedResponse) {
          console.log('[SW] 📦 Sirviendo navegación desde cache:', url.pathname);
          
          // En paralelo, intentar actualizar cache en background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => console.log('[SW] 📴 Sin conexión, usando cache'));
          
          return cachedResponse;
        }

        // Si NO hay cache, intentar red
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Si falla la red y no hay cache, devolver fallback
            console.log('[SW] ❌ Sin cache y sin red, devolviendo fallback');
            return caches.match('/').then((fallback) => {
              return fallback || new Response(
                '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Sin conexión</h1><p>Por favor conecta a internet para usar la app por primera vez</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          });
      })
    );
    return;
  }

  // Firebase/API calls - Network First con timeout
  if (url.href.includes('firestore') || 
      url.href.includes('firebase') ||
      url.href.includes('graph.microsoft.com')) {
    
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ])
        .then((response) => {
          return response;
        })
        .catch(() => {
          console.log('[SW] 📴 API offline, usando cache local (IndexedDB)');
          // No retornar nada, dejar que la app use IndexedDB
          return new Response('{"offline": true}', {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Cache First para assets estáticos (JS, CSS, imágenes, fuentes)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] 📦 Asset desde cache:', url.pathname.split('/').pop());
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Para chunks de Next.js (_next/static/chunks/*)
  if (url.pathname.includes('/_next/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Si falla, buscar en cache general
          return caches.match('/');
        });
      })
    );
    return;
  }

  // Default: Network First con fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match('/');
        });
      })
  );
});

// 🔄 BACKGROUND SYNC - Sincronización automática cuando vuelve conexión
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync disparado:', event.tag);
  
  if (event.tag === 'sync-resistance-data') {
    event.waitUntil(syncPendingResistanceData());
  }
});

/**
 * Sincroniza datos pendientes de resistencias
 * Se ejecuta automáticamente cuando hay conexión
 */
async function syncPendingResistanceData() {
  console.log('[SW] 📤 Iniciando sincronización de datos pendientes...');
  
  try {
    // Obtener operaciones pendientes de IndexedDB/LocalStorage
    const pendingOperations = await getPendingOperations();
    
    if (pendingOperations.length === 0) {
      console.log('[SW] ✅ No hay operaciones pendientes');
      return;
    }
    
    console.log(`[SW] 📋 ${pendingOperations.length} operaciones pendientes encontradas`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Procesar cada operación pendiente
    for (const operation of pendingOperations) {
      try {
        await executeOperation(operation);
        await removePendingOperation(operation.id);
        successCount++;
        console.log(`[SW] ✅ Operación ${operation.id} sincronizada`);
      } catch (error) {
        failCount++;
        console.error(`[SW] ❌ Error en operación ${operation.id}:`, error);
        // Mantener en cola para reintentar después
      }
    }
    
    console.log(`[SW] 🎉 Sincronización completada: ${successCount} éxito, ${failCount} fallos`);
    
    // Mostrar notificación de éxito si hay operaciones completadas
    if (successCount > 0) {
      await self.registration.showNotification('Resistencias - Sincronizado', {
        body: `${successCount} ${successCount === 1 ? 'operación sincronizada' : 'operaciones sincronizadas'} correctamente`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'sync-success',
        requireInteraction: false,
        silent: false
      });
    }
    
  } catch (error) {
    console.error('[SW] ❌ Error general en sincronización:', error);
    
    // Mostrar notificación de error
    await self.registration.showNotification('Resistencias - Error de Sync', {
      body: 'No se pudieron sincronizar algunos datos. Se reintentará automáticamente.',
      icon: '/icon-192.png',
      tag: 'sync-error',
      requireInteraction: false
    });
  }
}

/**
 * Obtener operaciones pendientes del almacenamiento local
 */
async function getPendingOperations() {
  try {
    // Intentar leer de localStorage (compatible con sistema actual)
    const pendingData = localStorage.getItem('pending_sync_operations');
    if (pendingData) {
      return JSON.parse(pendingData);
    }
    return [];
  } catch (error) {
    console.error('[SW] ❌ Error obteniendo operaciones pendientes:', error);
    return [];
  }
}

/**
 * Ejecutar una operación pendiente
 */
async function executeOperation(operation) {
  const { type, data, timestamp } = operation;
  
  console.log(`[SW] 🔄 Ejecutando operación ${type}...`);
  
  // Simular ejecución - En producción, hacer llamadas reales a API
  switch (type) {
    case 'save_test':
      // await saveTestToFirestore(data);
      break;
    case 'update_test':
      // await updateTestInFirestore(data);
      break;
    case 'delete_test':
      // await deleteTestFromFirestore(data.id);
      break;
    default:
      console.warn(`[SW] ⚠️ Tipo de operación desconocida: ${type}`);
  }
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Remover operación pendiente después de sincronizar
 */
async function removePendingOperation(operationId) {
  try {
    const pendingData = localStorage.getItem('pending_sync_operations');
    if (pendingData) {
      let operations = JSON.parse(pendingData);
      operations = operations.filter(op => op.id !== operationId);
      localStorage.setItem('pending_sync_operations', JSON.stringify(operations));
    }
  } catch (error) {
    console.error('[SW] ❌ Error removiendo operación:', error);
  }
}

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('Resistencias', options)
  );
});

console.log('[SW] Service Worker SPA+PWA cargado correctamente');

