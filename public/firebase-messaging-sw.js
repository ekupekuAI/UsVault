/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.8.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD3MUGGlf8v3TH2go9OCuNOrhJr1EY4r1Q',
  authDomain: 'usvault-78741.firebaseapp.com',
  projectId: 'usvault-78741',
  storageBucket: 'usvault-78741.firebasestorage.app',
  messagingSenderId: '97973712303',
  appId: '1:97973712303:web:caea9a29b01c861aa22b5a',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'UsVault'
  const options = {
    body: payload?.notification?.body || 'Tell me about your day \u{1F4AD}',
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    data: payload?.data || {},
  }

  self.registration.showNotification(title, options)
})
