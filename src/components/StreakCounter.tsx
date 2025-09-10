'use client'

import { useState, useEffect } from 'react'

export default function StreakCounter() {
  const [streak, setStreak] = useState(0)

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
    } else if (diffDays === 0) {
      // Same day
      setStreak(currentStreak)
    } else {
      // Streak broken
      localStorage.setItem('streak', '1')
      localStorage.setItem('lastOpenedDrop', today)
      setStreak(1)
    }
  }

  return (
    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200">
      <div className="flex items-center space-x-2">
        <span className="text-emerald-600">🔥</span>
        <span className="font-medium text-slate-700">{streak}</span>
      </div>
    </div>
  )
}