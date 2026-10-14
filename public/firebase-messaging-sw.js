/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-messaging-compat.js')

// The app registers this worker as /firebase-messaging-sw.js?apiKey=...&projectId=...
// so the Firebase web config comes from the build's env vars instead of being hardcoded.
const params = new URL(self.location.href).searchParams
const config = {
  apiKey: params.get('apiKey') || '',
  authDomain: params.get('authDomain') || '',
  projectId: params.get('projectId') || '',
  storageBucket: params.get('storageBucket') || '',
  messagingSenderId: params.get('messagingSenderId') || '',
  appId: params.get('appId') || '',
}

const messaging =
  config.apiKey && config.projectId && config.messagingSenderId && config.appId
    ? (firebase.initializeApp(config), firebase.messaging())
    : null

messaging?.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'UsVault'
  const options = {
    body: payload?.notification?.body || 'Tell me about your day \u{1F4AD}',
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    data: payload?.data || {},
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification?.data?.click_action || '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
        return null
      }),
  )
})
