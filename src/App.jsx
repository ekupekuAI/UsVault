import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import AppShell from './components/AppShell'
import InstallPrompt from './components/InstallPrompt'
import SplashScreen from './components/SplashScreen'
import SurpriseToast from './components/SurpriseToast'
import { FIRST_OPEN_SPLASH_KEY, POST_SIGNUP_INTRO_KEY } from './constants/authFlow'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SoundProvider } from './context/SoundContext'
import AuthPage from './pages/AuthPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import MemoryJournalPage from './pages/MemoryJournalPage'
import MoodTrackerPage from './pages/MoodTrackerPage'
import NotificationCenterPage from './pages/NotificationCenterPage'
import ProfilePage from './pages/ProfilePage'
import StatusPage from './pages/StatusPage'
import VibesPage from './pages/VibesPage'
import {
  deleteUserNotification,
  ensureStatusDocument,
  formatDateKey,
  markAllNotificationsRead,
  subscribeUserNotifications,
  subscribeEntryByDate,
  subscribeStatusMap,
  subscribeUserEntries,
} from './services/journalService'
import {
  initializePushNotifications,
  startForegroundNotifications,
  stopForegroundNotifications,
} from './services/pushService'
import { pickRandomSurpriseMessage } from './utils/emotional'

const DailyReminder = lazy(() => import('./components/DailyReminder'))
const FloatingRomanceDecor = lazy(() => import('./components/FloatingRomanceDecor'))

const BASE_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u{1F3E0}' },
  { id: 'journal', label: 'Journal', icon: '\u{1F4DD}' },
  { id: 'mood', label: 'Mood', icon: '\u{1F60A}' },
  { id: 'status', label: 'Status', icon: '\u{1F4F6}' },
  { id: 'notifications', label: 'Alerts', icon: '\u{1F514}' },
  { id: 'profile', label: 'Profile', icon: '\u{1F464}' },
  { id: 'vibes', label: 'Vibes', icon: '\u{1F3B2}' },
]
const ADMIN_TAB = { id: 'admin', label: 'Admin', icon: '\u{1F6E1}' }

function AppContent() {
  const { user, loading, authError, isAdmin } = useAuth()
  const [bootSplashDone, setBootSplashDone] = useState(false)
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const [showEntrySplash, setShowEntrySplash] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return !localStorage.getItem(FIRST_OPEN_SPLASH_KEY)
  })
  const [showPostSignupIntro, setShowPostSignupIntro] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [todayEntry, setTodayEntry] = useState(null)
  const [entries, setEntries] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [todayLoading, setTodayLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const [surpriseMessage, setSurpriseMessage] = useState('')
  const [surpriseVisible, setSurpriseVisible] = useState(false)

  const todayKey = formatDateKey(new Date())

  useEffect(() => {
    const timerId = window.setTimeout(() => setBootSplashDone(true), 2800)
    return () => window.clearTimeout(timerId)
  }, [])

  useEffect(() => {
    if (!showEntrySplash) {
      return undefined
    }
    const timerId = window.setTimeout(() => {
      localStorage.setItem(FIRST_OPEN_SPLASH_KEY, '1')
      setShowEntrySplash(false)
    }, 2400)
    return () => window.clearTimeout(timerId)
  }, [showEntrySplash])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      stopForegroundNotifications()
      setNotifications([])
      setNotificationsLoading(false)
      return undefined
    }

    setEntriesLoading(true)
    setTodayLoading(true)
    setStatusLoading(true)
    setDataError('')

    ensureStatusDocument(user.uid, user.email).catch(() => {})

    const unsubscribeToday = subscribeEntryByDate(
      user.uid,
      todayKey,
      (data) => {
        setTodayEntry(data)
        setTodayLoading(false)
      },
      () => {
        setTodayLoading(false)
        setDataError("Could not load today's memory right now.")
      },
    )
    const unsubscribeEntries = subscribeUserEntries(
      user.uid,
      (data) => {
        setEntries(data)
        setEntriesLoading(false)
      },
      500,
      () => {
        setEntriesLoading(false)
        setDataError('Could not load memories right now.')
      },
    )
    const unsubscribeStatuses = subscribeStatusMap(
      (data) => {
        setStatusMap(data)
        setStatusLoading(false)
      },
      () => {
        setStatusLoading(false)
        setDataError('Could not load status updates right now.')
      },
    )
    const unsubscribeNotifications = subscribeUserNotifications(
      user.uid,
      (items) => {
        setNotifications(items)
        setNotificationsLoading(false)
      },
      80,
      () => {
        setNotificationsLoading(false)
      },
    )

    return () => {
      unsubscribeToday()
      unsubscribeEntries()
      unsubscribeStatuses()
      unsubscribeNotifications()
    }
  }, [todayKey, user])

  useEffect(() => {
    if (!user) {
      setShowAuthScreen(false)
    }
  }, [user])

  useEffect(() => {
    if (!isAdmin && activeTab === 'admin') {
      setActiveTab('dashboard')
    }
  }, [activeTab, isAdmin])

  useEffect(() => {
    if (!user) {
      return undefined
    }

    let isMounted = true

    async function setupPush() {
      const result = await initializePushNotifications()

      if (!isMounted) {
        return
      }

      if (result.permission === 'denied') {
        console.log('Notifications denied by user.')
      } else if (result.permission === 'unsupported') {
        console.log('Notifications are not supported in this browser.')
      } else if (result.permission === 'granted') {
        await startForegroundNotifications()
      }
    }

    setupPush()

    return () => {
      isMounted = false
      stopForegroundNotifications()
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }
    if (sessionStorage.getItem(POST_SIGNUP_INTRO_KEY) !== '1') {
      return
    }

    setShowPostSignupIntro(true)
    const timerId = window.setTimeout(() => {
      sessionStorage.removeItem(POST_SIGNUP_INTRO_KEY)
      setShowPostSignupIntro(false)
    }, 2000)
    return () => window.clearTimeout(timerId)
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }

    const seenKey = `usvault_surprise_seen_${user.uid}`
    const dayStamp = formatDateKey(new Date())

    if (localStorage.getItem(seenKey) === dayStamp) {
      return
    }

    if (Math.random() > 0.34) {
      return
    }

    setSurpriseMessage(pickRandomSurpriseMessage())
    setSurpriseVisible(true)
    localStorage.setItem(seenKey, dayStamp)
  }, [user])

  useEffect(() => {
    if (!surpriseVisible) {
      return undefined
    }
    const timerId = window.setTimeout(() => setSurpriseVisible(false), 4200)
    return () => window.clearTimeout(timerId)
  }, [surpriseVisible])

  const myProfile = statusMap[user?.uid] || {
    uid: user?.uid,
    email: user?.email,
    status: 'Free',
    displayName: '',
    partnerName: '',
    greetingTemplate: '',
    missMeMessage: '',
    gossipEntries: [],
    partnerCode: '',
    partnerUid: '',
    photoURL: '',
    photoPath: '',
    onboardingDone: false,
    loadingTitleForPartner: '',
    loadingCaptionForPartner: '',
  }

  const myStatus = myProfile.status || 'Free'
  const partnerStatusData = useMemo(() => {
    const partner = myProfile?.partnerUid ? statusMap[myProfile.partnerUid] : null
    return {
      uid: partner?.uid || '',
      linked: Boolean(myProfile?.partnerUid),
      status: partner?.status || 'No update yet',
      label: partner?.displayName || partner?.email || (myProfile?.partnerUid ? 'Partner' : 'Not linked yet'),
      displayName: partner?.displayName || '',
      partnerName: partner?.partnerName || '',
      greetingTemplate: partner?.greetingTemplate || '',
      missMeMessage: partner?.missMeMessage || '',
      gossipEntries: Array.isArray(partner?.gossipEntries) ? partner.gossipEntries : [],
      loadingTitleForPartner: partner?.loadingTitleForPartner || '',
      loadingCaptionForPartner: partner?.loadingCaptionForPartner || '',
      email: partner?.email || '',
      lastSeen: partner?.updatedAt || null,
    }
  }, [myProfile?.partnerUid, statusMap])

  const onThisDayEntry = useMemo(() => {
    const todayMonthDay = todayKey.slice(5)
    return (
      entries.find(
        (entry) => entry?.date && entry.date < todayKey && entry.date.slice(5) === todayMonthDay,
      ) || null
    )
  }, [entries, todayKey])

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )
  const tabs = useMemo(
    () => {
      const baseTabs = BASE_TABS.map((tab) => ({
        ...tab,
        badge: tab.id === 'notifications' ? unreadNotificationCount : 0,
      }))
      return isAdmin ? [...baseTabs, ADMIN_TAB] : baseTabs
    },
    [isAdmin, unreadNotificationCount],
  )

  async function handleMarkAllNotificationsRead() {
    await markAllNotificationsRead(user.uid)
  }

  async function handleDeleteNotification(notificationId) {
    await deleteUserNotification(user.uid, notificationId)
  }

  if (showEntrySplash && user) {
    return <SplashScreen visible mode="entry" />
  }

  if (!user && !loading) {
    if (!showAuthScreen) {
      return <LandingPage onGetStarted={() => setShowAuthScreen(true)} />
    }
    return (
      <AuthPage
        authError={authError}
        onBackToLanding={() => setShowAuthScreen(false)}
      />
    )
  }

  if (!bootSplashDone || loading) {
    return <SplashScreen visible mode="logoIntro" />
  }

  if (showPostSignupIntro) {
    return <SplashScreen visible mode="logoIntro" />
  }

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-md pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <SurpriseToast
        visible={surpriseVisible}
        message={surpriseMessage}
        onClose={() => setSurpriseVisible(false)}
      />

      <Suspense fallback={null}>
        <FloatingRomanceDecor />
      </Suspense>

      {!isOnline && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 fade-in-up">
          You are offline. Entries stay in local cache and sync when you reconnect.
        </div>
      )}
      {dataError && (
        <div className="mx-4 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 fade-in-up">
          {dataError}
        </div>
      )}

      <InstallPrompt />
      <Suspense fallback={null}>
        <DailyReminder user={user} />
      </Suspense>

      <AppShell tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            user={user}
            todayEntry={todayEntry}
            entries={entries}
            todayLoading={todayLoading}
            statusLoading={statusLoading}
            onThisDayEntry={onThisDayEntry}
            myStatus={myStatus}
            partnerStatus={partnerStatusData.status}
            partnerLabel={partnerStatusData.label}
            partnerLastSeen={partnerStatusData.lastSeen}
            myProfile={myProfile}
            partnerProfile={partnerStatusData}
          />
        )}
        {activeTab === 'journal' && (
          <MemoryJournalPage
            user={user}
            todayEntry={todayEntry}
            entries={entries}
            entriesLoading={entriesLoading}
            loadingTitle={partnerStatusData.loadingTitleForPartner}
            loadingCaption={partnerStatusData.loadingCaptionForPartner}
          />
        )}
        {activeTab === 'mood' && (
          <MoodTrackerPage user={user} todayEntry={todayEntry} entries={entries} />
        )}
        {activeTab === 'status' && (
          <StatusPage
            user={user}
            myStatus={myStatus}
            partnerStatusData={partnerStatusData}
            statusLoading={statusLoading}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationCenterPage
            notifications={notifications}
            notificationsLoading={notificationsLoading}
            unreadCount={unreadNotificationCount}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onDeleteNotification={handleDeleteNotification}
          />
        )}
        {activeTab === 'profile' && (
          <ProfilePage
            user={user}
            myProfile={myProfile}
            partnerStatusData={partnerStatusData}
          />
        )}
        {activeTab === 'vibes' && <VibesPage user={user} myProfile={myProfile} todayEntry={todayEntry} />}
        {activeTab === 'admin' && isAdmin && <AdminDashboardPage adminUser={user} />}
      </AppShell>
    </main>
  )
}

function App() {
  return (
    <SoundProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SoundProvider>
  )
}

export default App
