import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from './components/AppShell'
import InstallPrompt from './components/InstallPrompt'
import SplashScreen from './components/SplashScreen'
import SurpriseToast from './components/SurpriseToast'
import { FIRST_OPEN_SPLASH_KEY, POST_SIGNUP_INTRO_KEY } from './constants/authFlow'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SoundProvider, useSound } from './context/SoundContext'
import {
  deleteAllUserNotifications,
  deleteUserNotification,
  ensureStatusDocument,
  formatDateKey,
  markAllNotificationsRead,
  removePushToken,
  savePushToken,
  subscribeUserNotifications,
  subscribeEntryByDate,
  subscribeStatusMap,
  subscribeUserEntries,
} from './services/journalService'
import {
  initializePushNotifications,
  sendLocalNotification,
  startForegroundNotifications,
  stopForegroundNotifications,
} from './services/pushService'
import {
  getLastActive,
  getLockedCapsules,
  getOnThisDay,
  getSmartNudge,
  getUnlockedCapsules,
} from './utils/advancedLogic'
import { pickRandomSurpriseMessage } from './utils/emotional'

const DailyReminder = lazy(() => import('./components/DailyReminder'))
const FloatingRomanceDecor = lazy(() => import('./components/FloatingRomanceDecor'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const MemoryJournalPage = lazy(() => import('./pages/MemoryJournalPage'))
const MoodTrackerPage = lazy(() => import('./pages/MoodTrackerPage'))
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenterPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const VibesPage = lazy(() => import('./pages/VibesPage'))
const PUSH_TOKEN_UID_KEY = 'usvault_push_token_uid'
const PUSH_TOKEN_VALUE_KEY = 'usvault_push_token_value'

const THEME_BY_STATUS = {
  Free: {
    primary: '#2fa36a',
    secondary: '#6be09e',
    glow: 'rgba(64, 173, 112, 0.28)',
    bgA: 'rgba(155, 255, 205, 0.36)',
    bgB: 'rgba(98, 229, 175, 0.24)',
    bgC: '#cfeadf',
  },
  Busy: {
    primary: '#3a67d7',
    secondary: '#78a2ff',
    glow: 'rgba(89, 129, 231, 0.3)',
    bgA: 'rgba(146, 180, 255, 0.36)',
    bgB: 'rgba(113, 157, 245, 0.25)',
    bgC: '#d3dcf4',
  },
  'Someone Around': {
    primary: '#d2416f',
    secondary: '#ff7a9e',
    glow: 'rgba(215, 86, 128, 0.33)',
    bgA: 'rgba(255, 170, 200, 0.36)',
    bgB: 'rgba(241, 121, 154, 0.26)',
    bgC: '#edd1df',
  },
}
const DEFAULT_THEME = {
  primary: '#7b58df',
  secondary: '#b18dff',
  glow: 'rgba(137, 102, 220, 0.3)',
  bgA: 'rgba(210, 166, 238, 0.36)',
  bgB: 'rgba(170, 183, 236, 0.28)',
  bgC: '#d7cfe8',
}

const BASE_TABS = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'journal', label: 'Journal', icon: 'book' },
  { id: 'mood', label: 'Mood', icon: 'smile' },
  { id: 'status', label: 'Status', icon: 'activity' },
  { id: 'notifications', label: 'Alerts', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'vibes', label: 'Vibes', icon: 'sparkles' },
]
const ADMIN_TAB = { id: 'admin', label: 'Admin', icon: 'shield' }

function normalizePublicPath(pathname = '/') {
  if (pathname === '/auth') {
    return '/auth'
  }
  return '/'
}

function AppContent() {
  const { user, loading, authError, isAdmin } = useAuth()
  const { playChime, triggerHaptic } = useSound()
  const [bootSplashDone, setBootSplashDone] = useState(false)
  const [publicPath, setPublicPath] = useState(() => {
    if (typeof window === 'undefined') {
      return '/'
    }
    return normalizePublicPath(window.location.pathname)
  })
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
  const [partnerTodayEntry, setPartnerTodayEntry] = useState(null)
  const [partnerMoodFx, setPartnerMoodFx] = useState(null)
  const notificationsPrimedRef = useRef(false)
  const knownNotificationIdsRef = useRef(new Set())
  const partnerMoodInitializedRef = useRef(false)
  const partnerMoodPreviousRef = useRef('')

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
    notificationsPrimedRef.current = false
    knownNotificationIdsRef.current = new Set()
  }, [user?.uid])

  useEffect(() => {
    function handlePopState() {
      setPublicPath(normalizePublicPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!isAdmin && activeTab === 'admin') {
      setActiveTab('dashboard')
    }
  }, [activeTab, isAdmin])

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      return
    }
    if (window.location.pathname === '/auth') {
      window.history.replaceState({}, '', '/')
      setPublicPath('/')
    }
  }, [user])

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
        const nextToken = String(result.token || '').trim()
        const previousUid = localStorage.getItem(PUSH_TOKEN_UID_KEY) || ''
        const previousToken = localStorage.getItem(PUSH_TOKEN_VALUE_KEY) || ''

        if (
          previousUid &&
          previousToken &&
          (previousUid !== user.uid || previousToken !== nextToken)
        ) {
          await removePushToken(previousUid, previousToken).catch(() => {})
        }

        if (nextToken) {
          await savePushToken(user.uid, nextToken, navigator.userAgent).catch(() => {})
          localStorage.setItem(PUSH_TOKEN_UID_KEY, user.uid)
          localStorage.setItem(PUSH_TOKEN_VALUE_KEY, nextToken)
        }

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
    if (user) {
      return
    }

    const previousUid = localStorage.getItem(PUSH_TOKEN_UID_KEY) || ''
    const previousToken = localStorage.getItem(PUSH_TOKEN_VALUE_KEY) || ''
    if (previousUid && previousToken) {
      removePushToken(previousUid, previousToken).catch(() => {})
    }
    localStorage.removeItem(PUSH_TOKEN_UID_KEY)
    localStorage.removeItem(PUSH_TOKEN_VALUE_KEY)
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

  useEffect(() => {
    if (!partnerMoodFx) {
      return undefined
    }
    const timerId = window.setTimeout(() => setPartnerMoodFx(null), 1600)
    return () => window.clearTimeout(timerId)
  }, [partnerMoodFx])

  useEffect(() => {
    if (!user) {
      return
    }

    const knownIds = knownNotificationIdsRef.current

    if (!notificationsPrimedRef.current) {
      notifications.forEach((item) => {
        if (item?.id) {
          knownIds.add(item.id)
        }
      })
      notificationsPrimedRef.current = true
      return
    }

    notifications.forEach((item) => {
      if (!item?.id || knownIds.has(item.id)) {
        return
      }

      knownIds.add(item.id)
      const fromPartner = Boolean(item.originUid) && item.originUid !== user.uid
      if (!fromPartner) {
        return
      }

      sendLocalNotification(item.title || 'UsVault', item.body || 'New update from your partner.')
      playChime()
      triggerHaptic([18, 24, 18])
    })
  }, [notifications, playChime, triggerHaptic, user])

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
  const myPartnerUid = myProfile?.partnerUid || ''
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

  useEffect(() => {
    if (!user || !myPartnerUid) {
      setPartnerTodayEntry(null)
      partnerMoodInitializedRef.current = false
      partnerMoodPreviousRef.current = ''
      return undefined
    }

    partnerMoodInitializedRef.current = false
    partnerMoodPreviousRef.current = ''

    return subscribeEntryByDate(
      myPartnerUid,
      todayKey,
      (entry) => {
        setPartnerTodayEntry(entry)
        const nextMood = String(entry?.mood || '')

        if (!partnerMoodInitializedRef.current) {
          partnerMoodInitializedRef.current = true
          partnerMoodPreviousRef.current = nextMood
          return
        }

        if (nextMood && nextMood !== partnerMoodPreviousRef.current) {
          setPartnerMoodFx({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            mood: nextMood,
          })
        }

        partnerMoodPreviousRef.current = nextMood
      },
      () => {},
    )
  }, [myPartnerUid, todayKey, user])

  const effectiveThemeStatus = useMemo(() => {
    if (!partnerStatusData.linked || partnerStatusData.status === 'No update yet') {
      return ''
    }
    return partnerStatusData.status || ''
  }, [partnerStatusData.linked, partnerStatusData.status])

  const onThisDayEntry = useMemo(() => {
    return getOnThisDay(entries)
  }, [entries])

  const smartNudge = useMemo(() => {
    const lastMemory = entries?.[0] || todayEntry || null
    const lastMood = entries.find((entry) => entry?.mood) || todayEntry || null
    const lastActive = getLastActive()
    return getSmartNudge({
      lastMemory,
      lastMood,
      lastActive,
    })
  }, [entries, todayEntry])

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const root = document.documentElement
    const palette = THEME_BY_STATUS[effectiveThemeStatus] || DEFAULT_THEME

    root.style.setProperty('--theme-primary', palette.primary)
    root.style.setProperty('--theme-secondary', palette.secondary)
    root.style.setProperty('--theme-glow', palette.glow)
    root.style.setProperty('--theme-bg-a', palette.bgA)
    root.style.setProperty('--theme-bg-b', palette.bgB)
    root.style.setProperty('--theme-bg-c', palette.bgC)
  }, [effectiveThemeStatus])

  useEffect(() => {
    if (!user) {
      return
    }
    getUnlockedCapsules()
    getLockedCapsules()
  }, [user])

  async function handleMarkAllNotificationsRead() {
    await markAllNotificationsRead(user.uid)
  }

  async function handleDeleteNotification(notificationId) {
    await deleteUserNotification(user.uid, notificationId)
  }

  async function handleDeleteAllNotifications() {
    await deleteAllUserNotifications(user.uid)
  }

  function navigatePublic(nextPath) {
    const normalized = normalizePublicPath(nextPath)
    if (typeof window === 'undefined') {
      setPublicPath(normalized)
      return
    }

    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized)
    }
    setPublicPath(normalized)
  }

  if (showEntrySplash && user) {
    return <SplashScreen visible mode="entry" />
  }

  if (!user && !loading) {
    if (publicPath === '/auth') {
      return (
        <Suspense fallback={<SplashScreen visible mode="logoIntro" />}>
          <AuthPage
            authError={authError}
            onBackToLanding={() => navigatePublic('/')}
          />
        </Suspense>
      )
    }
    return (
      <Suspense fallback={<SplashScreen visible mode="logoIntro" />}>
        <LandingPage onGetStarted={() => navigatePublic('/auth')} />
      </Suspense>
    )
  }

  if (!bootSplashDone || loading) {
    return <SplashScreen visible mode="logoIntro" />
  }

  if (showPostSignupIntro) {
    return <SplashScreen visible mode="logoIntro" />
  }

  return (
    <main className="theme-shell relative z-10 mx-auto min-h-screen w-full max-w-md pb-[calc(6rem+env(safe-area-inset-bottom))]">
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
        <DailyReminder
          user={user}
          nudgeMessage={smartNudge}
          onShowNow={() => setActiveTab('journal')}
        />
      </Suspense>

      <AppShell tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        <Suspense fallback={null}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              user={user}
              todayEntry={todayEntry}
              partnerTodayEntry={partnerTodayEntry}
              partnerMoodFx={partnerMoodFx}
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
              onDeleteAllNotifications={handleDeleteAllNotifications}
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
        </Suspense>
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
