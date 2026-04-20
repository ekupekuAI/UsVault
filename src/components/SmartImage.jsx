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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  if (!src) {
    return null
  }

  return (
    <>
      <div className={`relative overflow-hidden ${containerClassName}`}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-violet-100/70" />}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onClick={() => {
            if (showFullscreen) {
              setOpen(true)
            }
          }}
          className={`${className} ${showFullscreen ? 'cursor-zoom-in' : ''} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
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
