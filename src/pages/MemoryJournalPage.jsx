import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import MemoryTimelineItem from '../components/MemoryTimelineItem'
import SmartImage from '../components/SmartImage'
import HeartLoader from '../components/HeartLoader'
import PrimaryButton from '../components/ui/PrimaryButton'
import SoftCard from '../components/ui/SoftCard'
import SoftModal from '../components/ui/SoftModal'
import { useSound } from '../context/SoundContext'
import {
  deleteDailyEntry,
  formatDateKey,
  saveDailyEntry,
  saveInAppNotification,
  uploadEntryImage,
} from '../services/journalService'
import { formatReadableDate } from '../utils/date'

function MemoryJournalPage({ user, todayEntry, entries, entriesLoading, loadingTitle, loadingCaption }) {
  const [text, setText] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [showActionLoader, setShowActionLoader] = useState(false)
  const [successText, setSuccessText] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveGlow, setSaveGlow] = useState(false)

  const [editingEntry, setEditingEntry] = useState(null)
  const [editText, setEditText] = useState('')
  const [editImageFile, setEditImageFile] = useState(null)
  const [editPreview, setEditPreview] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletingDate, setDeletingDate] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const { playChime } = useSound()

  const todayKey = formatDateKey(new Date())
  const deferredEntries = useDeferredValue(entries)

  useEffect(() => {
    setText(todayEntry?.text || '')
  }, [todayEntry?.text])

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(todayEntry?.imageUrl || '')
      return undefined
    }

    const objectUrl = URL.createObjectURL(selectedImage)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedImage, todayEntry?.imageUrl])

  useEffect(() => {
    if (!editingEntry) {
      setEditText('')
      setEditImageFile(null)
      setEditPreview('')
      setEditError('')
      return
    }

    setEditText(editingEntry.text || '')
    setEditPreview(editingEntry.imageUrl || '')
  }, [editingEntry])

  useEffect(() => {
    if (!editingEntry || !editImageFile) {
      return
    }

    const objectUrl = URL.createObjectURL(editImageFile)
    setEditPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [editImageFile, editingEntry])

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setShowActionLoader(true)
    setSuccessText('')
    setSaveError('')

    try {
      let imagePayload = {}

      if (selectedImage) {
        imagePayload = await uploadEntryImage(
          user.uid,
          todayKey,
          selectedImage,
          todayEntry?.imagePath || '',
        )
      }

      await saveDailyEntry(user.uid, todayKey, {
        text,
        ...imagePayload,
      })
      await saveInAppNotification(user.uid, {
        title: 'Memory Saved',
        body: 'Today\'s memory was added to your vault.',
        type: 'memory',
      })

      startTransition(() => {
        setSelectedImage(null)
        setSuccessText('Saved to your vault.')
        setSaveGlow(true)
      })
      playChime()
    } catch {
      setSaveError('Saving failed, try again.')
    } finally {
      setSaving(false)
      window.setTimeout(() => setShowActionLoader(false), 650)
    }
  }

  useEffect(() => {
    if (!showActionLoader) {
      return undefined
    }

    const timerId = window.setTimeout(() => setShowActionLoader(false), 1800)
    return () => window.clearTimeout(timerId)
  }, [showActionLoader])

  useEffect(() => {
    if (!saveGlow) {
      return undefined
    }
    const timerId = window.setTimeout(() => setSaveGlow(false), 360)
    return () => window.clearTimeout(timerId)
  }, [saveGlow])

  function startEdit(entry) {
    setEditingEntry(entry)
    setEditImageFile(null)
    setEditError('')
  }

  async function saveEdit() {
    if (!editingEntry) {
      return
    }

    setEditSaving(true)
    setEditError('')
    try {
      let imagePayload = {}
      if (editImageFile) {
        imagePayload = await uploadEntryImage(
          user.uid,
          editingEntry.date,
          editImageFile,
          editingEntry.imagePath || '',
        )
      }

      await saveDailyEntry(user.uid, editingEntry.date, {
        text: editText,
        ...imagePayload,
      })
      await saveInAppNotification(user.uid, {
        title: 'Memory Updated',
        body: `Updated memory for ${formatReadableDate(editingEntry.date)}.`,
        type: 'memory',
      })

      setEditingEntry(null)
      setSuccessText(`Memory updated for ${formatReadableDate(editingEntry.date)}.`)
    } catch {
      setEditError('Saving failed, try again.')
    } finally {
      setEditSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return
    }

    setDeletingDate(deleteTarget.date)
    setDeleteError('')

    try {
      await deleteDailyEntry(user.uid, deleteTarget.date, deleteTarget.imagePath || '')
      await saveInAppNotification(user.uid, {
        title: 'Memory Deleted',
        body: `Deleted memory from ${formatReadableDate(deleteTarget.date)}.`,
        type: 'memory',
      })
      setDeleteTarget(null)
      setSuccessText(`Deleted memory from ${formatReadableDate(deleteTarget.date)}.`)
    } catch {
      setDeleteError('Saving failed, try again.')
    } finally {
      setDeletingDate('')
    }
  }

  return (
    <section className="relative space-y-3">
      <HeartLoader
        visible={showActionLoader}
        fullScreen={false}
        title={loadingTitle || 'UsVault'}
        caption={loadingCaption || 'Saving memory...'}
        className="pointer-events-none"
      />

      <SoftCard title="Memory Journal" subtitle={formatReadableDate(todayKey)}>
        <form onSubmit={handleSave}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            placeholder="Write your memory for today..."
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
          />

          <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Upload Daily Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
            className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:font-semibold file:text-violet-700"
          />

          {previewUrl && (
            <SmartImage
              src={previewUrl}
              alt="Memory preview"
              containerClassName="mt-3 rounded-2xl border border-violet-100"
              className={`h-44 w-full rounded-2xl object-cover transition duration-300 ${saving ? 'scale-[1.02] blur-[1px]' : ''}`}
            />
          )}

          {successText && (
            <p
              className={`mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 pulse-soft ${saveGlow ? 'save-chime-glow' : ''}`}
            >
              {successText}
            </p>
          )}
          {saveError && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{saveError}</p>}

          <PrimaryButton type="submit" disabled={saving} className="mt-3 w-full">
            {saving ? 'Saving...' : 'Save Today'}
          </PrimaryButton>
        </form>
      </SoftCard>

      <SoftCard title="Memory Timeline">
        {entriesLoading ? (
          <p className="text-sm text-slate-500">Loading memories...</p>
        ) : (
          <div className="max-h-[52vh] overflow-y-auto pr-1 scroll-smooth">
            <ul className="space-y-3">
              {deferredEntries.length === 0 && (
                <li className="rounded-2xl border border-violet-100/80 bg-violet-50/60 px-3 py-3 text-sm text-violet-700">
                  Start your first memory {'\u{1F49C}'}
                </li>
              )}
              {deferredEntries.map((entry, index) => (
                <li key={entry.date} className="relative list-none">
                  {index < deferredEntries.length - 1 && <span className="timeline-line" />}
                  <MemoryTimelineItem
                    entry={entry}
                    onEdit={startEdit}
                    onDelete={(item) => setDeleteTarget(item)}
                    deleting={deletingDate === entry.date}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </SoftCard>

      <SoftModal open={Boolean(editingEntry)} onClose={() => setEditingEntry(null)} title="Edit Memory">
        {editingEntry && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
              {formatReadableDate(editingEntry.date)}
            </p>
            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm leading-relaxed outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-200"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setEditImageFile(event.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:font-semibold file:text-violet-700"
            />
            {editPreview && (
              <SmartImage
                src={editPreview}
                alt="Edit preview"
                containerClassName="rounded-2xl border border-violet-100"
                className="h-40 w-full rounded-2xl object-cover"
              />
            )}
            {editError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{editError}</p>}
            <PrimaryButton type="button" onClick={saveEdit} disabled={editSaving} className="w-full">
              {editSaving ? 'Saving...' : 'Save Changes'}
            </PrimaryButton>
          </div>
        )}
      </SoftModal>

      <SoftModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Memory">
        {deleteTarget && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Delete memory from <span className="font-semibold">{formatReadableDate(deleteTarget.date)}</span>?
            </p>
            {deleteError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{deleteError}</p>}
            <div className="grid gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingDate)}
                className="pressable rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-60"
              >
                {deletingDate ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="pressable rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SoftModal>
    </section>
  )
}

export default MemoryJournalPage
