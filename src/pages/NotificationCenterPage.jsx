import { useMemo, useState } from 'react'
import SoftCard from '../components/ui/SoftCard'
import SoftModal from '../components/ui/SoftModal'

function formatNotificationTime(value) {
  if (!value) {
    return 'Just now'
  }

  let date = null
  if (typeof value?.toDate === 'function') {
    date = value.toDate()
  } else if (value instanceof Date) {
    date = value
  } else if (typeof value === 'number') {
    date = new Date(value)
  }

  if (!date || Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function NotificationCenterPage({
  notifications,
  notificationsLoading,
  unreadCount,
  onMarkAllRead,
  onDeleteNotification,
  onDeleteAllNotifications,
}) {
  const [busyRead, setBusyRead] = useState(false)
  const [busyDeleteId, setBusyDeleteId] = useState('')
  const [busyDeleteAll, setBusyDeleteAll] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [actionError, setActionError] = useState('')

  const titleText = useMemo(
    () => (unreadCount > 0 ? `Unread: ${unreadCount}` : 'All caught up'),
    [unreadCount],
  )

  async function handleMarkAllRead() {
    setBusyRead(true)
    setActionError('')
    try {
      await onMarkAllRead()
    } catch {
      setActionError('Could not mark notifications as read.')
    } finally {
      setBusyRead(false)
    }
  }

  async function handleDelete(id) {
    setBusyDeleteId(id)
    setActionError('')
    try {
      await onDeleteNotification(id)
    } catch {
      setActionError('Could not delete notification.')
    } finally {
      setBusyDeleteId('')
    }
  }

  async function handleDeleteAll() {
    setBusyDeleteAll(true)
    setActionError('')
    try {
      await onDeleteAllNotifications()
      setConfirmDeleteAll(false)
    } catch {
      setActionError('Could not clear all notifications.')
    } finally {
      setBusyDeleteAll(false)
    }
  }

  return (
    <section className="space-y-3">
      <SoftCard title="Notification Center" subtitle={titleText}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={busyRead || unreadCount === 0}
            className="pressable rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-50"
          >
            {busyRead ? 'Updating...' : 'Mark all read'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={busyDeleteAll || notifications.length === 0}
            className="pressable rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"
          >
            {busyDeleteAll ? 'Clearing...' : 'Delete all'}
          </button>
        </div>
        {actionError && <p className="mt-2 text-xs font-semibold text-rose-700">{actionError}</p>}
      </SoftCard>

      <SoftCard title="Live Feed">
        {notificationsLoading ? (
          <p className="text-sm text-slate-500">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-violet-700">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border px-3 py-2 ${
                  item.read
                    ? 'border-violet-100 bg-white/75'
                    : 'border-fuchsia-200 bg-gradient-to-r from-fuchsia-50/80 to-violet-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.title || 'UsVault'}</p>
                    {item.body && <p className="mt-1 text-sm text-slate-600">{item.body}</p>}
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatNotificationTime(item.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={busyDeleteId === item.id}
                    className="pressable rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700 disabled:opacity-60"
                  >
                    {busyDeleteId === item.id ? '...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>

      <SoftModal
        open={confirmDeleteAll}
        onClose={() => {
          if (!busyDeleteAll) {
            setConfirmDeleteAll(false)
          }
        }}
        title="Delete all notifications"
      >
        <p className="text-sm text-slate-600">
          This will remove all notifications from your dashboard feed.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(false)}
            disabled={busyDeleteAll}
            className="pressable flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={busyDeleteAll}
            className="pressable flex-1 rounded-xl border border-rose-200 bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
          >
            {busyDeleteAll ? 'Deleting...' : 'Delete all'}
          </button>
        </div>
      </SoftModal>
    </section>
  )
}

export default NotificationCenterPage
