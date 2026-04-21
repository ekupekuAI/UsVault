import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function SmartImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  showFullscreen = true,
  fullscreenClassName = '',
}) {
  const MotionDiv = motion.div
  const MotionImg = motion.img
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [src])

  if (!src) {
    return null
  }

  return (
    <>
      <div className={`relative overflow-hidden ${containerClassName}`}>
        {!loaded && !failed && (
          <div className="absolute inset-0">
            <div className="h-full w-full animate-pulse bg-gradient-to-br from-violet-200/45 via-white/55 to-violet-100/40" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
          </div>
        )}
        {failed && (
          <div className="flex h-full min-h-24 w-full items-center justify-center rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-4 text-xs font-semibold text-violet-600">
            Image unavailable
          </div>
        )}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 100vw, 420px"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true)
            setLoaded(false)
          }}
          onClick={() => {
            if (showFullscreen && !failed) {
              setOpen(true)
            }
          }}
          className={`${className} ${showFullscreen ? 'cursor-zoom-in' : ''} ${loaded && !failed ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
      </div>

      <AnimatePresence>
        {open && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/88 p-4"
            onClick={() => setOpen(false)}
          >
            <MotionImg
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`max-h-[90vh] w-auto max-w-full rounded-2xl object-contain ${fullscreenClassName}`}
            />
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  )
}

export default SmartImage
