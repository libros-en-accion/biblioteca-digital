const CACHE_NAME = 'libractiva-v1';
const CACHE_ASSETS = [
  '/libros.json',
  '/colecciones.json',
  '/style.css',
  '/app.js',
  '/lucide.min.js',
  '/'
];

function normalizarUrl(url) {
  const u = new URL(url);
  u.searchParams.delete('v');
  return u.href;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        CACHE_ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' })
            .then(res => res.ok ? cache.put(normalizarUrl(url), res) : Promise.resolve())
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

  if (!/^\/(libros\.json|colecciones\.json|style\.css|app\.js|lucide\.min\.js|manifest\.json|favicon|icon-)/.test(path)) return;

  if (path === '/libros.json' || path === '/colecciones.json') {
    event.respondWith(
      caches.match(normalizarUrl(event.request.url)).then(cached =>
        cached || fetch(event.request).then(networkRes => {
          if (networkRes.ok) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(normalizarUrl(event.request.url), networkRes.clone())
            );
          }
          return networkRes;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(normalizarUrl(event.request.url)).then(cached => {
      const fetched = fetch(event.request).then(networkRes => {
        if (networkRes.ok) {
          caches.open(CACHE_NAME).then(cache =>
            cache.put(normalizarUrl(event.request.url), networkRes.clone())
          );
        }
        return networkRes;
      });
      return cached || fetched;
    })
  );
});
