self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

async function getNewsNotice(event) {
  if (event.data) return event.data.json();

  // Subscriptions created before encrypted payloads are refreshed on the next visit.
  const response = await fetch('/api/news', { cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) return null;
  const { news } = await response.json();
  return (news || []).filter(item => Date.parse(item.publishedAt))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0] || null;
}

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const item = await getNewsNotice(event).catch(() => null);
    const category = typeof item?.category === 'string' ? item.category.trim().slice(0, 60) : '';
    const title = typeof item?.title === 'string' ? item.title.trim().slice(0, 250) : '';
    await self.registration.showNotification(category ? 'FITA · ' + category : 'FITA Regolamento', {
      body: title || 'Nuova notizia nel portale FITA.',
      icon: '/fita-home-icon.png',
      badge: '/fita-notification-badge.png?v=2',
      tag: item?.id ? 'fita-' + item.id : 'fita-news',
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const home = clients.find(client => client.url === new URL('/', self.location.origin).href);
    return home ? home.focus() : self.clients.openWindow('/');
  }));
});
