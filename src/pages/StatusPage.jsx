import { useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { STATUS_OPTIONS } from '../constants/options'
import { useSound } from '../context/SoundContext'
import { notifyLinkedPartner, saveInAppNotification, updateUserStatus } from '../services/journalService'
import SoftCard from '../components/ui/SoftCard'
import { formatLastSeen } from '../utils/date'

function StatusPage({ user, myStatus, partnerStatusData, statusLoading }) {
  const [savingStatus, setSavingStatus] = useState('')
  const [errorText, setErrorText] = useState('')
  const { playSuccess } = useSound()
  const partnerPrompt = useMemo(() => {
    if (!partnerStatusData.linked) {
      return 'Link your partner from the Profile tab using their partner code.'
    }
    if (partnerStatusData.status === 'No update yet') {
      return 'No status from your partner yet. They can set it from this page too.'
    }
    return ''
  }, [partnerStatusData.linked, partnerStatusData.status])

  async function setStatus(status) {
    setSavingStatus(status)
    setErrorText('')
    try {
      await updateUserStatus(user.uid, user.email, status)
      await saveInAppNotification(user.uid, {
        title: 'Status Updated',
        body: `You set your status to ${status}.`,
        type: 'status',
        source: 'status_update',
      })
      await notifyLinkedPartner(user.uid, {
        title: 'Status Updated',
        body: `Your partner set status to ${status}.`,
        type: 'status',
        source: 'status_update',
      })
      playSuccess()
    } catch {
      setErrorText('Unable to update status.')
    } finally {
      setSavingStatus('')
    }
  }

  return (
    <section className="space-y-3">
      <SoftCard title="Set Your Status">
        <div className="grid gap-2">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={savingStatus === item.value}
              onClick={() => setStatus(item.value)}
              className={`pressable rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition-all duration-300 ${
                myStatus === item.value ? `${item.color} shadow-sm` : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {savingStatus === item.value ? 'Updating...' : item.label}
            </button>
          ))}
        </div>

        {errorText && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{errorText}</p>
        )}
      </SoftCard>

      <SoftCard title="Live Status View">
        {statusLoading ? (
          <p className="text-sm text-slate-500">Loading statuses...</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 transition-colors duration-300">
              <p className="text-sm text-slate-600">You</p>
              <StatusBadge status={myStatus} />
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <p className="truncate pr-3 text-sm text-slate-600">{partnerStatusData.label}</p>
                <StatusBadge status={partnerStatusData.status} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{formatLastSeen(partnerStatusData.lastSeen)}</p>
              {partnerPrompt && <p className="mt-2 text-xs text-violet-700">{partnerPrompt}</p>}
            </div>
          </div>
        )}
      </SoftCard>
    </section>
  )
}

export default StatusPage
