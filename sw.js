const CACHE_NAME = 'inv-itpa-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/supabase-client.js',
  '/js/data.js',
  '/js/app.js',
  '/js/auth.js',
  '/js/cart.js',
  '/js/carts.js',
  '/js/modal.js',
  '/js/summary.js',
  '/js/users.js',
  '/js/transactions.js',
  '/js/bulk.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first (but falls back to network)
self.addEventListener('fetch', e => {
  // Only cache GET requests
  if (e.request.method !== 'GET') return;

  // Do not cache Supabase API calls
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
