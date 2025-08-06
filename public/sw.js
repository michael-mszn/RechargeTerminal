// Force immediate activation of new service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', function (event) {
  let data = { title: 'Notification', body: 'Default message' };

  try {
    data = event.data.json();
  } catch (e) {
    // fallback if message is plain text
    data.body = event.data.text();
  }

  const options = {
    body: data.body
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://ellioth.othdb.de/')
  );
});
