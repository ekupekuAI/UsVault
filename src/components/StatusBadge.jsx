import { STATUS_THEME } from '../constants/options'

function StatusBadge({ status }) {
  const theme = STATUS_THEME[status] || 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${theme}`}
    >
      {status}
    </span>
  )
}

export default StatusBadge
