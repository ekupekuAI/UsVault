import { memo } from 'react'
import { motion } from 'framer-motion'

const FLOAT_ITEMS = [
  {
    key: 'heart-left',
    content: '\u{2665}',
    className: 'left-4 top-24 text-2xl text-rose-300/40',
    duration: 16,
    delay: 0,
  },
  {
    key: 'dot-center',
    content: '\u{25CF}',
    className: 'left-[48%] top-[22%] text-xs text-violet-300/35',
    duration: 20,
    delay: 1.6,
  },
  {
    key: 'heart-right',
    content: '\u{2665}',
    className: 'right-5 top-[40%] text-xl text-fuchsia-300/35',
    duration: 18,
    delay: 0.9,
  },
]

function FloatingRomanceDecor() {
  const MotionDiv = motion.div

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-20 top-[18%] h-64 w-64 rounded-full bg-gradient-to-br from-rose-200/20 to-violet-200/15 blur-3xl" />
      <div className="absolute -right-24 top-[55%] h-72 w-72 rounded-full bg-gradient-to-br from-violet-200/20 to-sky-200/15 blur-3xl" />

      {FLOAT_ITEMS.map((item) => (
        <MotionDiv
          key={item.key}
          className={`absolute select-none ${item.className}`}
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
