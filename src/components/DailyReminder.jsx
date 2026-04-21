import { useEffect, useState } from 'react'
import { saveInAppNotification } from '../services/journalService'
import { sendLocalNotification } from '../services/pushService'
import { pickDailyReminderMessage } from '../utils/emotional'
import SoftCard from './ui/SoftCard'

const SNOOZE_UNTIL_KEY = 'usvault_reminder_snooze_until'
const DAILY_PUSH_SENT_KEY = 'usvault_daily_push_sent'
const DAY_IN_MS = 24 * 60 * 60 * 1000

function DailyReminder({ user, onShowNow }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState(pickDailyReminderMessage())

  useEffect(() => {
    function evaluateReminder() {
      const snoozeUntilRaw = localStorage.getItem(SNOOZE_UNTIL_KEY)
      const snoozeUntil = Number(snoozeUntilRaw || 0)

      if (snoozeUntil && Date.now() < snoozeUntil) {
        setVisible(false)
        return
      }

      if (snoozeUntil && Date.now() >= snoozeUntil) {
        localStorage.removeItem(SNOOZE_UNTIL_KEY)
      }

      const dailyMessage = pickDailyReminderMessage()
      setMessage(dailyMessage)
      setVisible(true)

      const todayStamp = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(DAILY_PUSH_SENT_KEY) !== todayStamp) {
        sendLocalNotification('UsVault', 'Tell me about your day \u{1F4AD}')
        if (user?.uid) {
          saveInAppNotification(user.uid, {
            title: 'Daily Reminder',
            body: 'Tell me about your day \u{1F4AD}',
            type: 'reminder',
          }).catch(() => {})
        }
        localStorage.setItem(DAILY_PUSH_SENT_KEY, todayStamp)
      }
    }

    evaluateReminder()
    const timerId = window.setInterval(evaluateReminder, 60 * 1000)
    return () => window.clearInterval(timerId)
  }, [user?.uid])

  function remindTomorrow() {
    localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + DAY_IN_MS))
    setVisible(false)
  }

  function showNow() {
    localStorage.removeItem(SNOOZE_UNTIL_KEY)
    setVisible(false)
    onShowNow?.()
  }

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-4 sm:items-center">
      <SoftCard className="w-full max-w-sm rounded-[28px]">
        <p className="text-xl">{'\u{1F319}'}</p>
        <h2 className="mt-1 text-lg font-bold text-[var(--ink-title)]">Evening reminder</h2>
        <p className="mt-1 text-sm text-slate-600">{message}</p>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={showNow}
            className="pressable rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700"
          >
            Show now
          </button>
          <button
            type="button"
            onClick={remindTomorrow}
            className="pressable rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            Remind me tomorrow
          </button>
        </div>
      </SoftCard>
    </div>
  )
}

export default DailyReminder
