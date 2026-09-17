// Service Worker AntiLapin pour PWA & Notifications Push d'arrière-plan
const CACHE_NAME = 'antilapin-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Écoute des notifications Push réseau (Web Push)
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 Nouvelle Réservation !',
    body: 'Une cliente vient de réserver une prestation dans votre salon.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'booking-alert',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'booking-alert',
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 400],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur une notification push sur l'écran de veille
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
