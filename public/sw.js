self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  try {
    const url = new URL(e.request.url);
    if (url.pathname === '/dynamic-manifest.json' || url.pathname.startsWith('/dynamic-icon-')) {
      e.respondWith(
        caches.open('dynamic-pwa').then(cache => {
          return cache.match(url.pathname).then(response => {
             return response || fetch(e.request);
          });
        })
      );
      return;
    }
  } catch(err) {
    // ignore
  }
  
  // Pass through everything else
  e.respondWith(fetch(e.request));
});
