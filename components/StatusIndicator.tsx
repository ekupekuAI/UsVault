'use client'

import { Circle } from 'lucide-react'

interface StatusIndicatorProps {
  status: 'free' | 'busy' | 'someone'
  onStatusChange: (status: 'free' | 'busy' | 'someone') => void
}

export default function StatusIndicator({ status, onStatusChange }: StatusIndicatorProps) {
  const statuses: Array<{
    key: 'free' | 'busy' | 'someone'
    label: string
    color: string
    bgColor: string
  }> = [
    { key: 'free', label: 'Free', color: 'bg-green-500', bgColor: 'bg-green-50' },
    { key: 'busy', label: 'Busy', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { key: 'someone', label: 'Someone Around', color: 'bg-red-500', bgColor: 'bg-red-50' },
  ]

  return (
    <div className="glass p-6">
      <p className="text-xs text-muted-foreground font-medium mb-4">AVAILABILITY</p>

      <div className="space-y-3">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${
              status === s.key
                ? `${s.bgColor} ring-2 ring-offset-2 ring-offset-white/30 ring-${s.color.split('-')[1]}-300`
                : 'bg-white/40 hover:bg-white/60'
            }`}
          >
            <Circle className={`w-3 h-3 fill-current ${s.color.replace('bg-', 'text-')}`} />
            <span
              className={`text-sm font-medium ${
                status === s.key ? 'text-foreground' : 'text-foreground/70'
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* Current status message */}
      <div className="mt-4 p-3 bg-white/50 rounded-lg">
        <p className="text-xs text-muted-foreground">Status: <span className="font-semibold text-foreground capitalize">{status}</span></p>
      </div>
    </div>
  )
}
