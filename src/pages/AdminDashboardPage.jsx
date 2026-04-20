import { useEffect, useMemo, useState } from 'react'
import PrimaryButton from '../components/ui/PrimaryButton'
import SoftCard from '../components/ui/SoftCard'
import {
  deleteUserDataByAdmin,
  setUserAccessByAdmin,
  subscribeAllUserControlsForAdmin,
  subscribeAllUsersForAdmin,
} from '../services/journalService'

function safeTimeLabel(rawTimestamp) {
  if (!rawTimestamp?.toDate) {
    return 'No activity yet'
  }

  const date = rawTimestamp.toDate()
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function mergeUsers(statusUsers, controlsMap) {
  const usersMap = new Map()

  statusUsers.forEach((item) => {
    usersMap.set(item.id, {
      uid: item.id,
      email: String(item.email || '').trim().toLowerCase(),
      displayName: item.displayName || '',
      status: item.status || 'Free',
      updatedAt: item.updatedAt || null,
    })
  })

  Object.keys(controlsMap).forEach((uid) => {
    if (!usersMap.has(uid)) {
      const control = controlsMap[uid]
      usersMap.set(uid, {
        uid,
        email: control?.email || '',
        displayName: '',
        status: 'Not available',
        updatedAt: control?.updatedAt || null,
      })
    }
  })

  return [...usersMap.values()]
    .map((item) => {
      const control = controlsMap[item.uid] || null
      return {
        ...item,
        banned: control?.banned === true,
        canUseApp: control?.canUseApp !== false,
        bannedReason: control?.bannedReason || '',
      }
    })
    .sort((a, b) => {
      const aMs = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0
      const bMs = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0
      return bMs - aMs
    })
}

function AdminDashboardPage({ adminUser }) {
  const [statusUsers, setStatusUsers] = useState([])
  const [controlsMap, setControlsMap] = useState({})
  const [actionBusyUid, setActionBusyUid] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [reasonDrafts, setReasonDrafts] = useState({})

  useEffect(() => {
    const unsubscribeStatuses = subscribeAllUsersForAdmin(
      (items) => setStatusUsers(items),
      () => setError('Unable to load users right now.'),
    )
    const unsubscribeControls = subscribeAllUserControlsForAdmin(
      (items) => setControlsMap(items),
      () => setError('Unable to load user controls right now.'),
    )

    return () => {
      unsubscribeStatuses()
      unsubscribeControls()
    }
  }, [])

  const users = useMemo(() => mergeUsers(statusUsers, controlsMap), [controlsMap, statusUsers])
  const totalUsers = users.length
  const bannedUsers = users.filter((item) => item.banned).length
  const disabledUsers = users.filter((item) => !item.canUseApp).length
  const activeUsers = users.filter((item) => !item.banned && item.canUseApp).length

  function setDraft(uid, value) {
    setReasonDrafts((current) => ({ ...current, [uid]: value }))
  }

  async function handleBanToggle(item) {
    if (!item?.uid || item.uid === adminUser?.uid) {
      setError('Admin self-access cannot be modified from this panel.')
      return
    }

    setActionBusyUid(item.uid)
    setError('')
    setMessage('')

    try {
      const nextBanned = !item.banned
      const reason = String(reasonDrafts[item.uid] || '').trim()
      await setUserAccessByAdmin(
        adminUser,
        { uid: item.uid, email: item.email },
        {
          banned: nextBanned,
          canUseApp: item.canUseApp,
          bannedReason: nextBanned ? reason || 'Restricted by admin' : '',
        },
      )
      setMessage(nextBanned ? `User ${item.email || item.uid} is now banned.` : `Ban removed for ${item.email || item.uid}.`)
    } catch {
      setError('Unable to update ban status right now.')
    } finally {
      setActionBusyUid('')
    }
  }

  async function handleAccessToggle(item) {
    if (!item?.uid || item.uid === adminUser?.uid) {
      setError('Admin self-access cannot be modified from this panel.')
      return
    }

    setActionBusyUid(item.uid)
    setError('')
    setMessage('')

    try {
      const nextCanUseApp = !item.canUseApp
      await setUserAccessByAdmin(
        adminUser,
        { uid: item.uid, email: item.email },
        {
          banned: item.banned,
          canUseApp: nextCanUseApp,
          bannedReason: item.banned ? item.bannedReason || 'Restricted by admin' : '',
        },
      )
      setMessage(
        nextCanUseApp
          ? `App access restored for ${item.email || item.uid}.`
          : `App access disabled for ${item.email || item.uid}.`,
      )
    } catch {
      setError('Unable to update app access right now.')
    } finally {
      setActionBusyUid('')
    }
  }

  async function handleDeleteUserData(item) {
    if (!item?.uid || item.uid === adminUser?.uid) {
      setError('Admin account cannot be deleted from this panel.')
      return
    }

    const approved = window.confirm(
      `Delete all app data for ${item.email || item.uid}? This will also block access.`,
    )
    if (!approved) {
      return
    }

    setActionBusyUid(item.uid)
    setError('')
    setMessage('')

    try {
      await deleteUserDataByAdmin(adminUser, { uid: item.uid, email: item.email })
      setMessage(`Deleted app data and blocked ${item.email || item.uid}.`)
    } catch {
      setError('Unable to delete this user data right now.')
    } finally {
      setActionBusyUid('')
    }
  }

  return (
    <section className="space-y-3">
      <SoftCard title="Admin Dashboard" subtitle="Manage users, access, and moderation controls">
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-xl border border-violet-100 bg-white/80 px-3 py-2">
            <p className="font-semibold text-violet-600">Total</p>
            <p className="mt-1 text-base font-bold text-slate-700">{totalUsers}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/75 px-3 py-2">
            <p className="font-semibold text-emerald-700">Active</p>
            <p className="mt-1 text-base font-bold text-emerald-700">{activeUsers}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/75 px-3 py-2">
            <p className="font-semibold text-rose-700">Banned</p>
            <p className="mt-1 text-base font-bold text-rose-700">{bannedUsers}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2">
            <p className="font-semibold text-amber-700">Disabled</p>
            <p className="mt-1 text-base font-bold text-amber-700">{disabledUsers}</p>
          </div>
        </div>

        {message && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}
      </SoftCard>

      {users.map((item) => {
        const isBusy = actionBusyUid === item.uid
        const isSelf = item.uid === adminUser?.uid
        const reasonValue = reasonDrafts[item.uid] ?? item.bannedReason ?? ''

        return (
          <SoftCard key={item.uid} title={item.displayName || item.email || 'Unknown user'} subtitle={`UID: ${item.uid}`}>
            <div className="space-y-2 text-xs">
              <p className="rounded-xl border border-violet-100 bg-white/80 px-3 py-2 text-slate-600">
                Email: <span className="font-semibold text-violet-700">{item.email || 'Unknown'}</span>
              </p>
              <p className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-slate-600">
                Status: <span className="font-semibold text-slate-700">{item.status}</span>
              </p>
              <p className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-slate-600">
                Last update: <span className="font-semibold text-slate-700">{safeTimeLabel(item.updatedAt)}</span>
              </p>

              <div className="grid grid-cols-2 gap-2">
                <p className="rounded-xl border border-rose-100 bg-rose-50/75 px-3 py-2 text-center font-semibold text-rose-700">
                  {item.banned ? 'Banned' : 'Not banned'}
                </p>
                <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-center font-semibold text-amber-700">
                  {item.canUseApp ? 'App enabled' : 'App disabled'}
                </p>
              </div>

              <textarea
                value={reasonValue}
                onChange={(event) => setDraft(item.uid, event.target.value)}
                rows={2}
                placeholder="Ban reason for this user"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                disabled={isSelf || isBusy}
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <PrimaryButton
                  type="button"
                  onClick={() => handleBanToggle(item)}
                  disabled={isSelf || isBusy}
                  className="w-full"
                >
                  {item.banned ? 'Unban User' : 'Ban User'}
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => handleAccessToggle(item)}
                  disabled={isSelf || isBusy}
                  className="pressable rounded-2xl border border-violet-200 bg-white/80 px-3 py-2.5 text-sm font-semibold text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item.canUseApp ? 'Disable App' : 'Enable App'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUserData(item)}
                  disabled={isSelf || isBusy}
                  className="pressable rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete User Data
                </button>
              </div>
              {isSelf && <p className="text-[11px] font-semibold text-slate-500">Self-protection enabled for admin account.</p>}
            </div>
          </SoftCard>
        )
      })}
    </section>
  )
}

export default AdminDashboardPage
