import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function validateFirebaseEnvironment() {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]

  const missing = required.filter((key) => !String(import.meta.env[key] || '').trim())
  if (missing.length > 0) {
    console.warn(`Missing Firebase env vars: ${missing.join(', ')}`)
  }

  const bucket = String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '')
  if (bucket.endsWith('.firebasestorage.app')) {
    console.warn(
      'Storage bucket is set to .firebasestorage.app. Verify this is correct in Firebase Console; many projects must use <project-id>.appspot.com.',
    )
  }
}

validateFirebaseEnvironment()

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {
    // Persistence may fail on private mode / multi-tab conflicts.
  })
}
