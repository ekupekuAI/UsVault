import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const env = import.meta.env

// `npm run dev:local` talks to the local Firebase Emulator Suite; no real keys needed there.
export const useEmulators = String(env.VITE_USE_FIREBASE_EMULATORS || '').trim().toLowerCase() === 'true'

const REQUIRED_FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export const missingFirebaseEnv = useEmulators
  ? []
  : REQUIRED_FIREBASE_ENV.filter((key) => !String(env[key] || '').trim())

export const firebaseConfigured = missingFirebaseEnv.length === 0

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (useEmulators ? 'demo-key' : ''),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (useEmulators ? 'localhost' : ''),
  projectId: env.VITE_FIREBASE_PROJECT_ID || (useEmulators ? 'demo-usvault' : ''),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (useEmulators ? 'demo-usvault.appspot.com' : ''),
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (useEmulators ? '0' : ''),
  appId: env.VITE_FIREBASE_APP_ID || (useEmulators ? 'demo-app' : ''),
}

if (!firebaseConfigured) {
  console.warn(`Missing Firebase env vars: ${missingFirebaseEnv.join(', ')}`)
}

const bucket = String(env.VITE_FIREBASE_STORAGE_BUCKET || '')
if (bucket.endsWith('.firebasestorage.app')) {
  console.warn(
    'Storage bucket is set to .firebasestorage.app. Verify this is correct in Firebase Console; many projects must use <project-id>.appspot.com.',
  )
}

// Only initialise when configured: getAuth() throws auth/invalid-api-key otherwise,
// which used to leave a blank page with no explanation (main.jsx shows a setup message).
export const app = firebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null

if (app && useEmulators) {
  const host = String(env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1')
  connectAuthEmulator(auth, `http://${host}:${env.VITE_AUTH_EMULATOR_PORT || 6209}`, { disableWarnings: true })
  connectFirestoreEmulator(db, host, Number(env.VITE_FIRESTORE_EMULATOR_PORT || 62091))
  connectStorageEmulator(storage, host, Number(env.VITE_STORAGE_EMULATOR_PORT || 62092))
} else if (db && typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {
    // Persistence may fail on private mode / multi-tab conflicts.
  })
}
