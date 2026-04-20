const rawAdmins = import.meta.env.VITE_ADMIN_EMAILS || 'gekansh2008@gmail.com'

export const adminEmails = rawAdmins
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email) {
  return adminEmails.includes(String(email || '').trim().toLowerCase())
}
