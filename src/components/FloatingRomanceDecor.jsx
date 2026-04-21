import { memo } from 'react'
import { motion } from 'framer-motion'

const HEART_ITEMS = [
  {
    key: 'heart-top-left',
    className: 'left-[4%] top-[8%] text-4xl sm:text-3xl',
    duration: 15,
    delay: 0.2,
    driftX: 10,
    driftY: 14,
  },
  {
    key: 'heart-top-right',
    className: 'right-[4%] top-[12%] text-3xl sm:text-2xl',
    duration: 16,
    delay: 0.8,
    driftX: -12,
    driftY: 12,
  },
  {
    key: 'heart-mid-left',
    className: 'left-[3%] top-[35%] text-3xl sm:text-2xl',
    duration: 18,
    delay: 0.4,
    driftX: 10,
    driftY: 16,
  },
  {
    key: 'heart-mid-right',
    className: 'right-[3%] top-[40%] text-4xl sm:text-3xl',
    duration: 14,
    delay: 1.2,
    driftX: -10,
    driftY: 14,
  },
  {
    key: 'heart-bottom-left',
    className: 'left-[4%] top-[66%] text-3xl sm:text-2xl',
    duration: 17,
    delay: 0.6,
    driftX: 9,
    driftY: 12,
  },
  {
    key: 'heart-bottom-right',
    className: 'right-[4%] top-[72%] text-3xl sm:text-2xl',
    duration: 15,
    delay: 1.1,
    driftX: -9,
    driftY: 10,
  },
]

function FloatingRomanceDecor() {
  const MotionDiv = motion.div

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {HEART_ITEMS.map((item) => (
        <MotionDiv
          key={item.key}
          className={`absolute select-none ${item.className}`}
          style={{
            color: 'color-mix(in srgb, var(--theme-secondary) 84%, white)',
            textShadow:
              '0 0 10px color-mix(in srgb, var(--theme-secondary) 44%, transparent), 0 0 24px color-mix(in srgb, var(--theme-primary) 30%, transparent)',
          }}
          animate={{
            y: [0, -item.driftY, 0],
            x: [0, item.driftX, 0],
            opacity: [0.56, 0.92, 0.56],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: item.duration,
            ease: 'easeInOut',
            repeat: Number.POSITIVE_INFINITY,
            delay: item.delay,
          }}
        >
          {'\u{2665}'}
        </MotionDiv>
      ))}
    </div>
  )
}

export default memo(FloatingRomanceDecor)
