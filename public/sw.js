self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || ''
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('https://ellioth.othdb.de/');
    })
  );
});

