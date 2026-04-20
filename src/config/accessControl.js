const rawUsers = import.meta.env.VITE_ALLOWED_USERS || ''

export const allowedUsers = rawUsers
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
  .slice(0, 2)

export const strictModeEnabled = allowedUsers.length === 2

export function isAllowedEmail(email) {
  if (!strictModeEnabled) {
    return true
  }

  return allowedUsers.includes((email || '').toLowerCase())
}

