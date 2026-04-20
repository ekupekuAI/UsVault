import { formatDateKey } from './date'

const STATUS_HINTS = {
  Free: "She's free right now... maybe call her?",
  Busy: "Let her focus. You'll talk soon.",
  'Someone Around': 'Give her space for now.',
}

const REMINDER_MESSAGES = [
  'Tell me about your day \u{1F4AD}',
  'What made you smile today?',
  'Anything you want to remember from today?',
]

const SURPRISE_MESSAGES = ['You matter to me \u{1F49C}', 'This moment is ours']

function normalizeName(rawName, fallback = 'Love') {
  const name = (rawName || '').trim()
  return name || fallback
}

function createDailySeed(date = new Date()) {
  const key = formatDateKey(date)
  return key.split('-').join('')
}

export function getTimePeriod(date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'morning'
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon'
  }
  if (hour >= 17 && hour < 22) {
    return 'evening'
  }
  return 'night'
}

export function getTimeGreeting(date = new Date()) {
  const period = getTimePeriod(date)

  if (period === 'morning') {
    return 'Good morning'
  }
  if (period === 'afternoon') {
    return 'Good afternoon'
  }
  if (period === 'evening') {
    return 'Good evening'
  }
  return 'Good night'
}

export function formatGreetingForPartner({ partnerProfile, myProfile }) {
  const recipientName = normalizeName(myProfile?.displayName || myProfile?.partnerName, 'Love')
  const timeGreeting = getTimeGreeting()
  const timePeriod = getTimePeriod()
  const template = (partnerProfile?.greetingTemplate || '').trim()

  if (!template) {
    return `${timeGreeting}, ${recipientName} \u{1F49C}`
  }

  return template
    .replaceAll('{name}', recipientName)
    .replaceAll('{time}', timePeriod)
    .replaceAll('{greeting}', timeGreeting)
}

export function formatOutgoingGreetingPreview(profileDraft) {
  const fakePartnerName = normalizeName(profileDraft?.partnerName, 'Love')
  const timeGreeting = getTimeGreeting()
  const timePeriod = getTimePeriod()
  const template = (profileDraft?.greetingTemplate || '').trim()

  if (!template) {
    return `${timeGreeting}, ${fakePartnerName} \u{1F49C}`
  }

  return template
    .replaceAll('{name}', fakePartnerName)
    .replaceAll('{time}', timePeriod)
    .replaceAll('{greeting}', timeGreeting)
}

export function getSmartStatusMessage(status) {
  return STATUS_HINTS[status] || 'You both are synced in real time.'
}

export function getEmotionalCaption(entry) {
  const mood = entry?.mood || ''
  const text = (entry?.text || '').toLowerCase()

  if (mood === '\u{1F60D}' || mood === '\u{1F60A}' || /smile|laug|happy|joy|fun/.test(text)) {
    return 'You smiled a lot this day.'
  }
  if (mood === '\u{1F60C}' || /calm|peace|slow|quiet/.test(text)) {
    return 'This one felt soft and peaceful.'
  }
  if (mood === '\u{1F634}' || /tired|late|sleep|rest/.test(text)) {
    return 'A tired day, but still worth remembering.'
  }
  if (mood === '\u{1F614}' || /miss|long|wish/.test(text)) {
    return 'A tender day with deep feelings.'
  }
  if (mood === '\u{1F621}' || /stress|busy|hard|rush/.test(text)) {
    return 'Even on heavy days, you showed up for each other.'
  }

  return 'A little memory, kept with love.'
}

export function pickDailyReminderMessage(date = new Date()) {
  const seed = Number(createDailySeed(date))
  const index = seed % REMINDER_MESSAGES.length
  return REMINDER_MESSAGES[index]
}

export function pickRandomSurpriseMessage() {
  const index = Math.floor(Math.random() * SURPRISE_MESSAGES.length)
  return SURPRISE_MESSAGES[index]
}
