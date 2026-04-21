import { memo } from 'react'
import { motion } from 'framer-motion'

const HEART_ITEMS = [
  {
    key: 'heart-top-left',
    className: 'left-[6%] top-[10%] text-3xl',
    duration: 15,
    delay: 0.2,
    driftX: 10,
    driftY: 14,
  },
  {
    key: 'heart-top-right',
    className: 'right-[8%] top-[14%] text-2xl',
    duration: 16,
    delay: 0.8,
    driftX: -12,
    driftY: 12,
  },
  {
    key: 'heart-mid-left',
    className: 'left-[10%] top-[38%] text-2xl',
    duration: 18,
    delay: 0.4,
    driftX: 10,
    driftY: 16,
  },
  {
    key: 'heart-mid-right',
    className: 'right-[10%] top-[42%] text-3xl',
    duration: 14,
    delay: 1.2,
    driftX: -10,
    driftY: 14,
  },
  {
    key: 'heart-bottom-left',
    className: 'left-[12%] top-[70%] text-2xl',
    duration: 17,
    delay: 0.6,
    driftX: 9,
    driftY: 12,
  },
  {
    key: 'heart-bottom-right',
    className: 'right-[12%] top-[74%] text-2xl',
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
            color: 'color-mix(in srgb, var(--theme-secondary) 72%, white)',
            textShadow:
              '0 0 8px color-mix(in srgb, var(--theme-secondary) 40%, transparent), 0 0 18px color-mix(in srgb, var(--theme-primary) 24%, transparent)',
          }}
          animate={{
            y: [0, -item.driftY, 0],
            x: [0, item.driftX, 0],
            opacity: [0.45, 0.76, 0.45],
            scale: [1, 1.08, 1],
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
