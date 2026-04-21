import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Bell,
  Book,
  Home,
  Shield,
  Smile,
  Sparkles,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSound } from '../context/SoundContext'
import { hoverLift, softSpring, tapPress } from './motion/motionTokens'
import PrimaryButton from './ui/PrimaryButton'

const TAB_ICONS = {
  home: Home,
  book: Book,
  smile: Smile,
  activity: Activity,
  bell: Bell,
  user: User,
  sparkles: Sparkles,
  shield: Shield,
}

function AppShell({ tabs, activeTab, onTabChange, children }) {
  const MotionButton = motion.button
  const { user, logout } = useAuth()
  const { soundEnabled, toggleSound } = useSound()

  return (
    <div className="app-surface px-3 pb-4 pt-4 sm:px-4 sm:pt-5">
      <header className="card-soft rounded-[28px] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">UsVault</p>
            <h1 className="mt-1 text-lg font-bold text-[var(--ink-title)] sm:text-xl">Our Private Space</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MotionButton
              type="button"
              onClick={toggleSound}
              whileHover={hoverLift}
              whileTap={tapPress}
              transition={softSpring}
              className="inline-flex h-9 items-center justify-center rounded-full border border-violet-200 bg-white/75 px-3 text-xs font-semibold text-violet-700 backdrop-blur-sm"
              title="Toggle sound"
            >
              {soundEnabled ? 'Sound' : 'Muted'}
            </MotionButton>
            <PrimaryButton type="button" onClick={logout} className="h-9 rounded-full px-3 py-0 text-xs">
              Logout
            </PrimaryButton>
          </div>
        </div>
        <p className="mt-2 truncate text-xs text-slate-500/90">{user?.email}</p>
        <p className="mt-1 text-[11px] font-medium text-slate-500/85">UsVault v1.0 💜 Built with love</p>
      </header>

      <section className="mt-4 space-y-3 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md border-t border-violet-100/80 bg-white/84 px-1.5 py-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] backdrop-blur-2xl">
        <ul
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.icon] || Home
            const isActive = activeTab === tab.id

            return (
              <li key={tab.id}>
                <MotionButton
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  whileHover={hoverLift}
                  whileTap={tapPress}
                  transition={softSpring}
                  className={`flex min-h-[52px] w-full flex-col items-center rounded-2xl px-1 py-1.5 text-[10px] font-semibold leading-tight transition-colors duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-100/95 to-rose-100/95 text-violet-700 shadow-[0_8px_18px_rgba(162,128,244,0.26)]'
                      : 'text-slate-500 hover:bg-violet-50/70'
                  }`}
                >
                  <span
                    className={`nav-icon-orb relative mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                      isActive ? 'nav-icon-orb-active' : ''
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition duration-200 ${
                        isActive ? 'nav-icon-live-active scale-110 text-violet-700' : 'nav-icon-live scale-100 text-slate-500'
                      }`}
                      strokeWidth={2.1}
                    />
                    {tab.badge > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate px-0.5">{tab.label}</span>
                </MotionButton>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export default AppShell
