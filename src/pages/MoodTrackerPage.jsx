import { useMemo, useState } from 'react'
import { MOOD_OPTIONS } from '../constants/options'
import { saveInAppNotification, updateUserMood } from '../services/journalService'
import SoftCard from '../components/ui/SoftCard'
import { formatReadableDate } from '../utils/date'

function MoodTrackerPage({ user, todayEntry, entries }) {
  const [savingMood, setSavingMood] = useState('')
  const [errorText, setErrorText] = useState('')
  const [selectedMood, setSelectedMood] = useState('')

  async function setMood(mood) {
    setErrorText('')
    setSavingMood(mood)
    setSelectedMood(mood)

    try {
      await updateUserMood(user.uid, mood)
      await saveInAppNotification(user.uid, {
        title: 'Mood Updated',
        body: `You selected ${mood} for today.`,
        type: 'mood',
      })
    } catch {
      setErrorText('Unable to save mood right now.')
    } finally {
      setSavingMood('')
    }
  }

  const moodHistory = useMemo(() => entries.filter((entry) => entry.mood), [entries])
  const moodPrompt = todayEntry?.mood ? '' : 'How are you feeling today? Pick a mood 💜'

  return (
    <section className="space-y-3">
      <SoftCard title="Mood Tracker" subtitle={`Current mood: ${todayEntry?.mood || '\u{1F642}'}`}>
        {moodPrompt && <p className="mb-2 text-xs text-violet-700">{moodPrompt}</p>}
        <div className="grid grid-cols-3 gap-2">
          {MOOD_OPTIONS.map((item) => {
            const isActive = todayEntry?.mood === item.emoji
            return (
              <button
                key={item.emoji}
                type="button"
                onClick={() => setMood(item.emoji)}
                disabled={savingMood === item.emoji}
                className={`pressable rounded-2xl border px-2 py-3 text-center text-2xl transition duration-300 ${
                  isActive
                    ? 'border-violet-300 bg-gradient-to-br from-violet-100 to-rose-100 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-violet-50'
                } ${selectedMood === item.emoji ? 'mood-pop' : ''}`}
                aria-label={item.label}
                title={item.label}
              >
                {savingMood === item.emoji ? '...' : item.emoji}
              </button>
            )
          })}
        </div>

        {errorText && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{errorText}</p>
        )}
      </SoftCard>

      <SoftCard title="Mood History">
        <ul className="space-y-2">
          {moodHistory.length === 0 && (
            <li className="text-sm text-slate-500">No mood history yet. Your mood check-ins will appear here.</li>
          )}
          {moodHistory.map((entry) => (
            <li
              key={entry.date}
              className="flex items-center justify-between rounded-2xl border border-violet-100/70 bg-gradient-to-r from-white to-violet-50/70 px-3 py-2"
            >
              <p className="text-xs font-semibold text-slate-500">{formatReadableDate(entry.date)}</p>
              <p className="text-2xl">{entry.mood}</p>
            </li>
          ))}
        </ul>
      </SoftCard>
    </section>
  )
}

export default MoodTrackerPage
