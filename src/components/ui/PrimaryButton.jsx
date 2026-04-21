import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { hoverLift, quickSpring, tapPress } from '../motion/motionTokens'

function PrimaryButton({ className = '', children, onClick, ...props }) {
  const MotionButton = motion.button
  const [auraActive, setAuraActive] = useState(false)

  useEffect(() => {
    if (!auraActive) {
      return undefined
    }

    const timerId = window.setTimeout(() => setAuraActive(false), 260)
    return () => window.clearTimeout(timerId)
  }, [auraActive])

  function handleClick(event) {
    setAuraActive(true)
    onClick?.(event)
  }

  return (
    <MotionButton
      {...props}
      onClick={handleClick}
      whileHover={hoverLift}
      whileTap={tapPress}
      transition={quickSpring}
      style={{
        backgroundImage: 'linear-gradient(180deg, color-mix(in srgb, var(--theme-secondary) 38%, white), var(--theme-primary))',
        boxShadow: '0 12px 24px color-mix(in srgb, var(--theme-primary) 38%, transparent)',
      }}
      className={`premium-button relative min-h-[44px] overflow-hidden rounded-[14px] border border-white/55 px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-[inherit] ${auraActive ? 'button-aura' : ''}`}
      />
      <span className="relative z-10">{children}</span>
    </MotionButton>
  )
}

export default PrimaryButton
