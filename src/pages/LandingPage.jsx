import { motion } from 'framer-motion'
import heroImage from '../assets/hero.png'
import PrimaryButton from '../components/ui/PrimaryButton'

function LandingPage({ onGetStarted }) {
  const MotionDiv = motion.div

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center overflow-hidden px-4 app-surface">
      <MotionDiv
        aria-hidden="true"
        animate={{ x: [0, 20, 0], y: [0, -16, 0], scale: [1, 1.07, 1] }}
        transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-14 top-8 h-56 w-56 rounded-full bg-rose-300/45 blur-3xl"
      />
      <MotionDiv
        aria-hidden="true"
        animate={{ x: [0, -18, 0], y: [0, 14, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-10 bottom-16 h-56 w-56 rounded-full bg-violet-300/45 blur-3xl"
      />
      <MotionDiv
        aria-hidden="true"
        animate={{ y: [0, 18, 0], opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/35 blur-3xl"
      />

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.96, rotateX: 6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
        className="card-soft relative w-full rounded-[32px] p-6"
      >
        <div className="absolute inset-0 rounded-[32px] border border-white/45 bg-gradient-to-b from-white/25 via-transparent to-violet-200/20" />
        <div className="absolute left-8 top-0 h-20 w-20 rounded-full bg-white/35 blur-2xl" />

        <div className="relative rounded-[24px] border border-white/60 bg-gradient-to-br from-white/76 via-white/54 to-cyan-50/50 p-5 backdrop-blur-2xl">
          <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-600">UsVault</p>
          <h1 className="mt-2 text-[2rem] font-bold leading-tight text-[var(--ink-title)]">
            Pure Glass
            <br />
            Couple Vault
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Smooth overlays, elegant motion, and private shared memories in one production-ready space.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 rounded-2xl border border-white/70 bg-white/60 p-2 shadow-[0_10px_20px_rgba(126,108,187,0.16)]"
          >
            <img
              src={heroImage}
              alt="UsVault preview"
              className="h-28 w-full rounded-xl object-cover"
            />
          </motion.div>

          <div className="mt-4 grid gap-2 text-xs text-violet-700">
            <p className="rounded-xl border border-violet-100 bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              Private for linked partners only
            </p>
            <p className="rounded-xl border border-violet-100 bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              Realtime memory, mood, and status sharing
            </p>
            <p className="rounded-xl border border-violet-100 bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              Installable mobile-first production web app
            </p>
          </div>

          <PrimaryButton type="button" onClick={onGetStarted} className="mt-5 w-full">
            Get Started
          </PrimaryButton>
          <p className="mt-3 text-center text-xs font-medium text-violet-700/80">
            Continue to Login / Sign Up
          </p>
        </div>
      </motion.section>
    </main>
  )
}

export default LandingPage
