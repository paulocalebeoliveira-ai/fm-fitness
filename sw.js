const CACHE = 'fm-fitness-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Estratégia simples: tenta a rede primeiro (para pegar sempre a versão mais nova
// do app e falar com o Supabase normalmente); se estiver offline, tenta o cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Recebe notificações push mesmo com o app fechado (enviadas pela Edge Function do Supabase).
self.addEventListener('push', (event) => {
  let data = { title: 'FM Fitness', body: 'Você tem uma novidade no app.' };
  try { if (event.data) data = event.data.json(); } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'FM Fitness', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
    })
  );
});

// Ao tocar na notificação, abre o app (ou foca a aba já aberta).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
