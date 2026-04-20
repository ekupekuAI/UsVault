import { Heart } from 'lucide-react'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/30 border-b border-white/40">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Together</h1>
              <p className="text-xs text-muted-foreground">Our moments, our memories</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">Emily & Michael</p>
              <p className="text-xs text-muted-foreground">Day 847</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-white font-semibold">
              EM
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
