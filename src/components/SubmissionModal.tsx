'use client'

import { useState } from 'react'

interface SubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  apiBase: string
}

export default function SubmissionModal({ isOpen, onClose, apiBase }: SubmissionModalProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || text.length > 280) return

    setSubmitting(true)
    try {
      const res = await fetch(`${apiBase}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      })

      if (res.ok) {
        setSubmitted(true)
        setText('')
        setTimeout(() => {
          setSubmitted(false)
          onClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {submitted ? (
          <div className="text-center">
            <div className="text-emerald-600 text-4xl mb-4">✓</div>
            <p className="text-slate-700 font-medium">Thank you!</p>
            <p className="text-slate-500 text-sm">Your note will be reviewed for a future drop.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Share your gratitude</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-emerald-800 mb-2">
                <strong>Share your story!</strong> The most meaningful notes tell us why something matters to you. You have plenty of space (280 characters) to paint a picture.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-40 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  maxLength={280}
                  disabled={submitting}
                />
                <div className="flex justify-between items-center text-sm mt-1">
                  <div className="text-slate-500">
                    {text.length < 30 && text.length > 0 && (
                      <span className="text-emerald-600">✨ Tell us more! What makes this special?</span>
                    )}
                    {text.length >= 30 && text.length < 100 && (
                      <span className="text-emerald-600">🌟 Great start! Keep painting the picture...</span>
                    )}
                    {text.length >= 100 && text.length < 200 && (
                      <span className="text-emerald-600">💚 Beautiful! You're capturing the feeling...</span>
                    )}
                    {text.length >= 200 && (
                      <span className="text-emerald-600">🎉 Perfect! This will touch hearts.</span>
                    )}
                  </div>
                  <div className={`${text.length > 260 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {text.length}/280
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || text.length > 280 || submitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}