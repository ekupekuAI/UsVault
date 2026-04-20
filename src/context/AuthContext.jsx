import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isAllowedEmail, strictModeEnabled } from '../config/accessControl'
import { auth } from '../firebase/config'
import { saveUserProfile } from '../services/journalService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !isAllowedEmail(firebaseUser.email)) {
        setAuthError('This account is not part of your 2-user UsVault list.')
        setUser(null)
        setLoading(false)
        await signOut(auth)
        return
      }

      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function login(email, password) {
    setAuthError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (strictModeEnabled && !isAllowedEmail(normalizedEmail)) {
      setAuthError('This email is not in VITE_ALLOWED_USERS.')
      return false
    }

    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password)
      return true
    } catch {
      setAuthError('Login failed. Check email/password and try again.')
      return false
    }
  }

  async function register(email, password) {
    setAuthError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (strictModeEnabled && !isAllowedEmail(normalizedEmail)) {
      setAuthError('This email is not in VITE_ALLOWED_USERS.')
      return false
    }

    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      return true
    } catch {
      setAuthError('Signup failed. Use an allowed email and stronger password.')
      return false
    }
  }

  async function registerWithProfile({ email, password, displayName, photoFile }) {
    setAuthError('')
    const normalizedEmail = email.trim().toLowerCase()

    if (strictModeEnabled && !isAllowedEmail(normalizedEmail)) {
      setAuthError('This email is not in VITE_ALLOWED_USERS.')
      return false
    }

    const trimmedName = String(displayName || '').trim()
    if (!trimmedName) {
      setAuthError('Please add your name.')
      return false
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      const profileResult = await saveUserProfile(userCredential.user.uid, normalizedEmail, {
        displayName: trimmedName,
        partnerName: 'Love',
        photoFile: photoFile || null,
      })

      await updateProfile(userCredential.user, {
        displayName: profileResult.displayName,
        photoURL: profileResult.photoURL || null,
      }).catch(() => {})

      return true
    } catch {
      setAuthError('Signup failed. Use an allowed email and stronger password.')
      return false
    }
  }

  async function logout() {
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      strictModeEnabled,
      login,
      register,
      registerWithProfile,
      logout,
    }),
    [authError, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
