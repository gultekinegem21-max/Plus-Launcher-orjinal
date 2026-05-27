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
    
    if (url.pathname === '/icon-192.png') {
      e.respondWith(
        caches.match(e.request).then(response => {
          return response || fetch('https://ui-avatars.com/api/?name=Plus+Launcher&size=192&background=1e3a8a&color=fff', { mode: 'cors' }).then(res => {
            const clone = res.clone();
            caches.open('pwa-icons').then(cache => cache.put(e.request, clone));
            return new Response(res.body, { headers: { 'Content-Type': 'image/png' } });
          });
        })
      );
      return;
    }

    if (url.pathname === '/icon-512.png') {
      e.respondWith(
        caches.match(e.request).then(response => {
          return response || fetch('https://ui-avatars.com/api/?name=Plus+Launcher&size=512&background=1e3a8a&color=fff', { mode: 'cors' }).then(res => {
            const clone = res.clone();
            caches.open('pwa-icons').then(cache => cache.put(e.request, clone));
            return new Response(res.body, { headers: { 'Content-Type': 'image/png' } });
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
