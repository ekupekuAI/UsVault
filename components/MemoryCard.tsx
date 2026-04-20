'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Edit2 } from 'lucide-react'

export default function MemoryCard() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="group relative">
      <div className="glass p-6 h-full min-h-[320px] flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
        {/* Header with date */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium">TODAY&apos;S MEMORY</p>
            <h2 className="text-2xl font-bold text-foreground mt-1">Coffee Date</h2>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* Memory content */}
        <div className="flex-1 flex flex-col gap-4 my-4">
          {/* Image placeholder */}
          <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-pink-200/50 to-purple-200/50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
          </div>

          {/* Memory text */}
          <p className="text-sm text-foreground/80 leading-relaxed">
            Had the most beautiful morning at our favorite café. You laughed so hard at that terrible joke, and I fell in love all over again. ☕💕
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/30">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">Cherished</span>
          </div>
          <span className="text-xs text-muted-foreground">April 5, 2025</span>
        </div>
      </div>
    </div>
  )
}
