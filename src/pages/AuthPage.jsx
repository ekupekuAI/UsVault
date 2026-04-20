import { useEffect, useState } from 'react'
import OnboardingCarousel from '../components/OnboardingCarousel'
import PrimaryButton from '../components/ui/PrimaryButton'
import { allowedUsers } from '../config/accessControl'
import { POST_SIGNUP_INTRO_KEY } from '../constants/authFlow'
import { useAuth } from '../context/AuthContext'

function AuthPage({ authError }) {
  const { login, registerWithProfile, strictModeEnabled } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [signupStep, setSignupStep] = useState('form')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!profilePhoto) {
      setPhotoPreview('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(profilePhoto)
    setPhotoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [profilePhoto])

  useEffect(() => {
    setLocalError('')
  }, [mode, signupStep])

  function switchMode(nextMode) {
    setMode(nextMode)
    setSignupStep('form')
    setLocalError('')
  }

  function validateBasicFields() {
    const normalizedEmail = email.trim()
    if (!normalizedEmail || !password.trim()) {
      setLocalError('Please enter email and password.')
      return false
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return false
    }
    return true
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLocalError('')

    if (!validateBasicFields()) {
      return
    }

    setBusy(true)
    await login(email, password)
    setBusy(false)
  }

  function goToOnboarding(event) {
    event.preventDefault()
    setLocalError('')

    if (!validateBasicFields()) {
      return
    }
    if (!displayName.trim()) {
      setLocalError('Please enter your name before continuing.')
      return
    }
    setSignupStep('onboarding')
  }

  async function handleSignup() {
    setLocalError('')
    setBusy(true)

    sessionStorage.setItem(POST_SIGNUP_INTRO_KEY, '1')
    const ok = await registerWithProfile({
      email,
      password,
      displayName,
      photoFile: profilePhoto,
    })
    if (!ok) {
      sessionStorage.removeItem(POST_SIGNUP_INTRO_KEY)
    }
    setBusy(false)
  }

  const resolvedError = localError || authError

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 app-surface">
      <div className="card-soft w-full rounded-[30px] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-500">UsVault</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--ink-title)]">
          {mode === 'login' ? 'Welcome Back' : 'Create Your Space'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login'
            ? 'Login to your private couple vault.'
            : 'Minimal setup, then we begin.'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-violet-100 bg-white/70 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              mode === 'login' ? 'bg-violet-500 text-white' : 'text-violet-700'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              mode === 'signup' ? 'bg-violet-500 text-white' : 'text-violet-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {strictModeEnabled && (
          <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700">
            Allowed users: {allowedUsers.join(', ')}
          </p>
        )}

        <form className="mt-4 space-y-3" onSubmit={mode === 'login' ? handleLogin : goToOnboarding}>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-slate-200 bg-white/82 px-4 py-3 text-sm outline-none ring-violet-200 focus:ring"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-slate-200 bg-white/82 px-4 py-3 text-sm outline-none ring-violet-200 focus:ring"
          />

          {mode === 'signup' && signupStep === 'form' && (
            <>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-slate-200 bg-white/82 px-4 py-3 text-sm outline-none ring-violet-200 focus:ring"
              />
              <label className="block rounded-2xl border border-dashed border-violet-200 bg-white/65 px-4 py-3 text-sm text-violet-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                  Profile picture
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProfilePhoto(event.target.files?.[0] || null)}
                  className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:font-semibold file:text-violet-700"
                />
              </label>

              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-full border border-violet-200 object-cover"
                />
              )}
            </>
          )}

          {resolvedError && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{resolvedError}</p>
          )}

          {mode === 'login' && (
            <PrimaryButton type="submit" disabled={busy} className="w-full">
              {busy ? 'Please wait...' : 'Login'}
            </PrimaryButton>
          )}

          {mode === 'signup' && signupStep === 'form' && (
            <PrimaryButton type="submit" disabled={busy} className="w-full">
              Continue
            </PrimaryButton>
          )}
        </form>

        {mode === 'signup' && signupStep === 'onboarding' && (
          <div className="mt-1">
            <OnboardingCarousel />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSignupStep('form')}
                className="pressable rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Edit details
              </button>
              <PrimaryButton type="button" onClick={handleSignup} disabled={busy} className="w-full">
                {busy ? 'Creating...' : 'Create account'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default AuthPage
