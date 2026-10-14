import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isAdminEmail } from '../config/adminAccess'
import { isAllowedEmail, strictModeEnabled } from '../config/accessControl'
import { auth } from '../firebase/config'
import {
  ensureUserAccessControl,
  getBlockedMessage,
  isUserBlocked,
  saveUserProfile,
} from '../services/journalService'

const AuthContext = createContext(null)

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
}

function describeAuthError(error, fallback) {
  return AUTH_ERROR_MESSAGES[error?.code] || fallback
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [userAccessControl, setUserAccessControl] = useState(null)

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {})
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !isAllowedEmail(firebaseUser.email)) {
        setAuthError('This account is not part of your 2-user UsVault list.')
        setUserAccessControl(null)
        setUser(null)
        setLoading(false)
        await signOut(auth)
        return
      }

      if (firebaseUser) {
        try {
          const accessControl = await ensureUserAccessControl(firebaseUser.uid, firebaseUser.email)
          setUserAccessControl(accessControl)

          if (isUserBlocked(accessControl)) {
            setAuthError(getBlockedMessage(accessControl))
            setUser(null)
            setLoading(false)
            await signOut(auth)
            return
          }
        } catch {
          setAuthError('Unable to verify access right now. Please try again.')
          setUserAccessControl(null)
          setUser(null)
          setLoading(false)
          await signOut(auth).catch(() => {})
          return
        }
      } else {
        setUserAccessControl(null)
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
    } catch (error) {
      setAuthError(describeAuthError(error, 'Login failed. Check email/password and try again.'))
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
    } catch (error) {
      setAuthError(describeAuthError(error, 'Signup failed. Please try again.'))
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
      await ensureUserAccessControl(userCredential.user.uid, normalizedEmail)
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
    } catch (error) {
      setAuthError(describeAuthError(error, 'Signup failed. Please try again.'))
      return false
    }
  }

  async function logout() {
    await signOut(auth)
  }

  const isAdmin = isAdminEmail(user?.email)

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      strictModeEnabled,
      userAccessControl,
      isAdmin,
      login,
      register,
      registerWithProfile,
      logout,
    }),
    [authError, isAdmin, loading, user, userAccessControl],
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
