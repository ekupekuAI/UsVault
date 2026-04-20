export function formatDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function formatReadableDate(dateKey) {
  if (!dateKey) {
    return '-'
  }

  const date = new Date(`${dateKey}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatLastSeen(timestamp) {
  if (!timestamp?.toDate) {
    return 'No recent update'
  }

  const date = timestamp.toDate()
  return `Updated ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`
}

