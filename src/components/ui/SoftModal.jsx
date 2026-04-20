import { AnimatePresence, motion } from 'framer-motion'
import { modalEnter, overlayEnter, quickSpring } from '../motion/motionTokens'

function SoftModal({ open, onClose, title, children }) {
  const MotionDiv = motion.div
  const MotionButton = motion.button

  return (
    <AnimatePresence>
      {open && (
        <MotionDiv
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/28 p-4 sm:items-center"
          onClick={onClose}
          variants={overlayEnter}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="card-soft w-full max-w-sm rounded-[28px] p-4"
            onClick={(event) => event.stopPropagation()}
            variants={modalEnter}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ ...quickSpring, duration: 0.24 }}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-[var(--ink-title)]">{title}</h3>
              <MotionButton
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={quickSpring}
                className="rounded-full border border-violet-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-violet-600"
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
