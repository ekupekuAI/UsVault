import { AnimatePresence, motion } from 'framer-motion'
import { modalEnter, overlayEnter, quickSpring } from '../motion/motionTokens'

function SoftModal({ open, onClose, title, children }) {
  const MotionDiv = motion.div
  const MotionButton = motion.button

  return (
    <AnimatePresence>
      {open && (
        <MotionDiv
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-4 sm:items-center"
          onClick={onClose}
          variants={overlayEnter}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="card-soft w-full max-w-sm rounded-[30px] p-4"
            onClick={(event) => event.stopPropagation()}
            variants={modalEnter}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ ...quickSpring, duration: 0.24 }}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink-title)]">{title}</h3>
              <MotionButton
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={quickSpring}
                className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-violet-600 shadow-[0_6px_12px_rgba(75,104,153,0.12)]"
              >
                Close
              </MotionButton>
            </div>
            <div className="mt-3">{children}</div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

export default SoftModal
