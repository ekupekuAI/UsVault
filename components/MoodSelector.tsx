'use client'

interface MoodSelectorProps {
  mood: string
  onMoodChange: (mood: string) => void
}

export default function MoodSelector({ mood, onMoodChange }: MoodSelectorProps) {
  const moods = ['😊', '😍', '🥰', '😌', '🎉', '😢']

  return (
    <div className="glass p-6">
      <p className="text-xs text-muted-foreground font-medium mb-3">MY MOOD</p>

      {/* Current mood display */}
      <div className="text-4xl font-bold mb-4 text-center">{mood}</div>

      {/* Mood grid */}
      <div className="grid grid-cols-3 gap-2">
        {moods.map((m) => (
          <button
            key={m}
            onClick={() => onMoodChange(m)}
            className={`py-3 rounded-lg text-2xl transition-all duration-200 ${
              mood === m
                ? 'bg-gradient-to-br from-pink-300 to-purple-300 shadow-lg scale-110'
                : 'bg-white/40 hover:bg-white/60 hover:scale-105'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
