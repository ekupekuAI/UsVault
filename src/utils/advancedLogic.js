const CAPSULES_KEY = 'usvault_message_capsules_v1'
const LAST_ACTIVE_KEY = 'usvault_last_active_at'
const UNDO_WINDOW_MS = 5000

let lastDeletedState = null

function toDate(value) {
  if (!value) {
    return null
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate()
    return Number.isNaN(parsed?.getTime?.()) ? null : parsed
  }
  if (typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (typeof value === 'string') {
    const normalized = value.length === 10 ? `${value}T00:00:00` : value
    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

function toDateKey(value) {
  const date = toDate(value)
  if (!date) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toMonthDay(value) {
  const dateKey = toDateKey(value)
  return dateKey ? dateKey.slice(5) : ''
}

function safeStorageGet(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallbackValue
    }
    const parsed = JSON.parse(raw)
    return parsed ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // no-op for private mode quota limits
  }
}

function normalizeMemory(entry = {}) {
  const date = toDateKey(entry.date || entry.timestamp || entry.createdAt || Date.now())
  return {
    id: String(entry.id || date || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    text: String(entry.text || ''),
    image: String(entry.image || entry.imageUrl || ''),
    date,
  }
}

function normalizeMood(item = {}) {
  if (typeof item === 'string') {
    return { value: item, timestamp: Date.now() }
  }
  return {
    value: String(item.value || item.mood || ''),
    timestamp:
      toDate(item.timestamp || item.moodTimestamp || item.updatedAt || item.date)?.getTime?.() ||
      Date.now(),
  }
}

function normalizeCapsule(item = {}) {
  const unlockDate = toDateKey(item.unlockDate)
  const unlocked = Boolean(item.unlocked) || (unlockDate ? Date.now() >= toDate(unlockDate).getTime() : false)
  return {
    id: String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
    message: String(item.message || '').trim(),
    unlockDate,
    unlocked,
    createdAt:
      toDate(item.createdAt || Date.now())?.getTime?.() || Date.now(),
  }
}

function readCapsules() {
  const list = safeStorageGet(CAPSULES_KEY, [])
  if (!Array.isArray(list)) {
    return []
  }
  return list.map((item) => normalizeCapsule(item)).filter((item) => item.message && item.unlockDate)
}

function writeCapsules(capsules) {
  safeStorageSet(CAPSULES_KEY, capsules.map((item) => normalizeCapsule(item)))
}

function syncCapsulesByDate() {
  const now = Date.now()
  const capsules = readCapsules()
  let changed = false
  const synced = capsules.map((item) => {
    const unlockMs = toDate(item.unlockDate)?.getTime() || 0
    const nextUnlocked = unlockMs > 0 && now >= unlockMs
    if (nextUnlocked !== item.unlocked) {
      changed = true
      return { ...item, unlocked: nextUnlocked }
    }
    return item
  })
  if (changed) {
    writeCapsules(synced)
  }
  return synced
}

export function getOnThisDay(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const targetMonthDay = toMonthDay(now)
  if (!targetMonthDay) {
    return null
  }

  const candidates = entries
    .map((entry) => ({ entry, dateKey: toDateKey(entry?.date) }))
    .filter(({ dateKey }) => Boolean(dateKey) && dateKey.slice(5) === targetMonthDay)
    .filter(({ dateKey }) => Number(dateKey.slice(0, 4)) < currentYear)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))

  return candidates[0]?.entry || null
}

export function getWeeklyMoodData(moods = []) {
  const source = Array.isArray(moods) ? moods : []
  const byDate = new Map()

  source.forEach((item) => {
    const mood = normalizeMood(item)
    if (!mood.value) {
      return
    }
    const dateKey = toDateKey(mood.timestamp || item?.date)
    if (!dateKey) {
      return
    }
    const existing = byDate.get(dateKey)
    if (!existing || mood.timestamp >= existing.timestamp) {
      byDate.set(dateKey, mood)
    }
  })

  const days = []
  const cursor = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(cursor)
    day.setDate(cursor.getDate() - i)
    const dateKey = toDateKey(day)
    days.push({
      date: dateKey,
      mood: byDate.get(dateKey)?.value || '',
    })
  }

  return days
}

export function createCapsule(message, unlockDate) {
  const capsule = normalizeCapsule({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    unlockDate,
    unlocked: false,
    createdAt: Date.now(),
  })

  if (!capsule.message || !capsule.unlockDate) {
    throw new Error('invalid-capsule')
  }

  const capsules = readCapsules()
  const next = [capsule, ...capsules]
  writeCapsules(next)
  return capsule
}

export function getUnlockedCapsules() {
  return syncCapsulesByDate().filter((item) => item.unlocked)
}

export function getLockedCapsules() {
  return syncCapsulesByDate().filter((item) => !item.unlocked)
}

export function getSmartNudge({ lastMemory, lastMood, lastActive } = {}) {
  const now = new Date()
  const todayKey = toDateKey(now)
  const memoryDateKey = toDateKey(lastMemory?.date || lastMemory)

  if (!memoryDateKey || memoryDateKey !== todayKey) {
    return 'Tell me about your day \u{1F4AD}'
  }

  const moodValue = String(lastMood?.value || lastMood?.mood || lastMood || '')
  const negativeMoodSet = new Set(['\u{1F614}', '\u{1F621}', 'Low', 'Stressed', 'Sad', 'Angry'])
  if (negativeMoodSet.has(moodValue)) {
    return 'Hope tomorrow feels lighter \u{1F49C}'
  }

  const lastActiveDate = toDate(lastActive)
  if (lastActiveDate && Date.now() - lastActiveDate.getTime() > 24 * 60 * 60 * 1000) {
    return 'It\u2019s been a while\u2026 add something today \u{1F49C}'
  }

  return ''
}

export function getHighlights(memories = []) {
  const list = Array.isArray(memories) ? memories : []
  if (list.length === 0) {
    return {
      mostActiveDay: null,
      longestEntry: null,
      totalMemories: 0,
    }
  }

  const dayCounts = new Map()
  let longestEntry = null
  let longestLength = -1

  list.forEach((item) => {
    const memory = normalizeMemory(item)
    const dayName = toDate(memory.date)?.toLocaleDateString(undefined, { weekday: 'long' }) || 'Unknown'
    dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1)

    const length = memory.text.length
    if (length > longestLength) {
      longestLength = length
      longestEntry = item
    }
  })

  const mostActiveDay =
    [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return {
    mostActiveDay,
    longestEntry,
    totalMemories: list.length,
  }
}

export function updateLastActive(timestamp = Date.now()) {
  const next = toDate(timestamp)?.getTime?.() || Date.now()
  localStorage.setItem(LAST_ACTIVE_KEY, String(next))
  return next
}

export function getLastActive() {
  const raw = localStorage.getItem(LAST_ACTIVE_KEY)
  const parsed = Number(raw || 0)
  if (!parsed || Number.isNaN(parsed)) {
    return null
  }
  return parsed
}

export function deleteWithUndo(item) {
  if (!item) {
    return null
  }
  lastDeletedState = {
    item,
    expiresAt: Date.now() + UNDO_WINDOW_MS,
  }
  return lastDeletedState
}

export function restoreLastDeleted() {
  if (!lastDeletedState) {
    return null
  }
  if (Date.now() > lastDeletedState.expiresAt) {
    lastDeletedState = null
    return null
  }
  const payload = lastDeletedState.item
  lastDeletedState = null
  return payload
}

export function clearLastDeleted() {
  lastDeletedState = null
}
