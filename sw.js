const CACHE_NAME = 'libractiva-v17';
const CACHE_ASSETS = [
  '/',
  '/libros.json',
  '/colecciones.json',
  '/style.css?v=30',
  '/app.js?v=30',
  '/lucide.min.js',
  '/manifest.json',
  '/favicon.ico',
  '/portada-libractiva.jpeg'
];

function normalizarUrl(url) {
  try {
    const u = new URL(url, self.location.href);
    u.searchParams.delete('v');
    return u.href;
  } catch (e) {
    return url;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        CACHE_ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (res.ok) {
                return cache.put(normalizarUrl(url), res);
              }
              return Promise.resolve();
            })
            .catch(() => Promise.resolve())
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // No interceptar peticiones cruzadas ni APIs de servidor
  if (url.origin !== self.location.origin) return;
  if (path.startsWith('/api/')) return;

  // Interceptar portadas de libros con estrategia Cache-First
  if (path.startsWith('/portadas/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkRes => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkRes;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Interceptar catálogos (libros.json, colecciones.json) con estrategia Network-First
  // para que siempre se reciban libros nuevos inmediatamente sin depender de recargas
  if (path === '/libros.json' || path === '/colecciones.json') {
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(normalizarUrl(event.request.url), clone)
            );
          }
          return networkRes;
        })
        .catch(() => caches.match(normalizarUrl(event.request.url)))
    );
    return;
  }

  // Interceptar activos estáticos con Stale-While-Revalidate
  const esActivo = /^\/(style\.css|app\.js|lucide\.min\.js|manifest\.json|favicon|icon-|portada-)/.test(path) || path === '/' || path === '/index.html';

  if (!esActivo) return;

  event.respondWith(
    caches.match(normalizarUrl(event.request.url)).then(cached => {
      const fetchPromise = fetch(event.request).then(networkRes => {
        if (networkRes.ok) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(normalizarUrl(event.request.url), clone)
          );
        }
        return networkRes;
      }).catch(err => {
        if (cached) return cached;
        throw err;
      });

      return cached || fetchPromise;
    })
  );
});
