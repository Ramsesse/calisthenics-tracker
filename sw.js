self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('kalistenika-v1').then(cache => {
      return cache.addAll(['index.html', 'app.js', 'manifest.json']);
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Cache only local files (same origin)
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(response => response || fetch(e.request))
    );
  }
  // Iné requesty (napr. Google API) nechaj prejsť normálne
});
