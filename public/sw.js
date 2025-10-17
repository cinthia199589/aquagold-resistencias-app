// Service Worker para PWA - Aquagold Resistencias SPA
const CACHE_NAME = 'aquagold-resistencias-v2.2.0'; // ⬅️ VERSIÓN ACTUALIZADA
const RUNTIME_CACHE = 'runtime-cache-v2.2.0';

// Recursos críticos para cachear en instalación
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/dashboard/',
  '/dashboard/tests/new/',
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache creado, añadiendo assets...');
      return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { cache: 'reload' }))).catch((error) => {
        console.log('[SW] Algunos assets no pudieron ser cacheados:', error);
      });
    })
  );
  self.skipWaiting();
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

// Interceptar solicitudes (Network first, fallback to cache)
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

  // Network First para navegación, HTML y Firebase/API calls
  if (request.mode === 'navigate' || 
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/') ||
      url.href.includes('firestore') ||
      url.href.includes('firebase') ||
      url.href.includes('graph.microsoft.com')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear la respuesta si es exitosa
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, devolver del cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback a index para SPA routing
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline - Recurso no disponible', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
        })
    );
    return;
  }

  // Cache First para assets estáticos (JS, CSS, imágenes, fuentes)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot)$/)) {
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
        });
      })
    );
    return;
  }

  // Para otros recursos locales, Network First
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
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
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
        })
    );
  }
});

// Background sync (opcional - para sincronización offline)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Sincronizando datos...');
  // Implementar lógica de sincronización si es necesario
}

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('Aquagold Resistencias', options)
  );
});

console.log('[SW] Service Worker SPA+PWA cargado correctamente');

