'use client'

import { Send, Heart } from 'lucide-react'
import { useState } from 'react'

interface Message {
  id: number
  sender: 'you' | 'them'
  text: string
  timestamp: string
}

export default function ChatPreview() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'them',
      text: 'Hey! How was your day? 😊',
      timestamp: '2:45 PM',
    },
    {
      id: 2,
      sender: 'you',
      text: 'Amazing! I was thinking about us the whole time ❤️',
      timestamp: '2:47 PM',
    },
    {
      id: 3,
      sender: 'them',
      text: 'Aww you&apos;re so sweet! Can&apos;t wait to see you tonight',
      timestamp: '2:48 PM',
    },
    {
      id: 4,
      sender: 'you',
      text: 'Me neither! 💕',
      timestamp: '2:49 PM',
    },
  ])

  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        sender: 'you',
        text: inputValue,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([...messages, newMessage])
      setInputValue('')

      // Simulate reply after a short delay
      setTimeout(() => {
        const replies = [
          "That's sweet! 💕",
          "I love you! ❤️",
          'Haha you&apos;re funny 😄',
          'Can&apos;t agree more! 🥰',
        ]
        const randomReply = replies[Math.floor(Math.random() * replies.length)]
        setMessages((prev) => [
          ...prev,
          {
            id: prev[prev.length - 1].id + 1,
            sender: 'them',
            text: randomReply,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      }, 800)
    }
  }

  return (
    <div className="glass p-6 flex flex-col h-full min-h-[360px]">
      <p className="text-xs text-muted-foreground font-medium mb-4">MESSAGES</p>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-2.5 rounded-2xl ${
                message.sender === 'you'
                  ? 'bg-gradient-to-br from-pink-300 to-purple-300 text-white rounded-br-none'
                  : 'bg-white/50 text-foreground rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === 'you' ? 'text-white/70' : 'text-muted-foreground'}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2 pt-4 border-t border-white/30">
        <button className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0">
          <Heart className="w-5 h-5 text-primary" />
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Say something sweet..."
          className="flex-1 bg-white/50 border border-white/30 rounded-lg px-4 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleSend}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0 hover:text-primary"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
