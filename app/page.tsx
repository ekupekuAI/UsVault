'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import MemoryCard from '@/components/MemoryCard'
import MoodSelector from '@/components/MoodSelector'
import StatusIndicator from '@/components/StatusIndicator'
import CalendarPreview from '@/components/CalendarPreview'
import ChatPreview from '@/components/ChatPreview'

export default function Dashboard() {
  const [mood, setMood] = useState('😊')
  const [status, setStatus] = useState<'free' | 'busy' | 'someone'>('free')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Subtle animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Memory Card - takes full width on mobile, 2 cols on desktop */}
            <div className="md:col-span-2">
              <MemoryCard />
            </div>

            {/* Status Column */}
            <div className="flex flex-col gap-6">
              <StatusIndicator status={status} onStatusChange={setStatus} />
              <MoodSelector mood={mood} onMoodChange={setMood} />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CalendarPreview />
            <ChatPreview />
          </div>
        </main>
      </div>
    </div>
  )
}
