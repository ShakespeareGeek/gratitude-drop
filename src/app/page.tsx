'use client'

import { useState, useEffect } from 'react'
import SubmissionModal from '../components/SubmissionModal'
import StreakCounter from '../components/StreakCounter'

interface Note {
  id: number
  text: string
  hearts: number
}

interface Drop {
  dropId: string
  notes: Note[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://your-worker.your-subdomain.workers.dev'

export default function Home() {
  const [drop, setDrop] = useState<Drop | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [likedNotes, setLikedNotes] = useState<Set<number>>(new Set())
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    fetchDrop()
    checkFirstVisit()
    loadLikedNotes()
  }, [])

  const fetchDrop = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/drop`)
      const data = await res.json()
      setDrop(data)
    } catch (error) {
      console.error('Failed to fetch drop:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkFirstVisit = () => {
    const today = new Date().toISOString().split('T')[0]
    const lastVisit = localStorage.getItem('lastVisit')
    
    if (lastVisit !== today) {
      setShowBanner(true)
      localStorage.setItem('lastVisit', today)
    }
  }

  const loadLikedNotes = () => {
    const liked = new Set<number>()
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('liked_')) {
        const noteId = parseInt(key.replace('liked_', ''))
        if (!isNaN(noteId)) liked.add(noteId)
      }
    }
    setLikedNotes(liked)
  }

  const handleHeart = async (noteId: number) => {
    if (likedNotes.has(noteId)) return

    try {
      await fetch(`${API_BASE}/api/heart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      })

      localStorage.setItem(`liked_${noteId}`, 'true')
      setLikedNotes(prev => new Set([...prev, noteId]))
      
      setDrop(prev => prev ? {
        ...prev,
        notes: prev.notes.map(note => 
          note.id === noteId ? { ...note, hearts: note.hearts + 1 } : note
        )
      } : null)
    } catch (error) {
      console.error('Failed to heart note:', error)
    }
  }

  const scrollToNotes = () => {
    document.getElementById('notes-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleShare = () => {
    const shareText = "One of today's #GratitudeDrop notes hit me hard. Get the rest here → https://www.gratitudedrop.com"
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    
    // Try native sharing first (mobile), fallback to Twitter
    if (navigator.share) {
      navigator.share({
        title: 'The Daily Gratitude Drop',
        text: shareText,
        url: 'https://www.gratitudedrop.com'
      }).catch(() => {
        // Fallback to Twitter if native sharing fails
        window.open(shareUrl, '_blank')
      })
    } else {
      // Desktop: open Twitter
      window.open(shareUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading today's drop...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-100">
      <StreakCounter />
      
      {showBanner && (
        <div className="bg-emerald-100 border-b border-emerald-200 p-4 text-center">
          <button 
            onClick={() => { scrollToNotes(); setShowBanner(false) }}
            className="text-emerald-700 font-medium hover:text-emerald-800"
          >
            Today's drop is ready →
          </button>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            The Daily Gratitude Drop
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            5 anonymous thank-you notes. One minute. Zero noise.
          </p>
          <button 
            onClick={scrollToNotes}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Get Today's Drop
          </button>
        </header>

        <section id="notes-section" className="mb-12">
          {drop?.notes && drop.notes.length > 0 ? (
            <div className="space-y-6">
              {drop.notes.map((note) => (
                <div 
                  key={note.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-slate-200"
                >
                  <p className="text-lg font-serif text-slate-700 leading-relaxed mb-4">
                    "{note.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleHeart(note.id)}
                      disabled={likedNotes.has(note.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        likedNotes.has(note.id)
                          ? 'text-red-400 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-red-500'
                      }`}
                    >
                      <span className="text-xl">♥</span>
                      <span className="font-medium">{note.hearts}</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare()}
                      className="flex items-center space-x-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <span className="text-lg">↗</span>
                      <span className="font-medium text-sm">Share this drop</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No notes available today.</p>
            </div>
          )}
        </section>

        <div className="text-center pb-16">
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg"
          >
            Add to tomorrow's drop
          </button>
        </div>
      </div>

      {showModal && (
        <SubmissionModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          apiBase={API_BASE}
        />
      )}
    </div>
  )
}