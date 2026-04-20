import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'

const SLIDES = [
  {
    title: 'Every moment matters \u{1F49C}',
    subtitle: 'Small stories become forever memories.',
    glowFrom: 'from-rose-100/90',
    glowTo: 'to-fuchsia-100/90',
  },
  {
    title: "Let's remember this together",
    subtitle: 'One private place for both hearts.',
    glowFrom: 'from-violet-100/90',
    glowTo: 'to-rose-100/90',
  },
  {
    title: 'A space just for us',
    subtitle: 'Soft, safe, and always yours.',
    glowFrom: 'from-fuchsia-100/90',
    glowTo: 'to-indigo-100/90',
  },
  {
    title: 'Hold your best days close',
    subtitle: 'Capture today before it fades.',
    glowFrom: 'from-pink-100/90',
    glowTo: 'to-violet-100/90',
  },
]

function OnboardingCarousel() {
  const MotionArticle = motion.article
  const MotionDiv = motion.div
  const [index, setIndex] = useState(0)
  const dragX = useMotionValue(0)
  const parallaxX = useTransform(dragX, [-180, 0, 180], [-14, 0, 14])

  function changeSlide(nextIndex) {
    if (nextIndex < 0 || nextIndex >= SLIDES.length) {
      return
    }
    setIndex(nextIndex)
    dragX.set(0)
  }

  function onDragEnd(_, info) {
    const offset = info.offset.x
    const threshold = 70
    if (offset < -threshold) {
      changeSlide(index + 1)
      return
    }
    if (offset > threshold) {
      changeSlide(index - 1)
    }
  }

  const current = SLIDES[index]

  return (
    <section className="mt-4">
      <AnimatePresence mode="wait">
        <MotionArticle
          key={current.title}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={onDragEnd}
          style={{ x: dragX }}
          className="relative overflow-hidden rounded-3xl border border-violet-100/90 bg-white/74 p-4 shadow-[0_16px_32px_rgba(137,110,205,0.18)] backdrop-blur-lg"
        >
          <MotionDiv
            aria-hidden="true"
            style={{ x: parallaxX }}
            className={`absolute inset-0 bg-gradient-to-br ${current.glowFrom} ${current.glowTo} opacity-75`}
          />
          <div className="relative z-10">
            <div className="rounded-2xl border border-white/60 bg-white/58 p-3 backdrop-blur-sm">
              <p className="text-base font-bold text-violet-700">{current.title}</p>
              <p className="mt-1 text-sm text-slate-600">{current.subtitle}</p>
            </div>
          </div>
        </MotionArticle>
      </AnimatePresence>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeSlide(index - 1)}
          disabled={index === 0}
          className="pressable rounded-xl border border-violet-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-violet-700 disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((slide, dotIndex) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => changeSlide(dotIndex)}
              className={`h-2.5 rounded-full transition-all ${
                dotIndex === index ? 'w-6 bg-violet-500' : 'w-2.5 bg-violet-200'
              }`}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => changeSlide(index + 1)}
          disabled={index === SLIDES.length - 1}
          className="pressable rounded-xl border border-violet-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-violet-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  )
}

export default OnboardingCarousel
