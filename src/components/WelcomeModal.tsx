'use client'

import { useState, useEffect, useMemo } from 'react'

// Extend Window interface for Plausible
declare global {
  interface Window {
    plausible?: (event: string) => void
  }
}

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  streak: number
  apiBase: string
}

export default function WelcomeModal({ isOpen, onClose, streak, apiBase }: WelcomeModalProps) {
  const getWelcomeMessage = () => {
    const messages = [
      {
        title: "Welcome back! ✨",
        subtitle: "Share what you're grateful for today",
        body: "Before reading today's notes, what's something good in your world right now?"
      },
      {
        title: "Hello, beautiful soul! 🌅",
        subtitle: "What are you thankful for?",
        body: "You're part of a community sharing gratitude. What makes your heart full today?"
      },
      {
        title: "You're here! 💚",
        subtitle: "What brings you joy today?",
        body: "Every note shared adds to the collective gratitude. What's yours?"
      },
      {
        title: "Welcome to today! 🌸",
        subtitle: "What brightens your day?",
        body: "Join the gratitude community by sharing something meaningful to you."
      },
      {
        title: "Good to see you again! 🌟",
        subtitle: "What warms your heart?",
        body: "Your gratitude story matters. What would you like to share today?"
      }
    ]

    const streakMessages = [
      {
        title: "Every day is a fresh start 🌱",
        subtitle: "What are you grateful for?",
        body: "Starting your gratitude journey? Share what's good in your world today."
      },
      {
        title: `${streak} days strong! 🔥`,
        subtitle: "What are you thankful for today?",
        body: "You're building a beautiful habit. What gratitude would you like to share?"
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
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCurrentMessage(getWelcomeMessage())
      setText('')
      setSubmitted(false)
      setError('')
    }
  }, [isOpen, streak])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || text.length > 280) return

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${apiBase}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      })

      if (res.ok) {
        setSubmitted(true)
        setText('')
        if (typeof window !== 'undefined') {
          window.plausible?.('Note Submitted - Welcome Modal')
        }
        setTimeout(() => {
          setSubmitted(false)
          onClose()
        }, 2000)
      } else {
        const errorData = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setError('You can submit up to 5 notes per hour. Please try again later!')
        } else if (errorData.error) {
          setError(errorData.error)
        } else {
          setError('Something went wrong. Please try again.')
        }
      }
    } catch (error) {
      console.error('Failed to submit:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
        {submitted ? (
          <div className="text-center">
            <div className="text-emerald-600 text-4xl mb-4">✓</div>
            <p className="text-slate-700 font-medium">{(() => {
              const thankYouMessages = [
                "Thank you!",
                "Thanks for sharing your story!",
                "We're grateful for your contribution.",
                "Your gratitude means a lot.",
                "Thank you for adding to the drop!",
                "We appreciate you sharing this.",
                "Thanks for spreading gratitude!"
              ]
              return thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)]
            })()}</p>
            <p className="text-slate-500 text-sm">Your note will be reviewed for a future drop.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {currentMessage.title}
              </h2>
              <p className="text-emerald-600 font-medium mb-2 text-lg">
                {currentMessage.subtitle}
              </p>
              <p className="text-slate-600 text-sm">
                {currentMessage.body}
              </p>
              
              {streak > 1 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 mt-3">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-emerald-600">🔥</span>
                    <span className="text-emerald-800 font-medium text-sm">{streak} day streak!</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-emerald-800">
                <strong>Tell your story!</strong> The most meaningful notes tell us why something matters to you.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-28 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  maxLength={280}
                  disabled={submitting}
                  placeholder="Share what you're grateful for..."
                  autoFocus
                />
                <div className="flex justify-between items-center text-xs mt-1">
                  <div className="text-slate-500">
                    {text.length >= 30 && text.length < 100 && (
                      <span className="text-emerald-600">🌟 Great start!</span>
                    )}
                    {text.length >= 100 && (
                      <span className="text-emerald-600">💚 Beautiful!</span>
                    )}
                  </div>
                  <div className={`${text.length > 260 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {text.length}/280
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-xs font-medium">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 border border-pink-200 hover:border-pink-300 rounded-lg transition-colors text-sm font-medium"
                  disabled={submitting}
                >
                  Maybe later
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || text.length > 280 || submitting}
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-lg transition-colors text-sm font-bold shadow-lg hover:shadow-xl"
                >
                  {submitting ? 'Adding...' : 'Share'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}