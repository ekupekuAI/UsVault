const rawUsers = import.meta.env.VITE_ALLOWED_USERS || ''
const strictModeFlag = String(import.meta.env.VITE_STRICT_COUPLE_MODE || 'false')
  .trim()
  .toLowerCase()

export const allowedUsers = rawUsers
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const strictModeEnabled = strictModeFlag === 'true' && allowedUsers.length > 0

export function isAllowedEmail(email) {
  if (!strictModeEnabled) {
    return true
  }

  return allowedUsers.includes((email || '').toLowerCase())
}
