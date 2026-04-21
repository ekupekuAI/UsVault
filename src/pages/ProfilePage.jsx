import { useEffect, useState } from 'react'
import PrimaryButton from '../components/ui/PrimaryButton'
import SoftCard from '../components/ui/SoftCard'
import { useAuth } from '../context/AuthContext'
import { useSound } from '../context/SoundContext'
import { linkPartnerByCode, updateUserProfileDetails } from '../services/journalService'

function mapLinkError(error) {
  const code = error?.message || ''
  if (code === 'invalid-code') {
    return 'Please enter a valid partner code.'
  }
  if (code === 'code-not-found') {
    return 'Partner code not found.'
  }
  if (code === 'self-link') {
    return 'You cannot link with your own code.'
  }
  if (code === 'already-linked') {
    return 'Your account is already linked permanently.'
  }
  if (code === 'partner-already-linked') {
    return 'This code already belongs to a linked account.'
  }
  return 'Could not link partner. Try again.'
}

function ProfilePage({ user, myProfile, partnerStatusData }) {
  const { playSuccess } = useSound()
  const { logout } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [partnerName, setPartnerName] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkMessage, setLinkMessage] = useState('')
  const [linkError, setLinkError] = useState('')

  const myCode = myProfile?.partnerCode || ''
  const isPermanentlyLinked = Boolean(myProfile?.partnerUid)

  useEffect(() => {
    setDisplayName(myProfile?.displayName || '')
    setPartnerName(myProfile?.partnerName || '')
    setPhotoPreview(myProfile?.photoURL || '')
  }, [myProfile?.displayName, myProfile?.partnerName, myProfile?.photoURL])

  useEffect(() => {
    if (!photoFile) {
      return undefined
    }

    const objectUrl = URL.createObjectURL(photoFile)
    setPhotoPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [photoFile])

  async function saveProfile() {
    setSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      await updateUserProfileDetails(user.uid, user.email, {
        displayName,
        partnerName,
        photoFile,
        previousPhotoPath: myProfile?.photoPath || '',
      })
      setPhotoFile(null)
      setSaveMessage('Profile updated.')
      playSuccess()
    } catch {
      setSaveError('Could not save profile. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function linkPartner() {
    setLinking(true)
    setLinkError('')
    setLinkMessage('')

    try {
      const result = await linkPartnerByCode(user.uid, user.email, partnerCodeInput)
      setPartnerCodeInput('')
      setLinkMessage(`Linked permanently with ${result.partnerLabel}.`)
      playSuccess()
    } catch (error) {
      setLinkError(mapLinkError(error))
    } finally {
      setLinking(false)
    }
  }

  async function copyMyCode() {
    if (!myCode || !navigator.clipboard) {
      return
    }
    await navigator.clipboard.writeText(myCode).catch(() => {})
  }

  return (
    <section className="space-y-3">
      <SoftCard title="My Profile">
        <div className="space-y-3">
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          />
          <input
            value={partnerName}
            onChange={(event) => setPartnerName(event.target.value)}
            placeholder="How you call your partner"
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          />
          <label className="block rounded-2xl border border-dashed border-violet-200 bg-white/70 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-violet-500">
            Profile Photo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
              className="mt-2 block w-full text-xs normal-case tracking-normal text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:font-semibold file:text-violet-700"
            />
          </label>

          {photoPreview && (
            <img
              src={photoPreview}
              alt="Profile"
              className="h-20 w-20 rounded-full border border-violet-200 object-cover"
            />
          )}

          <PrimaryButton type="button" onClick={saveProfile} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Profile'}
          </PrimaryButton>
          <button
            type="button"
            onClick={logout}
            className="pressable w-full rounded-2xl border border-violet-200 bg-white/85 px-3 py-2.5 text-sm font-semibold text-violet-700"
          >
            Logout
          </button>

          {saveMessage && <p className="text-xs font-semibold text-emerald-700">{saveMessage}</p>}
          {saveError && <p className="text-xs font-semibold text-rose-700">{saveError}</p>}
        </div>
      </SoftCard>

      <SoftCard title="Partner Link">
        <div className="space-y-3">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/70 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-500">Your code</p>
            <p className="mt-1 text-sm font-semibold text-violet-700">{myCode || 'Loading...'}</p>
            <button
              type="button"
              onClick={copyMyCode}
              className="pressable mt-2 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-semibold text-violet-700"
            >
              Copy Code
            </button>
          </div>

          {isPermanentlyLinked ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-sm font-semibold text-emerald-700">
                Linked permanently with {partnerStatusData?.label || 'your partner'}.
              </p>
            </div>
          ) : (
            <>
              <input
                value={partnerCodeInput}
                onChange={(event) => setPartnerCodeInput(event.target.value.toUpperCase())}
                placeholder="Enter partner code"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
              />
              <PrimaryButton
                type="button"
                onClick={linkPartner}
                disabled={linking || !partnerCodeInput.trim()}
                className="w-full"
              >
                {linking ? 'Linking...' : 'Link Partner Permanently'}
              </PrimaryButton>
            </>
          )}

          {linkMessage && <p className="text-xs font-semibold text-emerald-700">{linkMessage}</p>}
          {linkError && <p className="text-xs font-semibold text-rose-700">{linkError}</p>}
        </div>
      </SoftCard>
    </section>
  )
}

export default ProfilePage
