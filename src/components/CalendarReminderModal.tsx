'use client'

import { useState } from 'react'

// Extend Window interface for Plausible
declare global {
  interface Window {
    plausible?: (event: string) => void
  }
}

interface CalendarReminderModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CalendarReminderModal({ isOpen, onClose }: CalendarReminderModalProps) {
  const [downloading, setDownloading] = useState(false)

  const handleClose = () => {
    // Track analytics for modal close
    if (typeof window !== 'undefined') {
      window.plausible?.('Calendar Modal Close')
    }
    onClose()
  }

  const generateICS = (timeOption: 'morning' | 'noon' | 'evening') => {
    setDownloading(true)
    
    // Track analytics for time selection and download
    if (typeof window !== 'undefined') {
      window.plausible?.(`Calendar Time Selected - ${timeOption}`)
      window.plausible?.(`Calendar Download - ${timeOption}`)
    }

    // Set time based on option
    let hour: string
    let displayTime: string
    
    switch (timeOption) {
      case 'morning':
        hour = '09'
        displayTime = '9:00 AM'
        break
      case 'noon':
        hour = '12'
        displayTime = '12:00 PM'
        break
      case 'evening':
        hour = '19'
        displayTime = '7:00 PM'
        break
    }

    // Create ICS content
    const now = new Date()
    const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    
    // Set start date to tomorrow at the chosen time
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(parseInt(hour), 0, 0, 0)
    
    const startDate = tomorrow.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const endDate = new Date(tomorrow.getTime() + 15 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') // 15 minute duration
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gratitude Drop//Daily Reminder//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:daily-gratitude-${timestamp}@gratitudedrop.com
DTSTART:${startDate}
DTEND:${endDate}
RRULE:FREQ=DAILY
SUMMARY:Daily Gratitude
DESCRIPTION:What are you grateful for today?
URL:https://www.gratitudedrop.com/?utm_source=r1
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Time to reflect on what you're grateful for!
TRIGGER:PT0M
END:VALARM
END:VEVENT
END:VCALENDAR`

    // Create and download file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'daily-gratitude-reminder.ics'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setTimeout(() => {
      setDownloading(false)
      handleClose()
    }, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Never miss a drop</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-600 mb-4">
            Get a gentle daily reminder to check new gratitude notes. Choose your preferred time:
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => generateICS('morning')}
              disabled={downloading}
              className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Morning</div>
                  <div className="text-sm text-slate-500">9:00 AM - Start your day with gratitude</div>
                </div>
                <span className="text-2xl">🌅</span>
              </div>
            </button>

            <button
              onClick={() => generateICS('noon')}
              disabled={downloading}
              className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Midday</div>
                  <div className="text-sm text-slate-500">12:00 PM - A mindful lunch break</div>
                </div>
                <span className="text-2xl">☀️</span>
              </div>
            </button>

            <button
              onClick={() => generateICS('evening')}
              disabled={downloading}
              className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Evening</div>
                  <div className="text-sm text-slate-500">7:00 PM - Reflect on your day</div>
                </div>
                <span className="text-2xl">🌙</span>
              </div>
            </button>
          </div>
        </div>

        {downloading && (
          <div className="text-center py-2">
            <div className="text-emerald-600 font-medium">
              ✓ Creating your calendar reminder...
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Works with Apple Calendar, Google Calendar, Outlook, and more
          </p>
        </div>
      </div>
    </div>
  )
}