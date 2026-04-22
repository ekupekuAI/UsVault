import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PrimaryButton from '../components/ui/PrimaryButton'

const SECTION_CONTENT = {
  about: {
    title: 'About',
    body: [
      'UsVault is a private memory space for couples who want one calm place for moments.',
      'Capture daily memories, moods, and partner status with realtime sync.',
      'Built mobile-first with a soft glass interface and secure authentication.',
    ],
  },
  help: {
    title: 'Help',
    body: [
      'Sign up or login, then open Journal to add your daily memory.',
      'Use Mood to track how you feel and Status to share your current state.',
      'Your updates sync instantly so both partners see the same timeline.',
    ],
  },
  contact: {
    title: 'Contact Developer',
    body: ['Name: Gekansh', 'Email: gekansh2008@gmail.com', 'For support, tap the email link to send a message.'],
  },
}

function LandingPage({ onGetStarted }) {
  const MotionDiv = motion.div
  const MotionSection = motion.section
  const MotionArticle = motion.article
  const [activeSection, setActiveSection] = useState('')

  function openSection(sectionId) {
    setActiveSection(sectionId)
  }

  function closeSection() {
    setActiveSection('')
  }

  const currentSection = SECTION_CONTENT[activeSection] || null

  return (
    <main className="landing-bg relative mx-auto flex min-h-screen w-full max-w-md items-center overflow-hidden px-4 app-surface">
      <MotionDiv
        aria-hidden="true"
        animate={{ x: [0, 8, 0], y: [0, -6, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="landing-blob pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-rose-300/40 blur-3xl"
      />
      <MotionDiv
        aria-hidden="true"
        animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
        transition={{ duration: 13, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        className="landing-blob pointer-events-none absolute -right-10 bottom-20 h-48 w-48 rounded-full bg-violet-300/45 blur-3xl"
      />

      <MotionSection
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="landing-glass-card relative w-full rounded-[30px] p-6"
      >
        <div className="landing-glass-inner rounded-[22px] p-5">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700">UsVault</p>
            <p className="mt-1 text-sm font-medium text-violet-600">A space for us {'\u{1F49C}'}</p>
          </header>

          <div className="mt-8">
            <h1 className="text-[2rem] font-bold leading-tight text-[var(--ink-title)]">Your private memory space</h1>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-violet-700">
            <span className="rounded-full border border-white/45 bg-white/45 px-3 py-1.5">Daily memories</span>
            <span className="rounded-full border border-white/45 bg-white/45 px-3 py-1.5">Mood + status sync</span>
            <span className="rounded-full border border-white/45 bg-white/45 px-3 py-1.5">Private for couples</span>
          </div>

          <PrimaryButton
            type="button"
            onClick={onGetStarted}
            className="landing-cta mt-6 w-full shadow-[0_14px_30px_rgba(124,89,210,0.35)]"
          >
            Get Started {'\u{1F49C}'}
          </PrimaryButton>

          <button
            type="button"
            onClick={onGetStarted}
            className="mt-3 block w-full text-center text-xs font-semibold text-violet-700 hover:text-violet-800"
          >
            Continue to Login / Sign Up
          </button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold">
            <button type="button" onClick={() => openSection('about')} className="landing-link">
              About
            </button>
            <button type="button" onClick={() => openSection('help')} className="landing-link">
              Help
            </button>
            <button type="button" onClick={() => openSection('contact')} className="landing-link">
              Contact Developer
            </button>
          </div>
        </div>
      </MotionSection>

      <AnimatePresence>
        {currentSection && (
          <MotionDiv
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSection}
          >
            <MotionArticle
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="landing-glass-modal w-full max-w-md rounded-3xl p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-[var(--ink-title)]">{currentSection.title}</h2>
              <div className="mt-2 space-y-2 text-sm text-slate-600">
                {currentSection.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              {activeSection === 'contact' && (
                <a
                  href="mailto:gekansh2008@gmail.com?subject=UsVault%20Support"
                  className="mt-3 inline-flex rounded-xl border border-violet-200 bg-white/65 px-3 py-2 text-sm font-semibold text-violet-700"
                >
                  Email Developer
                </a>
              )}

              <button
                type="button"
                onClick={closeSection}
                className="mt-4 rounded-xl border border-violet-200 bg-white/65 px-3 py-2 text-sm font-semibold text-violet-700"
              >
                Close
              </button>
            </MotionArticle>
          </MotionDiv>
        )}
      </AnimatePresence>
    </main>
  )
}

export default LandingPage
