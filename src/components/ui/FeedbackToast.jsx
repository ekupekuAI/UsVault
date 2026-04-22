import { AnimatePresence, motion } from 'framer-motion'

function FeedbackToast({
  visible,
  message,
  actionLabel = '',
  onAction,
  onClose,
}) {
  const MotionDiv = motion.div

  if (!message) {
    return null
  }

  return (
    <AnimatePresence>
      {visible && (
        <MotionDiv
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-[80] w-[calc(100%-1.2rem)] max-w-sm -translate-x-1/2"
        >
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[16px] border border-white/60 bg-slate-900/74 px-3 py-2 text-xs text-white shadow-[0_16px_30px_rgba(22,37,69,0.34)] backdrop-blur-xl">
            <p className="font-semibold">{message}</p>
            <div className="flex items-center gap-2">
              {actionLabel && onAction && (
                <button
                  type="button"
                  onClick={onAction}
                  className="rounded-lg border border-white/35 bg-white/10 px-2 py-1 font-semibold text-white"
                >
                  {actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 font-semibold text-white/90"
              >
                Close
              </button>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  )
}

export default FeedbackToast
