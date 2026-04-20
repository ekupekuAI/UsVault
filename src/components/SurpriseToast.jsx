import { AnimatePresence, motion } from 'framer-motion'

function SurpriseToast({ message, visible, onClose }) {
  const MotionDiv = motion.div

  return (
    <AnimatePresence>
      {visible && message && (
        <MotionDiv
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="pointer-events-none fixed left-1/2 top-3 z-[72] w-[calc(100%-1.25rem)] max-w-sm -translate-x-1/2"
        >
          <div className="pointer-events-auto rounded-2xl border border-violet-100/80 bg-white/78 px-3 py-2.5 text-center shadow-[0_14px_30px_rgba(124,96,193,0.2)] backdrop-blur-lg">
            <p className="text-sm font-medium text-violet-700">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-violet-500"
            >
              Close
            </button>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

export default SurpriseToast
