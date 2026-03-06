const CACHE_NAME = 'dev-console-v1';
const SHELL_FILES = [
  '/dev-console/index.html',
  '/dev-console/js/config.js',
  '/dev-console/js/app.js',
  '/dev-console/js/chat.js',
  '/dev-console/js/files.js',
  '/dev-console/js/logs.js',
  '/dev-console/js/commands.js',
  '/dev-console/js/manager.js',
  '/dev-console/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for API calls
  if (e.request.url.includes('/api/') || e.request.url.includes('/webhook/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
