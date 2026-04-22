import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearLastDeleted,
  createCapsule,
  deleteWithUndo,
  getHighlights,
  getLastActive,
  getLockedCapsules,
  getOnThisDay,
  getSmartNudge,
  getUnlockedCapsules,
  getWeeklyMoodData,
  restoreLastDeleted,
  updateLastActive,
} from './advancedLogic'

const storage = new Map()

function installLocalStorageMock() {
  globalThis.localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null
    },
    setItem(key, value) {
      storage.set(key, String(value))
    },
    removeItem(key) {
      storage.delete(key)
    },
    clear() {
      storage.clear()
    },
  }
}

describe('advancedLogic', () => {
  beforeEach(() => {
    installLocalStorageMock()
    storage.clear()
    clearLastDeleted()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-22T12:00:00'))
  })

  it('returns latest matching past-year memory for on-this-day', () => {
    const entries = [
      { date: '2026-04-22', text: 'today' },
      { date: '2024-04-22', text: 'older' },
      { date: '2025-04-22', text: 'latest past' },
      { date: '2025-04-21', text: 'wrong day' },
    ]

    expect(getOnThisDay(entries)).toEqual({ date: '2025-04-22', text: 'latest past' })
  })

  it('builds 7-day mood timeline from latest values per day', () => {
    const moods = [
      { mood: '\u{1F60C}', moodTimestamp: new Date('2026-04-21T08:00:00').getTime() },
      { mood: '\u{1F60A}', moodTimestamp: new Date('2026-04-21T20:00:00').getTime() },
      { mood: '\u{1F60D}', moodTimestamp: new Date('2026-04-22T09:00:00').getTime() },
    ]

    const result = getWeeklyMoodData(moods)
    expect(result).toHaveLength(7)
    expect(result[result.length - 2]).toEqual({ date: '2026-04-21', mood: '\u{1F60A}' })
    expect(result[result.length - 1]).toEqual({ date: '2026-04-22', mood: '\u{1F60D}' })
  })

  it('creates capsules and separates locked/unlocked by unlock date', () => {
    createCapsule('Future letter', '2026-04-24')
    createCapsule('Today letter', '2026-04-22')

    const unlocked = getUnlockedCapsules()
    const locked = getLockedCapsules()

    expect(unlocked.map((item) => item.message)).toContain('Today letter')
    expect(locked.map((item) => item.message)).toContain('Future letter')
  })

  it('returns smart nudge by memory/mood/inactivity rules', () => {
    const noMemory = getSmartNudge({
      lastMemory: { date: '2026-04-21' },
      lastMood: '\u{1F60A}',
      lastActive: new Date('2026-04-22T10:00:00').getTime(),
    })
    expect(noMemory).toBe('Tell me about your day \u{1F4AD}')

    const negativeMood = getSmartNudge({
      lastMemory: { date: '2026-04-22' },
      lastMood: '\u{1F614}',
      lastActive: new Date('2026-04-22T10:00:00').getTime(),
    })
    expect(negativeMood).toBe('Hope tomorrow feels lighter \u{1F49C}')

    const inactive = getSmartNudge({
      lastMemory: { date: '2026-04-22' },
      lastMood: '\u{1F60A}',
      lastActive: new Date('2026-04-21T09:00:00').getTime(),
    })
    expect(inactive).toBe('It\u2019s been a while\u2026 add something today \u{1F49C}')
  })

  it('returns highlights including day frequency and image-days', () => {
    const highlights = getHighlights([
      { id: '1', date: '2026-04-20', text: 'Short', imageUrl: 'x' },
      { id: '2', date: '2026-04-21', text: 'This is the longest memory text here' },
      { id: '3', date: '2026-04-21', text: 'Another memory', image: 'y' },
    ])

    expect(highlights.totalMemories).toBe(3)
    expect(highlights.mostActiveDay).toBe('Tuesday')
    expect(highlights.longestEntry?.id).toBe('2')
    expect(highlights.daysWithImages).toEqual(['2026-04-20', '2026-04-21'])
  })

  it('tracks last active timestamp', () => {
    updateLastActive(new Date('2026-04-22T11:00:00').getTime())
    expect(getLastActive()).toBe(new Date('2026-04-22T11:00:00').getTime())
  })

  it('supports delete-with-undo within 5 seconds', () => {
    deleteWithUndo({ id: 'item-1' })
    expect(restoreLastDeleted()).toEqual({ id: 'item-1' })

    deleteWithUndo({ id: 'item-2' })
    vi.advanceTimersByTime(5100)
    expect(restoreLastDeleted()).toBeNull()
  })
})
