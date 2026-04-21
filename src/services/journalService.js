import {
  arrayRemove,
  arrayUnion,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { formatDateKey } from '../utils/date'

function entryRef(uid, dateKey = formatDateKey(new Date())) {
  return doc(db, 'users', uid, 'entries', dateKey)
}

function entriesCollection(uid) {
  return collection(db, 'users', uid, 'entries')
}

function notificationsCollection(uid) {
  return collection(db, 'users', uid, 'notifications')
}

function userControlRef(uid) {
  return doc(db, 'user_controls', uid)
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function deriveDisplayName(email = '') {
  const local = email.split('@')[0] || 'You'
  const cleaned = local.replace(/[^a-zA-Z0-9]/g, ' ').trim()
  if (!cleaned) {
    return 'You'
  }
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizePartnerCode(rawCode = '') {
  return String(rawCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
}

function createPartnerCode(uid = '') {
  const clean = String(uid || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const first = clean.slice(0, 6).padEnd(6, 'X')
  const last = clean.slice(-6).padStart(6, 'X')
  return `UV-${first}${last}`
}

function toSafeString(value = '') {
  return String(value || '').trim()
}

function normalizeAccessControl(data = {}) {
  return {
    uid: String(data.uid || ''),
    email: String(data.email || '').trim().toLowerCase(),
    canUseApp: data.canUseApp !== false,
    banned: data.banned === true,
    bannedReason: String(data.bannedReason || '').trim(),
    bannedAt: data.bannedAt || null,
    bannedByUid: String(data.bannedByUid || ''),
    bannedByEmail: String(data.bannedByEmail || '').trim().toLowerCase(),
    updatedAt: data.updatedAt || null,
  }
}

export function isUserBlocked(accessControl = null) {
  if (!accessControl) {
    return false
  }
  return accessControl.banned === true || accessControl.canUseApp === false
}

export function getBlockedMessage(accessControl = null) {
  if (!accessControl) {
    return 'Your account does not have access to this app.'
  }

  const reason = String(accessControl.bannedReason || '').trim()
  if (reason) {
    return `Access restricted by admin: ${reason}`
  }
  return 'Your account access has been restricted by admin.'
}

export async function saveDailyEntry(uid, dateKey, payload) {
  const nextText = String(payload?.text || '')
  const nextImage = String(payload?.image || payload?.imageUrl || '')

  await setDoc(
    entryRef(uid, dateKey),
    {
      ...payload,
      id: String(payload?.id || dateKey),
      text: nextText,
      image: nextImage,
      imageUrl: String(payload?.imageUrl || nextImage),
      date: dateKey,
      monthDay: dateKey.slice(5),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeEntryByDate(uid, dateKey, callback, onError) {
  return onSnapshot(
    entryRef(uid, dateKey),
    (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null)
    },
    (error) => {
      onError?.(error)
    },
  )
}

export function subscribeUserEntries(uid, callback, maxItems = 31, onError) {
  const entriesQuery = query(entriesCollection(uid), orderBy('date', 'desc'), limit(maxItems))

  return onSnapshot(
    entriesQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => item.data()))
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function uploadEntryImage(uid, dateKey, file, previousPath = '') {
  const safeFileName = sanitizeFileName(file.name)
  const filePath = `journal/${uid}/${dateKey}-${Date.now()}-${safeFileName}`
  const imageRef = ref(storage, filePath)

  if (previousPath) {
    await deleteObject(ref(storage, previousPath)).catch(() => {})
  }

  await uploadBytes(imageRef, file)
  const imageUrl = await getDownloadURL(imageRef)

  return { imageUrl, imagePath: filePath }
}

export async function deleteDailyEntry(uid, dateKey, imagePath = '') {
  if (imagePath) {
    await deleteObject(ref(storage, imagePath)).catch(() => {})
  }

  await deleteDoc(entryRef(uid, dateKey))
}

export async function updateUserMood(uid, mood) {
  const dateKey = formatDateKey(new Date())
  await saveDailyEntry(uid, dateKey, { mood, moodTimestamp: Date.now() })
}

export async function updateUserStatus(uid, email, status) {
  await setDoc(
    doc(db, 'statuses', uid),
    {
      uid,
      email,
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function ensureStatusDocument(uid, email) {
  const statusRef = doc(db, 'statuses', uid)
  const statusSnapshot = await getDoc(statusRef)
  const defaultProfile = {
    uid,
    email,
    status: 'Free',
    displayName: deriveDisplayName(email),
    partnerName: 'Love',
    greetingTemplate: '',
    missMeMessage: '',
    gossipEntries: [],
    partnerCode: createPartnerCode(uid),
    partnerUid: '',
    photoURL: '',
    photoPath: '',
    onboardingDone: false,
    loadingTitleForPartner: '',
    loadingCaptionForPartner: '',
    updatedAt: serverTimestamp(),
  }

  if (!statusSnapshot.exists()) {
    await setDoc(statusRef, defaultProfile)
    return
  }

  const data = statusSnapshot.data()
  const patch = {}

  if (!data?.displayName) {
    patch.displayName = deriveDisplayName(email)
  }
  if (!data?.partnerName) {
    patch.partnerName = 'Love'
  }
  if (typeof data?.greetingTemplate !== 'string') {
    patch.greetingTemplate = ''
  }
  if (typeof data?.missMeMessage !== 'string') {
    patch.missMeMessage = ''
  }
  if (!Array.isArray(data?.gossipEntries)) {
    patch.gossipEntries = []
  }
  if (typeof data?.partnerCode !== 'string' || !normalizePartnerCode(data.partnerCode)) {
    patch.partnerCode = createPartnerCode(uid)
  }
  if (typeof data?.partnerUid !== 'string') {
    patch.partnerUid = ''
  }
  if (typeof data?.photoURL !== 'string') {
    patch.photoURL = ''
  }
  if (typeof data?.photoPath !== 'string') {
    patch.photoPath = ''
  }
  if (typeof data?.onboardingDone !== 'boolean') {
    patch.onboardingDone = false
  }
  if (typeof data?.loadingTitleForPartner !== 'string') {
    patch.loadingTitleForPartner = ''
  }
  if (typeof data?.loadingCaptionForPartner !== 'string') {
    patch.loadingCaptionForPartner = ''
  }

  if (Object.keys(patch).length > 0) {
    await setDoc(statusRef, patch, { merge: true })
  }
}

export async function ensureUserAccessControl(uid, email) {
  const controlDocumentRef = userControlRef(uid)
  const snapshot = await getDoc(controlDocumentRef)

  if (!snapshot.exists()) {
    const initialData = {
      uid,
      email: String(email || '').trim().toLowerCase(),
      canUseApp: true,
      banned: false,
      bannedReason: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(controlDocumentRef, initialData, { merge: false })
    return normalizeAccessControl(initialData)
  }

  return normalizeAccessControl(snapshot.data())
}

export async function savePushToken(uid, token, userAgent = '') {
  const normalizedUid = toSafeString(uid)
  const normalizedToken = toSafeString(token)
  if (!normalizedUid || !normalizedToken) {
    return
  }

  await setDoc(
    doc(db, 'push_tokens', normalizedUid),
    {
      uid: normalizedUid,
      tokens: arrayUnion(normalizedToken),
      userAgent: toSafeString(userAgent).slice(0, 240),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removePushToken(uid, token) {
  const normalizedUid = toSafeString(uid)
  const normalizedToken = toSafeString(token)
  if (!normalizedUid || !normalizedToken) {
    return
  }

  await setDoc(
    doc(db, 'push_tokens', normalizedUid),
    {
      uid: normalizedUid,
      tokens: arrayRemove(normalizedToken),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function getUserAccessControl(uid) {
  const snapshot = await getDoc(userControlRef(uid))
  return snapshot.exists() ? normalizeAccessControl(snapshot.data()) : null
}

export function subscribeUserAccessControl(uid, callback, onError) {
  return onSnapshot(
    userControlRef(uid),
    (snapshot) => {
      callback(snapshot.exists() ? normalizeAccessControl(snapshot.data()) : null)
    },
    (error) => {
      onError?.(error)
    },
  )
}

export function subscribeAllUsersForAdmin(callback, onError) {
  return onSnapshot(
    collection(db, 'statuses'),
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })),
      )
    },
    (error) => {
      onError?.(error)
    },
  )
}

export function subscribeAllUserControlsForAdmin(callback, onError) {
  return onSnapshot(
    collection(db, 'user_controls'),
    (snapshot) => {
      const map = {}
      snapshot.docs.forEach((item) => {
        map[item.id] = normalizeAccessControl(item.data())
      })
      callback(map)
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function setUserAccessByAdmin(adminUser, targetUser, updates = {}) {
  const targetUid = String(targetUser?.uid || '')
  const targetEmail = String(targetUser?.email || '').trim().toLowerCase()
  const bannedReason = String(updates.bannedReason || '').trim()
  const banned = updates.banned === true
  const canUseApp = updates.canUseApp !== false

  if (!targetUid) {
    throw new Error('missing-target')
  }

  await setDoc(
    userControlRef(targetUid),
    {
      uid: targetUid,
      email: targetEmail,
      banned,
      canUseApp,
      bannedReason: banned ? bannedReason : '',
      bannedAt: banned ? serverTimestamp() : null,
      bannedByUid: banned ? String(adminUser?.uid || '') : '',
      bannedByEmail: banned ? String(adminUser?.email || '').trim().toLowerCase() : '',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function deleteUserDataByAdmin(adminUser, targetUser) {
  const targetUid = String(targetUser?.uid || '')
  const targetEmail = String(targetUser?.email || '').trim().toLowerCase()

  if (!targetUid) {
    throw new Error('missing-target')
  }

  const entriesSnapshot = await getDocs(collection(db, 'users', targetUid, 'entries'))
  for (const item of entriesSnapshot.docs) {
    await deleteDoc(item.ref)
  }

  const notificationsSnapshot = await getDocs(collection(db, 'users', targetUid, 'notifications'))
  for (const item of notificationsSnapshot.docs) {
    await deleteDoc(item.ref)
  }

  await deleteDoc(doc(db, 'statuses', targetUid)).catch(() => {})

  await setDoc(
    userControlRef(targetUid),
    {
      uid: targetUid,
      email: targetEmail,
      banned: true,
      canUseApp: false,
      bannedReason: 'Account removed by admin',
      bannedAt: serverTimestamp(),
      bannedByUid: String(adminUser?.uid || ''),
      bannedByEmail: String(adminUser?.email || '').trim().toLowerCase(),
      deletedByAdmin: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeStatusMap(callback, onError) {
  return onSnapshot(
    collection(db, 'statuses'),
    (snapshot) => {
      const map = {}

      for (const item of snapshot.docs) {
        map[item.id] = item.data()
      }

      callback(map)
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function updateUserPersonalization(uid, email, payload) {
  await setDoc(
    doc(db, 'statuses', uid),
    {
      uid,
      email,
      displayName: (payload.displayName || '').trim(),
      partnerName: (payload.partnerName || '').trim(),
      greetingTemplate: (payload.greetingTemplate || '').trim(),
      missMeMessage: (payload.missMeMessage || '').trim(),
      loadingTitleForPartner: (payload.loadingTitleForPartner || '').trim(),
      loadingCaptionForPartner: (payload.loadingCaptionForPartner || '').trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function updateUserGossipEntries(uid, email, entries) {
  const sanitized = (Array.isArray(entries) ? entries : [])
    .slice(0, 40)
    .map((item) => ({
      id: String(item.id || ''),
      tag: String(item.tag || '').slice(0, 24),
      text: String(item.text || '').slice(0, 280),
      createdAt: Number(item.createdAt || Date.now()),
    }))

  await setDoc(
    doc(db, 'statuses', uid),
    {
      uid,
      email,
      gossipEntries: sanitized,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function saveInAppNotification(uid, payload = {}) {
  const title = toSafeString(payload.title)
  const body = toSafeString(payload.body)
  const type = toSafeString(payload.type || 'info')
  const originUid = toSafeString(payload.originUid)
  const originEmail = toSafeString(payload.originEmail).toLowerCase()
  const source = toSafeString(payload.source)

  if (!title && !body) {
    return
  }

  await addDoc(notificationsCollection(uid), {
    title: title || 'UsVault',
    body: body || '',
    type: type || 'info',
    originUid,
    originEmail,
    source,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export async function notifyLinkedPartner(uid, payload = {}) {
  const sourceUid = toSafeString(uid)
  if (!sourceUid) {
    return false
  }

  try {
    const sourceStatusSnapshot = await getDoc(doc(db, 'statuses', sourceUid))
    if (!sourceStatusSnapshot.exists()) {
      return false
    }

    const sourceStatus = sourceStatusSnapshot.data()
    const partnerUid = toSafeString(sourceStatus?.partnerUid)

    if (!partnerUid || partnerUid === sourceUid) {
      return false
    }

    await saveInAppNotification(partnerUid, {
      title: payload.title || 'UsVault',
      body: payload.body || '',
      type: payload.type || 'info',
      source: payload.source || '',
      originUid: sourceUid,
      originEmail: sourceStatus?.email || '',
    })

    return true
  } catch {
    return false
  }
}

export function subscribeUserNotifications(uid, callback, maxItems = 60, onError) {
  const listQuery = query(notificationsCollection(uid), orderBy('createdAt', 'desc'), limit(maxItems))

  return onSnapshot(
    listQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })),
      )
    },
    (error) => {
      onError?.(error)
    },
  )
}

export async function markAllNotificationsRead(uid) {
  const unreadQuery = query(notificationsCollection(uid), where('read', '==', false), limit(100))
  const unreadSnapshot = await getDocs(unreadQuery)

  if (unreadSnapshot.empty) {
    return
  }

  const batch = writeBatch(db)
  unreadSnapshot.docs.forEach((item) => {
    batch.set(item.ref, { read: true }, { merge: true })
  })
  await batch.commit()
}

export async function deleteUserNotification(uid, notificationId) {
  if (!notificationId) {
    return
  }
  await deleteDoc(doc(db, 'users', uid, 'notifications', notificationId))
}

export async function deleteAllUserNotifications(uid) {
  const normalizedUid = toSafeString(uid)
  if (!normalizedUid) {
    return
  }

  const maxBatchSize = 400

  while (true) {
    const listQuery = query(notificationsCollection(normalizedUid), limit(maxBatchSize))
    const snapshot = await getDocs(listQuery)
    if (snapshot.empty) {
      break
    }

    const batch = writeBatch(db)
    snapshot.docs.forEach((item) => {
      batch.delete(item.ref)
    })
    await batch.commit()

    if (snapshot.size < maxBatchSize) {
      break
    }
  }
}

export async function saveUserProfile(uid, email, profilePayload = {}) {
  const statusRef = doc(db, 'statuses', uid)
  const displayName = String(profilePayload.displayName || '').trim()
  const partnerName = String(profilePayload.partnerName || '').trim()
  const photoFile = profilePayload.photoFile || null

  let photoURL = ''
  let photoPath = ''

  if (photoFile) {
    const safeFileName = sanitizeFileName(photoFile.name || 'avatar.jpg')
    photoPath = `profiles/${uid}/avatar-${Date.now()}-${safeFileName}`
    const avatarRef = ref(storage, photoPath)
    await uploadBytes(avatarRef, photoFile)
    photoURL = await getDownloadURL(avatarRef)
  }

  await setDoc(
    statusRef,
    {
      uid,
      email,
      displayName,
      partnerName,
      partnerCode: createPartnerCode(uid),
      photoURL,
      photoPath,
      onboardingDone: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return { displayName, photoURL, photoPath }
}

export async function updateUserProfileDetails(uid, email, payload = {}) {
  const statusRef = doc(db, 'statuses', uid)
  const displayName = String(payload.displayName || '').trim()
  const partnerName = String(payload.partnerName || '').trim()
  const photoFile = payload.photoFile || null
  const previousPhotoPath = String(payload.previousPhotoPath || '')

  const patch = {
    uid,
    email,
    displayName,
    partnerName,
    updatedAt: serverTimestamp(),
  }

  if (photoFile) {
    const safeFileName = sanitizeFileName(photoFile.name || 'avatar.jpg')
    const photoPath = `profiles/${uid}/avatar-${Date.now()}-${safeFileName}`
    const avatarRef = ref(storage, photoPath)

    await uploadBytes(avatarRef, photoFile)
    const photoURL = await getDownloadURL(avatarRef)

    patch.photoURL = photoURL
    patch.photoPath = photoPath

    if (previousPhotoPath) {
      await deleteObject(ref(storage, previousPhotoPath)).catch(() => {})
    }
  }

  await setDoc(statusRef, patch, { merge: true })
}

export async function linkPartnerByCode(uid, email, partnerCode) {
  const normalizedCode = normalizePartnerCode(partnerCode)
  if (!normalizedCode) {
    throw new Error('invalid-code')
  }

  const myRef = doc(db, 'statuses', uid)
  const mySnapshot = await getDoc(myRef)
  if (!mySnapshot.exists()) {
    throw new Error('profile-missing')
  }

  const myData = mySnapshot.data()
  const myExistingPartnerUid = String(myData?.partnerUid || '')

  const partnerQuery = query(
    collection(db, 'statuses'),
    where('partnerCode', '==', normalizedCode),
    limit(1),
  )
  const partnerSnapshot = await getDocs(partnerQuery)
  if (partnerSnapshot.empty) {
    throw new Error('code-not-found')
  }

  const partnerDoc = partnerSnapshot.docs[0]
  const partnerUid = partnerDoc.id
  const partnerData = partnerDoc.data()
  const partnerExistingUid = String(partnerData?.partnerUid || '')

  if (partnerUid === uid) {
    throw new Error('self-link')
  }
  if (myExistingPartnerUid && myExistingPartnerUid !== partnerUid) {
    throw new Error('already-linked')
  }
  if (partnerExistingUid && partnerExistingUid !== uid) {
    throw new Error('partner-already-linked')
  }

  const batch = writeBatch(db)
  batch.set(
    myRef,
    {
      uid,
      email,
      partnerUid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  batch.set(
    partnerDoc.ref,
    {
      uid: partnerUid,
      email: partnerData?.email || '',
      partnerUid: uid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  await batch.commit()

  return {
    partnerUid,
    partnerLabel: partnerData?.displayName || partnerData?.email || 'Partner',
  }
}

export { formatDateKey }
