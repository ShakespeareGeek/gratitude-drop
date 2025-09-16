'use client'

import { useState, useEffect } from 'react'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  streak: number
}

export default function WelcomeModal({ isOpen, onClose, streak }: WelcomeModalProps) {
  const getWelcomeMessage = () => {
    const messages = [
      {
        title: "Welcome back! ✨",
        subtitle: "Your daily dose of gratitude awaits",
        body: "You're here again, and that means something beautiful. Today's notes are handpicked to remind you of all the good in the world. Take a moment to let them fill your heart.",
        cta: "Let's dive in"
      },
      {
        title: "Hello, beautiful soul! 🌅",
        subtitle: "Another day, another chance to feel grateful",
        body: "Thank you for choosing to start your day with gratitude. The five notes waiting for you were written by people just like you, sharing what makes their hearts full.",
        cta: "Show me today's notes"
      },
      {
        title: "You're here! 💚",
        subtitle: "And we're so grateful for that",
        body: "Every time you visit, you're not just reading gratitude—you're practicing it. You're part of a community that believes in focusing on what's good and beautiful in life.",
        cta: "I'm ready"
      },
      {
        title: "Welcome to today! 🌸",
        subtitle: "Your gratitude journey continues",
        body: "There's something magical about starting the day by reading what others are thankful for. It reminds us that even in a complicated world, there's so much beauty to celebrate.",
        cta: "Let's celebrate together"
      },
      {
        title: "Good to see you again! 🌟",
        subtitle: "Ready for some heart-warming notes?",
        body: "Behind each note you're about to read is someone who took a moment to appreciate something in their life. By reading them, you're spreading that appreciation even further.",
        cta: "Spread the gratitude"
      },
      {
        title: "You made it! 🎉",
        subtitle: "Another day of choosing gratitude",
        body: "In a world full of notifications and distractions, you chose to be here. You chose to focus on gratitude. That choice matters more than you know.",
        cta: "Let's focus together"
      },
      {
        title: "Welcome, friend! 🤗",
        subtitle: "Your daily reminder that life is beautiful",
        body: "Today's notes come from strangers who are also friends—people who see the world through grateful eyes. Let their appreciation inspire your own.",
        cta: "Inspire me"
      },
      {
        title: "Here for the good stuff! ✨",
        subtitle: "Five reasons to smile today",
        body: "You're about to read five genuine moments of gratitude from real people. Each one is a little gift—a reminder that there's always something to appreciate.",
        cta: "Open my gifts"
      }
    ]

    const streakMessages = [
      {
        title: "Day 1! Welcome! 🌱",
        subtitle: "You've started something beautiful",
        body: "This is the beginning of a gratitude journey that could transform how you see the world. Every day you return, you're training your mind to notice what's good.",
        cta: "Start my journey"
      },
      {
        title: `${streak} days strong! 🔥`,
        subtitle: "You're building a beautiful habit",
        body: "Each day you return is a choice to focus on gratitude over complaint, appreciation over criticism. You're literally rewiring your brain for happiness.",
        cta: "Keep building"
      }
    ]

    if (streak === 1) {
      return streakMessages[0]
    } else if (streak > 1 && streak <= 7) {
      return streakMessages[1]
    }

    return messages[Math.floor(Math.random() * messages.length)]
  }

  const [currentMessage, setCurrentMessage] = useState(getWelcomeMessage())

  useEffect(() => {
    if (isOpen) {
      setCurrentMessage(getWelcomeMessage())
    }
  }, [isOpen, streak])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {currentMessage.title}
          </h2>
          <p className="text-emerald-600 font-medium mb-4">
            {currentMessage.subtitle}
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            {currentMessage.body}
          </p>
          
          {streak > 1 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-emerald-600">🔥</span>
                <span className="text-emerald-800 font-medium">{streak} day streak!</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
          >
            {currentMessage.cta}
          </button>
        </div>
      </div>
    </div>
  )
}