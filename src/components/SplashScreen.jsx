import { AnimatePresence, motion } from 'framer-motion'

function UsVaultLogo({ size = 'md' }) {
  const MotionG = motion.g
  const iconSize = size === 'lg' ? 90 : size === 'sm' ? 56 : 74

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vaultGlow" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c084fc" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <rect
          x="10"
          y="20"
          width="44"
          height="34"
          rx="12"
          fill="white"
          fillOpacity="0.66"
          stroke="url(#vaultGlow)"
          strokeWidth="2"
        />
        <MotionG
          style={{ transformOrigin: '32px 40px' }}
          animate={{ scale: [1, 1.16, 1] }}
          transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <path
            d="M32 36.5L29.8 34.3C28.1 32.6 25.3 32.6 23.6 34.3C21.9 36 21.9 38.8 23.6 40.5L32 48.9L40.4 40.5C42.1 38.8 42.1 36 40.4 34.3C38.7 32.6 35.9 32.6 34.2 34.3L32 36.5Z"
            fill="url(#vaultGlow)"
          />
        </MotionG>
        <path
          d="M20 20V16C20 9.4 25.4 4 32 4C38.6 4 44 9.4 44 16V20"
          stroke="#c084fc"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function SplashScreen({ visible, mode = 'entry' }) {
  const MotionDiv = motion.div
  const isEntry = mode === 'entry'
  const isLogoIntro = mode === 'logoIntro'

  return (
    <AnimatePresence>
      {visible && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isEntry ? 0.42 : 0.36, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-rose-100/90 via-fuchsia-50/85 to-violet-100/82" />

          <MotionDiv
            initial={
              isEntry ? { opacity: 0, y: 10, scale: 0.97 } : { opacity: 0, y: 8, scale: 0.86 }
            }
            animate={
              isEntry ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1.1 }
            }
            exit={
              isEntry ? { opacity: 0, y: -8, scale: 0.98 } : { opacity: 0, y: -6, scale: 1.16 }
            }
            transition={{ duration: isEntry ? 0.5 : 0.72, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center px-6 text-center"
          >
            <UsVaultLogo size={isLogoIntro ? 'lg' : 'md'} />
            <p className={`mt-2 font-bold tracking-wide text-violet-700 ${isLogoIntro ? 'text-4xl' : 'text-3xl'}`}>
              UsVault
            </p>
            {isEntry && (
              <p className="mt-1 text-sm font-semibold tracking-wide text-violet-700/90">
                A space for us {'\u{1F49C}'}
              </p>
            )}
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

export default SplashScreen
