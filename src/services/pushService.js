import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { app, firebaseConfig, useEmulators } from '../firebase/config'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
const FCM_SW_PATH = '/firebase-messaging-sw.js'
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope'

let foregroundUnsubscribe = null

async function getMessagingInstance() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!app || useEmulators) {
    return null
  }

  const supported = await isSupported()
  if (!supported) {
    return null
  }

  return getMessaging(app)
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const result = await Notification.requestPermission()
  return result
}

export function sendLocalNotification(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false
  }
  if (Notification.permission !== 'granted') {
    return false
  }

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192.svg',
      badge: '/pwa-192.svg',
    })
    return true
  } catch {
    return false
  }
}

async function registerMessagingServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  // The worker is a static file, so pass it the Firebase web config via its URL.
  const params = new URLSearchParams(firebaseConfig)
  return navigator.serviceWorker.register(`${FCM_SW_PATH}?${params.toString()}`, { scope: FCM_SW_SCOPE })
}

export async function initializePushNotifications() {
  if (!app || useEmulators) {
    return { permission: 'unsupported', token: null }
  }

  const permission = await requestNotificationPermission()

  if (permission !== 'granted') {
    return { permission, token: null }
  }

  const messaging = await getMessagingInstance()
  if (!messaging) {
    return { permission: 'unsupported', token: null }
  }

  if (!VAPID_KEY) {
    console.warn('VITE_FIREBASE_VAPID_KEY is missing. FCM token was not created.')
    return { permission, token: null }
  }

  try {
    const serviceWorkerRegistration = await registerMessagingServiceWorker()
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: serviceWorkerRegistration || undefined,
    })

    return { permission, token: token || null }
  } catch (error) {
    console.error('FCM token setup failed:', error)
    return { permission, token: null }
  }
}

export async function startForegroundNotifications() {
  const messaging = await getMessagingInstance()
  if (!messaging || foregroundUnsubscribe) {
    return foregroundUnsubscribe || (() => {})
  }

  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    const title = payload?.notification?.title || 'UsVault'
    const body = payload?.notification?.body || 'Tell me about your day \u{1F4AD}'
    sendLocalNotification(title, body)
  })

  return foregroundUnsubscribe
}

export function stopForegroundNotifications() {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe()
    foregroundUnsubscribe = null
  }
}
