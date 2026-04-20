import { AnimatePresence, motion } from 'framer-motion'

function HeartLoader({
  visible = true,
  fullScreen = true,
  title = 'UsVault',
  caption = 'Loading your memories...',
  label,
  className = '',
}) {
  const MotionDiv = motion.div
  const resolvedCaption = label || caption

  return (
    <AnimatePresence>
      {visible && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`${fullScreen ? 'fixed inset-0 z-[70]' : 'absolute inset-0 z-20'} flex items-center justify-center ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-rose-100/85 via-fuchsia-50/78 to-violet-100/72 backdrop-blur-xl" />
          <div className="relative flex flex-col items-center gap-2">
            <MotionDiv
              aria-hidden="true"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.25, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              className="select-none text-4xl drop-shadow-[0_6px_10px_rgba(241,112,171,0.32)]"
            >
              {'\u{2764}\u{FE0F}'}
            </MotionDiv>
            <p className="text-sm font-bold tracking-wide text-violet-700/95">{title}</p>
            <p className="text-xs font-semibold tracking-wide text-violet-700/90">{resolvedCaption}</p>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

export default HeartLoader
