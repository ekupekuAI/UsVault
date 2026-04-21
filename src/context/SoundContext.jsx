import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const SOUND_STORAGE_KEY = 'usvault_sound_enabled'

const SoundContext = createContext(null)

function createTonePlayer(audioContextRef) {
  return (frequency, duration, gainValue = 0.018, type = 'sine') => {
    const ContextClass = window.AudioContext || window.webkitAudioContext

    if (!ContextClass) {
      return
    }

    const context = audioContextRef.current || new ContextClass()
    audioContextRef.current = context
    if (context.state === 'suspended') {
      context.resume().catch(() => {})
    }

    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.start(now)
    oscillator.stop(now + duration + 0.03)
  }
}

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY)
    if (stored === null) {
      return true
    }
    return stored === 'true'
  })
  const audioContextRef = useRef(null)
  const tonePlayerRef = useRef(null)

  if (!tonePlayerRef.current && typeof window !== 'undefined') {
    tonePlayerRef.current = createTonePlayer(audioContextRef)
  }

  const playClick = useCallback(() => {
    if (!soundEnabled || !tonePlayerRef.current) {
      return
    }
    tonePlayerRef.current(640, 0.045, 0.02, 'triangle')
  }, [soundEnabled])

  const playChime = useCallback(() => {
    if (!soundEnabled || !tonePlayerRef.current) {
      return
    }

    tonePlayerRef.current(740, 0.08, 0.024, 'sine')
    window.setTimeout(() => tonePlayerRef.current?.(930, 0.11, 0.022, 'sine'), 90)
  }, [soundEnabled])

  const triggerHaptic = useCallback(
    (pattern = [16]) => {
      if (!soundEnabled) {
        return
      }
      if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
        return
      }
      navigator.vibrate(pattern)
    },
    [soundEnabled],
  )

  const playSuccess = useCallback(() => {
    playChime()
    triggerHaptic([18, 26, 18])
  }, [playChime, triggerHaptic])

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      const next = !current
      localStorage.setItem(SOUND_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  useEffect(() => {
    if (!soundEnabled) {
      return undefined
    }

    function handleButtonPress(event) {
      const target = event.target instanceof HTMLElement ? event.target : null
      if (!target) {
        return
      }

      const button = target.closest('button')
      if (button && !button.dataset.nosound) {
        playClick()
      }
    }

    window.addEventListener('pointerdown', handleButtonPress, { capture: true, passive: true })

    return () => {
      window.removeEventListener('pointerdown', handleButtonPress, true)
    }
  }, [playClick, soundEnabled])

  useEffect(() => {
    if (!soundEnabled) {
      return undefined
    }

    function unlockAudioContext() {
      const context = audioContextRef.current
      if (context && context.state === 'suspended') {
        context.resume().catch(() => {})
      }
    }

    window.addEventListener('pointerdown', unlockAudioContext, { capture: true, passive: true })
    return () => window.removeEventListener('pointerdown', unlockAudioContext, true)
  }, [soundEnabled])

  const value = useMemo(
    () => ({
      soundEnabled,
      toggleSound,
      playClick,
      playChime,
      playSuccess,
      triggerHaptic,
    }),
    [playChime, playClick, playSuccess, soundEnabled, toggleSound, triggerHaptic],
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() {
  const context = useContext(SoundContext)

  if (!context) {
    throw new Error('useSound must be used inside SoundProvider')
  }

  return context
}
