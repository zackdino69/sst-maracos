// Service worker: guarda la app en el celular la primera vez que se abre
// con señal, para que después funcione sin internet, incluso si pasan
// semanas sin conexión.
const CACHE = 'sst-cache-v1';
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE).then((cache)=> cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then((keys)=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estrategia: primero caché (funciona sin internet); si hay señal, de paso
// actualiza la copia guardada para la próxima vez.
self.addEventListener('fetch', (event)=>{
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached)=>{
      const network = fetch(event.request).then((resp)=>{
        if(resp && resp.ok){
          const copy = resp.clone();
          caches.open(CACHE).then(cache=> cache.put(event.request, copy));
        }
        return resp;
      }).catch(()=> cached);
      return cached || network;
    })
  );
});
