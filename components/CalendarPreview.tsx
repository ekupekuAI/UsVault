'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CalendarPreview() {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null)
  const [today, setToday] = useState<number | null>(null)
  const [thisMonth, setThisMonth] = useState<number | null>(null)

  useEffect(() => {
    const now = new Date()
    setCurrentMonth(now)
    setToday(now.getDate())
    setThisMonth(now.getMonth())
  }, [])

  const getDaysInMonth = (date: Date | null) => {
    if (!date) return 0
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date | null) => {
    if (!date) return 0
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  if (!currentMonth || today === null || thisMonth === null) {
    return <div className="glass p-6 h-64" />
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="glass p-6">
      <p className="text-xs text-muted-foreground font-medium mb-4">CALENDAR</p>

      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{monthName}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const isToday = day === today && currentMonth.getMonth() === thisMonth
          const isSpecial = [5, 12, 19, 26].includes(day) // Mark some special days
          
          return (
            <button
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                isToday
                  ? 'bg-gradient-to-br from-pink-400 to-purple-400 text-white shadow-lg'
                  : isSpecial
                  ? 'bg-gradient-to-br from-pink-200/60 to-purple-200/60 text-foreground hover:shadow-md'
                  : 'bg-white/40 text-foreground hover:bg-white/60'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
