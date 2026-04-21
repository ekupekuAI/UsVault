import { useEffect, useMemo, useState } from 'react'
import SmartImage from '../components/SmartImage'
import StatusBadge from '../components/StatusBadge'
import PrimaryButton from '../components/ui/PrimaryButton'
import SoftCard from '../components/ui/SoftCard'
import SoftModal from '../components/ui/SoftModal'
import { useSound } from '../context/SoundContext'
import { updateUserPersonalization } from '../services/journalService'
import { formatLastSeen, formatReadableDate } from '../utils/date'
import {
  formatGreetingForPartner,
  formatOutgoingGreetingPreview,
  getEmotionalCaption,
  getSmartStatusMessage,
} from '../utils/emotional'

function DashboardPage({
  user,
  todayEntry,
  entries,
  onThisDayEntry,
  myStatus,
  partnerStatus,
  partnerLabel,
  partnerLastSeen,
  todayLoading,
  statusLoading,
  myProfile,
  partnerProfile,
}) {
  const { playSuccess } = useSound()
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState('')
  const [profileError, setProfileError] = useState('')
  const [missMeOpen, setMissMeOpen] = useState(false)
  const [missMeItem, setMissMeItem] = useState(null)

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    partnerName: '',
    greetingTemplate: '',
    missMeMessage: '',
    loadingTitleForPartner: '',
    loadingCaptionForPartner: '',
  })

  useEffect(() => {
    setProfileForm({
      displayName: myProfile?.displayName || '',
      partnerName: myProfile?.partnerName || '',
      greetingTemplate: myProfile?.greetingTemplate || '',
      missMeMessage: myProfile?.missMeMessage || '',
      loadingTitleForPartner: myProfile?.loadingTitleForPartner || '',
      loadingCaptionForPartner: myProfile?.loadingCaptionForPartner || '',
    })
  }, [
    myProfile?.displayName,
    myProfile?.greetingTemplate,
    myProfile?.loadingTitleForPartner,
    myProfile?.loadingCaptionForPartner,
    myProfile?.missMeMessage,
    myProfile?.partnerName,
  ])

  const incomingGreeting = useMemo(
    () => formatGreetingForPartner({ partnerProfile, myProfile }),
    [myProfile, partnerProfile],
  )

  const smartStatusMessage = useMemo(() => getSmartStatusMessage(partnerStatus), [partnerStatus])
  const statusPrompt =
    partnerStatus === 'No update yet'
      ? 'No status update yet. Ask your partner to set one \u{1F49C}'
      : smartStatusMessage
  const moodPrompt = todayEntry?.mood ? '' : 'No mood yet. Add one in Mood Tracker \u{1F60A}'
  const todayCaption = useMemo(() => getEmotionalCaption(todayEntry), [todayEntry])
  const outgoingPreview = useMemo(() => formatOutgoingGreetingPreview(profileForm), [profileForm])
  const partnerLatestGossip = useMemo(() => {
    if (!Array.isArray(partnerProfile?.gossipEntries) || partnerProfile.gossipEntries.length === 0) {
      return null
    }
    return [...partnerProfile.gossipEntries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
  }, [partnerProfile?.gossipEntries])

  const missMeCandidates = useMemo(() => {
    const memoryCandidates = entries.filter((entry) => entry?.date && entry.date !== todayEntry?.date)
    const options = memoryCandidates.map((entry) => ({ type: 'memory', value: entry }))

    if (partnerProfile?.missMeMessage) {
      options.push({ type: 'message', value: partnerProfile.missMeMessage })
    }
    if (!options.length && myProfile?.missMeMessage) {
      options.push({ type: 'message', value: myProfile.missMeMessage })
    }
    if (!options.length) {
      options.push({ type: 'message', value: 'I am with you, always.' })
    }

    return options
  }, [entries, myProfile?.missMeMessage, partnerProfile?.missMeMessage, todayEntry?.date])

  function updateField(field, value) {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  async function savePersonalization() {
    setSavingProfile(true)
    setProfileSaved('')
    setProfileError('')
    try {
      await updateUserPersonalization(user.uid, user.email, profileForm)
      setProfileSaved('Saved. It syncs live for both of you.')
      playSuccess()
    } catch {
      setProfileError('Saving failed, try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  function openMissMe() {
    const randomIndex = Math.floor(Math.random() * missMeCandidates.length)
    setMissMeItem(missMeCandidates[randomIndex])
    setMissMeOpen(true)
  }

  return (
    <section className="space-y-3">
      {partnerLatestGossip && (
        <SoftCard title="Gossip Bar">
          <div className="rounded-2xl border border-fuchsia-200/90 bg-gradient-to-r from-rose-50/90 via-fuchsia-50/85 to-violet-50/90 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-700">
                {partnerLabel} shared
              </p>
              <span className="rounded-full border border-fuchsia-200 bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-700">
                {partnerLatestGossip.tag || 'Fun \u2615'}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-700">{partnerLatestGossip.text}</p>
          </div>
        </SoftCard>
      )}

      <SoftCard title="For You">
        <h2 className="text-lg font-bold text-[var(--ink-title)]">{incomingGreeting}</h2>
        <p className="mt-1 text-xs text-slate-500">From {partnerLabel}</p>

        <button
          type="button"
          onClick={() => setShowPersonalization((current) => !current)}
          className="pressable mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"
        >
          {showPersonalization ? 'Hide Greeting Editor' : 'Edit My Greeting Settings'}
        </button>

        {showPersonalization && (
          <div className="mt-3 space-y-2 rounded-2xl border border-violet-100 bg-white/70 p-3">
            <input
              value={profileForm.displayName}
              onChange={(event) => updateField('displayName', event.target.value)}
              placeholder="Your name (shown to partner)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
            <input
              value={profileForm.partnerName}
              onChange={(event) => updateField('partnerName', event.target.value)}
              placeholder="How you call your partner (ex: Babe)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
            <textarea
              value={profileForm.greetingTemplate}
              onChange={(event) => updateField('greetingTemplate', event.target.value)}
              rows={2}
              placeholder="Custom greeting (ex: {greeting}, {name} \u{1F49C})"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
            <textarea
              value={profileForm.missMeMessage}
              onChange={(event) => updateField('missMeMessage', event.target.value)}
              rows={2}
              placeholder="Open when you miss me message"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
            <textarea
              value={profileForm.loadingTitleForPartner}
              onChange={(event) => updateField('loadingTitleForPartner', event.target.value)}
              rows={1}
              placeholder="Loading title your partner will see (opposite only)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
            <textarea
              value={profileForm.loadingCaptionForPartner}
              onChange={(event) => updateField('loadingCaptionForPartner', event.target.value)}
              rows={2}
              placeholder="Loading caption your partner will see (opposite only)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
            />
            <p className="text-[11px] text-slate-500">Preview for partner: {outgoingPreview}</p>
            <p className="text-[11px] text-slate-500">
              Loading title preview for partner: {profileForm.loadingTitleForPartner || 'UsVault'}
            </p>
            <p className="text-[11px] text-slate-500">
              Loading preview for partner:{' '}
              {profileForm.loadingCaptionForPartner || 'Loading your private space...'}
            </p>
            <PrimaryButton
              type="button"
              disabled={savingProfile}
              className="w-full"
              onClick={savePersonalization}
            >
              {savingProfile ? 'Saving...' : 'Save Personalization'}
            </PrimaryButton>
            {profileSaved && <p className="text-xs font-semibold text-emerald-700">{profileSaved}</p>}
            {profileError && <p className="text-xs font-semibold text-rose-700">{profileError}</p>}
          </div>
        )}
      </SoftCard>

      <SoftCard title="Partner Mapping">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Your code</p>
        <p className="mt-1 text-sm font-semibold text-violet-700">{myProfile?.partnerCode || 'Loading...'}</p>
        <p className="mt-2 text-xs text-slate-600">
          {myProfile?.partnerUid
            ? `Linked with ${partnerLabel}.`
            : 'Open Profile tab and enter your partner code to link permanently.'}
        </p>
      </SoftCard>

      <SoftCard title="Today's Memory" subtitle={formatReadableDate(todayEntry?.date)}>
        {todayLoading ? (
          <p className="text-sm text-slate-500">Loading today&apos;s memory...</p>
        ) : (
          <>
            {todayEntry?.sourceTag && (
              <p className="mb-2 inline-flex rounded-full border border-violet-200 bg-violet-50/80 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                {todayEntry.sourceTag}
              </p>
            )}
            <p className="min-h-12 text-sm leading-relaxed text-slate-600">
              {todayEntry?.text || 'Start your first memory \u{1F49C}'}
            </p>
            <p className="mt-2 text-xs italic text-violet-600">{todayCaption}</p>
            {moodPrompt && <p className="mt-1 text-xs text-violet-700">{moodPrompt}</p>}

            {todayEntry?.imageUrl && (
              <SmartImage
                src={todayEntry.imageUrl}
                alt="Today memory"
                containerClassName="mt-3 rounded-2xl"
                className="h-44 w-full rounded-2xl object-cover shadow-sm"
              />
            )}
          </>
        )}
      </SoftCard>

      {onThisDayEntry && (
        <SoftCard title="On This Day" subtitle={formatReadableDate(onThisDayEntry.date)}>
          {onThisDayEntry.sourceTag && (
            <p className="mb-2 inline-flex rounded-full border border-violet-200 bg-violet-50/80 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              {onThisDayEntry.sourceTag}
            </p>
          )}
          <p className="text-sm text-slate-600">{onThisDayEntry.text || 'A memory from this date.'}</p>
          <p className="mt-2 text-xs italic text-violet-600">{getEmotionalCaption(onThisDayEntry)}</p>
          {onThisDayEntry.imageUrl && (
            <SmartImage
              src={onThisDayEntry.imageUrl}
              alt="On this day memory"
              containerClassName="mt-3 rounded-2xl"
              className="h-36 w-full rounded-2xl object-cover"
            />
          )}
        </SoftCard>
      )}

      <SoftCard title="Status">
        {statusLoading ? (
          <p className="text-sm text-slate-500">Loading statuses...</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50/90 px-3 py-2 transition-colors duration-300">
              <p className="text-sm text-slate-600">You</p>
              <StatusBadge status={myStatus} />
            </div>
            <div className="rounded-2xl bg-slate-50/90 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="truncate pr-3 text-sm text-slate-600">{partnerLabel}</p>
                <StatusBadge status={partnerStatus} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{formatLastSeen(partnerLastSeen)}</p>
              <p className="mt-2 text-xs text-violet-700">{statusPrompt}</p>
            </div>
          </div>
        )}
      </SoftCard>

      <SoftCard title="Open When You Miss Me">
        <p className="text-sm text-slate-600">A tiny comfort button for moments you miss each other.</p>
        <PrimaryButton type="button" className="mt-3 w-full" onClick={openMissMe}>
          Open
        </PrimaryButton>
      </SoftCard>

      <SoftModal open={missMeOpen} onClose={() => setMissMeOpen(false)} title="Open When You Miss Me">
        {missMeItem?.type === 'memory' && missMeItem.value && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
              {formatReadableDate(missMeItem.value.date)}
            </p>
            <p className="text-sm text-slate-600">{missMeItem.value.text || 'A soft memory for you.'}</p>
            <p className="text-xs italic text-violet-600">{getEmotionalCaption(missMeItem.value)}</p>
            {missMeItem.value.imageUrl && (
              <SmartImage
                src={missMeItem.value.imageUrl}
                alt="Miss me memory"
                containerClassName="rounded-2xl"
                className="h-40 w-full rounded-2xl object-cover"
              />
            )}
          </div>
        )}

        {missMeItem?.type === 'message' && (
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-rose-50 p-3">
            <p className="text-sm leading-relaxed text-slate-700">{missMeItem.value}</p>
          </div>
        )}
      </SoftModal>
    </section>
  )
}

export default DashboardPage
