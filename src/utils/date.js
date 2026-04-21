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
  const now = Date.now()
  const diffMs = Math.max(0, now - date.getTime())
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) {
    return 'Last updated: just now'
  }
  if (diffMinutes < 60) {
    return `Last updated: ${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `Last updated: ${diffHours} hr${diffHours === 1 ? '' : 's'} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `Last updated: ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}
