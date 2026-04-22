import { AnimatePresence, motion } from 'framer-motion'

const HEARTS = [
  { id: 'a', x: -24, y: -22, delay: 0, size: 'text-sm' },
  { id: 'b', x: 0, y: -34, delay: 0.06, size: 'text-base' },
  { id: 'c', x: 22, y: -20, delay: 0.11, size: 'text-sm' },
]

function MicroHeartBurst({ visible }) {
  const MotionSpan = motion.span

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {HEARTS.map((heart) => (
            <MotionSpan
              key={heart.id}
              initial={{ opacity: 0, y: 10, x: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.9, 0], y: [0, heart.y], x: [0, heart.x], scale: [0.8, 1, 0.9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.84, ease: 'easeOut', delay: heart.delay }}
              className={`absolute left-1/2 top-1/2 ${heart.size} -translate-x-1/2 -translate-y-1/2 text-rose-300`}
            >
              {'\u2665'}
            </MotionSpan>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

export default MicroHeartBurst
