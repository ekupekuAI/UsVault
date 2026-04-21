import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import MicroHeartBurst from '../components/effects/MicroHeartBurst'
import PrimaryButton from '../components/ui/PrimaryButton'
import FeedbackToast from '../components/ui/FeedbackToast'
import SoftCard from '../components/ui/SoftCard'
import SoftModal from '../components/ui/SoftModal'
import { useSound } from '../context/SoundContext'
import {
  formatDateKey,
  notifyLinkedPartner,
  saveDailyEntry,
  saveInAppNotification,
  updateUserGossipEntries,
} from '../services/journalService'
import {
  clearLastDeleted,
  deleteWithUndo,
  restoreLastDeleted,
  updateLastActive,
} from '../utils/advancedLogic'

const GOSSIP_TAGS = ['Fun \u2615', 'Spicy \u{1F525}', 'Secret \u{1F92B}']

function safeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeList(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function VibesPage({ user, myProfile, todayEntry }) {
  const MotionDiv = motion.div
  const [ready, setReady] = useState(false)
  const { playSuccess } = useSound()

  const dateKey = useMemo(() => `usvault_date_ideas_${user.uid}`, [user.uid])
  const notesKey = useMemo(() => `usvault_quick_notes_${user.uid}`, [user.uid])

  const [dateIdeaInput, setDateIdeaInput] = useState('')
  const [dateIdeas, setDateIdeas] = useState([])
  const [rolledIdea, setRolledIdea] = useState(null)
  const [rollCount, setRollCount] = useState(0)
  const [showDateManager, setShowDateManager] = useState(false)
  const [editingIdeaId, setEditingIdeaId] = useState('')
  const [editingIdeaText, setEditingIdeaText] = useState('')
  const [diceSaveLoading, setDiceSaveLoading] = useState(false)
  const [diceSaveMessage, setDiceSaveMessage] = useState('')
  const [diceSaveError, setDiceSaveError] = useState('')

  const [gossipInput, setGossipInput] = useState('')
  const [gossipTag, setGossipTag] = useState(GOSSIP_TAGS[0])
  const [gossipEntries, setGossipEntries] = useState([])
  const [gossipSaving, setGossipSaving] = useState(false)
  const [gossipError, setGossipError] = useState('')
  const [gossipDeleteTarget, setGossipDeleteTarget] = useState(null)

  const [noteInput, setNoteInput] = useState('')
  const [notes, setNotes] = useState([])
  const [noteDeleteTarget, setNoteDeleteTarget] = useState(null)

  const [toast, setToast] = useState({ visible: false, message: '', actionLabel: '' })
  const [heartBurstVisible, setHeartBurstVisible] = useState(false)
  const undoTimerRef = useRef(null)

  function showToast(message, actionLabel = '') {
    setToast({ visible: true, message, actionLabel })
  }

  useEffect(() => {
    setDateIdeas(readList(dateKey))
    setNotes(readList(notesKey))
    setReady(true)
  }, [dateKey, notesKey])

  useEffect(() => {
    if (!ready) {
      return
    }
    writeList(dateKey, dateIdeas)
  }, [dateIdeas, dateKey, ready])

  useEffect(() => {
    if (!ready) {
      return
    }
    writeList(notesKey, notes)
  }, [notes, notesKey, ready])

  useEffect(() => {
    const incoming = Array.isArray(myProfile?.gossipEntries) ? myProfile.gossipEntries : []
    const sorted = [...incoming].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    setGossipEntries(sorted)
  }, [myProfile?.gossipEntries])

  useEffect(() => {
    if (!toast.visible) {
      return undefined
    }
    const timerId = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }))
    }, 2800)
    return () => window.clearTimeout(timerId)
  }, [toast.visible])

  useEffect(() => {
    if (!heartBurstVisible) {
      return undefined
    }
    const timerId = window.setTimeout(() => setHeartBurstVisible(false), 880)
    return () => window.clearTimeout(timerId)
  }, [heartBurstVisible])

  useEffect(
    () => () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current)
      }
      clearLastDeleted()
    },
    [],
  )

  function queueUndo(payload) {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current)
    }
    deleteWithUndo(payload)
    undoTimerRef.current = window.setTimeout(() => {
      clearLastDeleted()
      undoTimerRef.current = null
    }, 5000)
    showToast('Deleted', 'Undo')
  }

  async function handleUndo() {
    const payload = restoreLastDeleted()
    if (!payload) {
      return
    }
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }

    if (payload.type === 'gossip') {
      const restoreList = [...payload.nextList]
      restoreList.splice(payload.index, 0, payload.item)
      setGossipEntries(restoreList)
      await syncGossip(restoreList)
    }

    if (payload.type === 'note') {
      const restoreNotes = [...payload.nextList]
      restoreNotes.splice(payload.index, 0, payload.item)
      setNotes(restoreNotes)
    }

    showToast('Undo complete')
  }

  function addDateIdea(event) {
    event.preventDefault()
    const idea = dateIdeaInput.trim()
    if (!idea) {
      return
    }
    setDateIdeas((current) => [{ id: safeId(), text: idea }, ...current])
    setDateIdeaInput('')
    showToast('Saved 💜')
    playSuccess()
  }

  function rollDateDice() {
    if (!dateIdeas.length) {
      return
    }
    const randomIndex = Math.floor(Math.random() * dateIdeas.length)
    setRolledIdea(dateIdeas[randomIndex])
    setRollCount((count) => count + 1)
    setDiceSaveMessage('')
    setDiceSaveError('')
  }

  async function saveRolledIdeaAsMemory() {
    if (!rolledIdea) {
      return
    }

    const todayKey = formatDateKey(new Date())
    const taggedLine = `Planned from a random idea \u{1F3B2}: ${rolledIdea.text}`
    const currentText = (todayEntry?.text || '').trim()
    const nextText = currentText.includes(taggedLine)
      ? currentText
      : currentText
        ? `${currentText}\n\n${taggedLine}`
        : taggedLine

    setDiceSaveLoading(true)
    setDiceSaveMessage('')
    setDiceSaveError('')
    try {
      await saveDailyEntry(user.uid, todayKey, { text: nextText, sourceTag: 'Planned from a random idea \u{1F3B2}' })
      await saveInAppNotification(user.uid, {
        title: 'Date Dice Saved',
        body: 'A rolled date idea was saved as memory.',
        type: 'vibes',
        source: 'dice_memory_save',
      })
      await notifyLinkedPartner(user.uid, {
        title: 'New Memory Update',
        body: 'Your partner saved a date idea into today\'s memory.',
        type: 'memory',
        source: 'dice_memory_save',
      })
      updateLastActive()
      setDiceSaveMessage('Saved to today\'s memory.')
      setHeartBurstVisible(true)
      showToast('Saved 💜')
      playSuccess()
    } catch {
      setDiceSaveError('Saving failed, try again.')
    } finally {
      setDiceSaveLoading(false)
    }
  }

  function startEditIdea(idea) {
    setEditingIdeaId(idea.id)
    setEditingIdeaText(idea.text)
  }

  function saveEditedIdea() {
    const text = editingIdeaText.trim()
    if (!text || !editingIdeaId) {
      return
    }
    setDateIdeas((current) =>
      current.map((idea) => (idea.id === editingIdeaId ? { ...idea, text } : idea)),
    )
    setEditingIdeaId('')
    setEditingIdeaText('')
    showToast('Saved 💜')
    playSuccess()
  }

  function deleteDateIdea(id) {
    setDateIdeas((current) => current.filter((idea) => idea.id !== id))
    if (editingIdeaId === id) {
      setEditingIdeaId('')
      setEditingIdeaText('')
    }
    showToast('Deleted')
  }

  async function syncGossip(nextList) {
    setGossipSaving(true)
    setGossipError('')
    try {
      await updateUserGossipEntries(user.uid, user.email, nextList)
      return true
    } catch {
      setGossipError('Saving failed, try again.')
      return false
    } finally {
      setGossipSaving(false)
    }
  }

  async function addGossip(event) {
    event.preventDefault()
    const text = gossipInput.trim()
    if (!text) {
      return
    }

    const savedTag = gossipTag
    const nextList = [{ id: safeId(), text, tag: savedTag, createdAt: Date.now() }, ...gossipEntries]
    setGossipEntries(nextList)
    setGossipInput('')
    setGossipTag(GOSSIP_TAGS[0])
    const synced = await syncGossip(nextList)
    if (!synced) {
      return
    }

    await saveInAppNotification(user.uid, {
      title: 'Gossip Added',
      body: `New gossip saved in ${savedTag}.`,
      type: 'vibes',
      source: 'gossip_add',
    }).catch(() => {})
    await notifyLinkedPartner(user.uid, {
      title: 'New Gossip Added',
      body: `Your partner added gossip in ${savedTag}.`,
      type: 'gossip',
      source: 'gossip_add',
    })

    showToast('Saved 💜')
    setHeartBurstVisible(true)
    playSuccess()
  }

  function confirmDeleteGossip() {
    if (!gossipDeleteTarget) {
      return
    }
    const index = gossipEntries.findIndex((item) => item.id === gossipDeleteTarget.id)
    const nextList = gossipEntries.filter((item) => item.id !== gossipDeleteTarget.id)
    setGossipEntries(nextList)
    syncGossip(nextList)
    queueUndo({ type: 'gossip', item: gossipDeleteTarget, index, nextList })
    setGossipDeleteTarget(null)
  }

  function addNote(event) {
    event.preventDefault()
    const text = noteInput.trim()
    if (!text) {
      return
    }
    setNotes((current) => [{ id: safeId(), text }, ...current])
    setNoteInput('')
    showToast('Saved 💜')
    playSuccess()
  }

  function confirmDeleteNote() {
    if (!noteDeleteTarget) {
      return
    }
    const index = notes.findIndex((item) => item.id === noteDeleteTarget.id)
    const nextList = notes.filter((item) => item.id !== noteDeleteTarget.id)
    setNotes(nextList)
    queueUndo({ type: 'note', item: noteDeleteTarget, index, nextList })
    setNoteDeleteTarget(null)
  }

  return (
    <section className="space-y-3">
      <SoftCard title="Date Dice" subtitle="Private to you only">
        <div className="relative">
          <MicroHeartBurst visible={heartBurstVisible} />
        </div>
        <form className="space-y-2" onSubmit={addDateIdea}>
          <input
            type="text"
            value={dateIdeaInput}
            onChange={(event) => setDateIdeaInput(event.target.value)}
            placeholder="Add date idea..."
            className="w-full rounded-2xl border border-violet-200 bg-white/70 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          />
          <PrimaryButton type="submit" className="w-full">
            Save Idea
          </PrimaryButton>
        </form>

        {dateIdeas.length === 0 && (
          <p className="mt-3 text-center text-sm text-violet-700">
            Add your first date idea... let&apos;s make a plan 💜
          </p>
        )}

        {dateIdeas.length > 0 && (
          <>
            <PrimaryButton type="button" onClick={rollDateDice} className="mt-3 w-full">
              Roll the Dice {'\u{1F3B2}'}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setShowDateManager((current) => !current)}
              className="pressable mt-2 w-full rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs font-semibold text-violet-700"
            >
              {showDateManager ? 'Hide Saved Ideas' : 'Manage Saved Ideas'}
            </button>
          </>
        )}

        {rolledIdea && (
          <MotionDiv
            key={`${rolledIdea.id}-${rollCount}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.26 }}
            className="mt-3 rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/85 to-violet-50/80 px-3 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
              Tonight&apos;s Pick
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{rolledIdea.text}</p>
            <PrimaryButton
              type="button"
              onClick={saveRolledIdeaAsMemory}
              disabled={diceSaveLoading}
              className="mt-3 w-full"
            >
              {diceSaveLoading ? 'Saving...' : 'Save as memory'}
            </PrimaryButton>
            {diceSaveMessage && <p className="mt-2 text-xs font-semibold text-emerald-700">{diceSaveMessage}</p>}
            {diceSaveError && <p className="mt-2 text-xs font-semibold text-rose-700">{diceSaveError}</p>}
          </MotionDiv>
        )}

        {showDateManager && dateIdeas.length > 0 && (
          <div className="mt-3 space-y-2 rounded-2xl border border-violet-100 bg-white/70 p-2.5">
            {dateIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-xl border border-violet-100/80 bg-gradient-to-r from-white/90 to-violet-50/75 px-2.5 py-2"
              >
                {editingIdeaId === idea.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingIdeaText}
                      onChange={(event) => setEditingIdeaText(event.target.value)}
                      className="w-full rounded-lg border border-violet-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEditedIdea}
                        className="pressable rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIdeaId('')
                          setEditingIdeaText('')
                        }}
                        className="pressable rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700">{idea.text}</p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEditIdea(idea)}
                        className="pressable rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-violet-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDateIdea(idea.id)}
                        className="pressable rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SoftCard>

      <SoftCard title="Gossip Zone">
        <form className="space-y-2" onSubmit={addGossip}>
          <textarea
            value={gossipInput}
            onChange={(event) => setGossipInput(event.target.value)}
            rows={3}
            placeholder="Drop a private gossip..."
            className="w-full rounded-2xl border border-violet-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          />
          <select
            value={gossipTag}
            onChange={(event) => setGossipTag(event.target.value)}
            className="w-full rounded-2xl border border-violet-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          >
            {GOSSIP_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <PrimaryButton type="submit" disabled={gossipSaving} className="w-full">
            {gossipSaving ? 'Saving...' : 'Save Gossip'}
          </PrimaryButton>
        </form>

        {gossipError && (
          <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {gossipError}
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {gossipEntries.length === 0 && (
            <li className="text-center text-sm text-violet-700">Spill something fun ☕</li>
          )}
          {gossipEntries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-violet-100/80 bg-gradient-to-r from-white/90 to-violet-50/80 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-700">
                  {entry.tag}
                </span>
                <button
                  type="button"
                  onClick={() => setGossipDeleteTarget(entry)}
                  className="pressable rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-700">{entry.text}</p>
            </li>
          ))}
        </ul>
      </SoftCard>

      <SoftCard title="Quick Notes">
        <form className="space-y-2" onSubmit={addNote}>
          <input
            type="text"
            value={noteInput}
            onChange={(event) => setNoteInput(event.target.value)}
            placeholder="Write something random \u{1F4AD}"
            className="w-full rounded-2xl border border-violet-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          />
          <PrimaryButton type="submit" className="w-full">
            Save Note
          </PrimaryButton>
        </form>

        <ul className="mt-3 space-y-2">
          {notes.length === 0 && (
            <li className="text-center text-sm text-violet-700">Write what&apos;s on your mind 💭</li>
          )}
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-violet-100 bg-white/80 px-3 py-2 text-sm text-slate-700"
            >
              <span className="pr-2">{note.text}</span>
              <button
                type="button"
                onClick={() => setNoteDeleteTarget(note)}
                className="pressable rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </SoftCard>

      <SoftModal open={Boolean(gossipDeleteTarget)} onClose={() => setGossipDeleteTarget(null)} title="Delete Gossip">
        {gossipDeleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Delete this gossip entry?</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={confirmDeleteGossip}
                className="pressable rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setGossipDeleteTarget(null)}
                className="pressable rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SoftModal>

      <SoftModal open={Boolean(noteDeleteTarget)} onClose={() => setNoteDeleteTarget(null)} title="Delete Note">
        {noteDeleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Delete this note?</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="pressable rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setNoteDeleteTarget(null)}
                className="pressable rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SoftModal>

      <FeedbackToast
        visible={toast.visible}
        message={toast.message}
        actionLabel={toast.actionLabel}
        onAction={toast.actionLabel === 'Undo' ? handleUndo : undefined}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </section>
  )
}

export default VibesPage
