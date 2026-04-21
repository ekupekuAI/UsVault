import { memo } from 'react'
import { motion } from 'framer-motion'

const FLOAT_ITEMS = [
  {
    key: 'heart-left',
    content: '\u{2665}',
    className: 'left-4 top-24 text-2xl',
    duration: 16,
    delay: 0,
  },
  {
    key: 'dot-center',
    content: '\u{25CF}',
    className: 'left-[48%] top-[22%] text-xs',
    duration: 20,
    delay: 1.6,
  },
  {
    key: 'heart-right',
    content: '\u{2665}',
    className: 'right-5 top-[40%] text-xl',
    duration: 18,
    delay: 0.9,
  },
  {
    key: 'sparkle-top',
    content: '\u2726',
    className: 'right-10 top-[16%] text-sm',
    duration: 14,
    delay: 1.2,
  },
]

const PARTICLES = Array.from({ length: 10 }, (_, index) => ({
  id: `particle-${index}`,
  left: `${8 + index * 9}%`,
  delay: (index % 5) * 1.1,
  duration: 14 + (index % 4) * 2,
}))

function FloatingRomanceDecor() {
  const MotionDiv = motion.div

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <MotionDiv
        aria-hidden="true"
        className="absolute -left-24 top-[14%] h-72 w-72 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, var(--theme-bg-a) 0%, color-mix(in srgb, var(--theme-primary) 16%, transparent) 100%)',
        }}
        animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
        transition={{ duration: 15, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />
      <MotionDiv
        aria-hidden="true"
        className="absolute -right-28 top-[58%] h-80 w-80 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, var(--theme-bg-b) 0%, color-mix(in srgb, var(--theme-secondary) 16%, transparent) 100%)',
        }}
        animate={{ x: [0, -16, 0], y: [0, 12, 0] }}
        transition={{ duration: 17, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />

      {PARTICLES.map((particle) => (
        <MotionDiv
          key={particle.id}
          className="absolute top-[105%] h-1.5 w-1.5 rounded-full"
          style={{
            left: particle.left,
            background: 'color-mix(in srgb, var(--theme-secondary) 30%, transparent)',
          }}
          animate={{ y: [0, -980], opacity: [0, 0.6, 0] }}
          transition={{
            duration: particle.duration,
            ease: 'linear',
            repeat: Number.POSITIVE_INFINITY,
            delay: particle.delay,
          }}
        />
      ))}

      {FLOAT_ITEMS.map((item) => (
        <MotionDiv
          key={item.key}
          className={`absolute select-none ${item.className}`}
          style={{ color: 'color-mix(in srgb, var(--theme-secondary) 58%, white)' }}
          animate={{
            y: [0, -16, 0],
            x: [0, 5, 0],
            opacity: [0.22, 0.42, 0.22],
          }}
          transition={{
            duration: item.duration,
            ease: 'easeInOut',
            repeat: Number.POSITIVE_INFINITY,
            delay: item.delay,
          }}
        >
          {item.content}
        </MotionDiv>
      ))}
    </div>
  )
}

export default memo(FloatingRomanceDecor)
