self.addEventListener('push', event => {
  event.waitUntil(self.registration.showNotification('FITA Regolamento', {
    body: 'È stata pubblicata una nuova notizia. Tocca per aprire il portale.',
    icon: '/fita-app.svg',
    tag: 'fita-news',
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const home = clients.find(client => client.url === new URL('/', self.location.origin).href);
    return home ? home.focus() : self.clients.openWindow('/');
  }));
});
