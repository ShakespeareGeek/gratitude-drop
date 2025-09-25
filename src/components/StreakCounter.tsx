'use client'

import { useState, useEffect } from 'react'
import WelcomeModal from './WelcomeModal'
import CalendarReminderModal from './CalendarReminderModal'

// Extend Window interface for Plausible
declare global {
  interface Window {
    plausible?: (event: string) => void
  }
}

export default function StreakCounter() {
  const [streak, setStreak] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  useEffect(() => {
    calculateStreak()
  }, [])

  const calculateStreak = () => {
    const today = new Date().toISOString().split('T')[0]
    const lastOpenedDrop = localStorage.getItem('lastOpenedDrop')
    const currentStreak = parseInt(localStorage.getItem('streak') || '0')

    if (!lastOpenedDrop) {
      // First visit
      localStorage.setItem('lastOpenedDrop', today)
      localStorage.setItem('streak', '1')
      setStreak(1)
      setShowWelcomeModal(true)
      return
    }

    const lastDate = new Date(lastOpenedDrop)
    const todayDate = new Date(today)
    const diffTime = todayDate.getTime() - lastDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Consecutive day
      const newStreak = currentStreak + 1
      localStorage.setItem('streak', newStreak.toString())
      localStorage.setItem('lastOpenedDrop', today)
      setStreak(newStreak)
      setShowWelcomeModal(true)
    } else if (diffDays === 0) {
      // Same day
      setStreak(currentStreak)
    } else {
      // Streak broken
      localStorage.setItem('streak', '1')
      localStorage.setItem('lastOpenedDrop', today)
      setStreak(1)
      setShowWelcomeModal(true)
    }
  }

  const getStreakMessage = () => {
    if (streak === 1) return "Welcome to your gratitude journey! 🌱"
    if (streak < 7) return `${streak} days of gratitude! Keep it going! 💚`
    if (streak < 14) return `Amazing! ${streak} days strong! You're building something beautiful! ✨`
    if (streak < 30) return `Incredible! ${streak} days of daily gratitude! You're inspiring! 🌟`
    return `Legendary! ${streak} days of consistent gratitude! You're a gratitude champion! 🏆`
  }

  const handleShare = () => {
    const shareMessages = [
      `I've been reading daily gratitude notes for ${streak} days straight! Join me at gratitudedrop.com 🔥`,
      `${streak} days of daily gratitude and counting! These anonymous thank-you notes are so heartwarming → gratitudedrop.com`,
      `Day ${streak} of my gratitude journey! Five beautiful anonymous notes daily → gratitudedrop.com 💚`,
      `${streak} days of starting my day with gratitude! Check out these daily notes → gratitudedrop.com ✨`
    ]
    
    const randomMessage = shareMessages[Math.floor(Math.random() * shareMessages.length)]
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(randomMessage)}`
    
    if (navigator.share) {
      navigator.share({
        title: 'My Gratitude Journey',
        text: `I've been reading daily gratitude notes for ${streak} days straight!`,
        url: 'https://www.gratitudedrop.com'
      }).catch(() => {
        window.open(shareUrl, '_blank')
      })
    } else {
      window.open(shareUrl, '_blank')
    }
  }

  return (
    <>
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {/* Streak counter button */}
        <button
          onClick={() => setShowModal(true)}
          className="bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="text-emerald-600">🔥</span>
            <span className="font-medium text-slate-700">{streak}</span>
          </div>
        </button>

        {/* Calendar reminder button */}
        <button
          onClick={() => {
            setShowCalendarModal(true)
            if (typeof window !== 'undefined') {
              window.plausible?.('Calendar Modal Open')
            }
          }}
          className="bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full p-3 border border-slate-200 transition-all hover:scale-105 cursor-pointer"
          title="Set daily reminders"
        >
          <span className="text-blue-600">📅</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🔥</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {streak} Day Streak!
              </h2>
              <p className="text-slate-600 mb-6">
                {getStreakMessage()}
              </p>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm text-slate-500">
                  Come back tomorrow for your next dose of daily gratitude! 
                  Every day you visit keeps your streak alive.
                </p>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleShare}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>📱</span>
                  <span>Share My Streak</span>
                </button>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-700 py-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        streak={streak}
      />

      <CalendarReminderModal 
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </>
  )
}