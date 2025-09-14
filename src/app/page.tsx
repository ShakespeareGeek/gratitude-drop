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
  const [sharedNote, setSharedNote] = useState<Note | null>(null)
  const [showSharedModal, setShowSharedModal] = useState(false)
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false)

  useEffect(() => {
    fetchDrop()
    loadLikedNotes()
    checkSharedNote()
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevNote()
      } else if (e.key === 'ArrowRight') {
        nextNote()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentNoteIndex, drop?.notes])

  // Touch swipe and mouse drag support
  useEffect(() => {
    let startX = 0
    let startY = 0
    let endX = 0
    let isDragging = false
    let isHorizontalSwipe = false

    const handleStart = (e: TouchEvent | MouseEvent) => {
      startX = 'touches' in e ? e.touches[0].clientX : e.clientX
      startY = 'touches' in e ? e.touches[0].clientY : e.clientY
      isDragging = true
      isHorizontalSwipe = false
    }

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return
      
      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      const deltaX = Math.abs(currentX - startX)
      const deltaY = Math.abs(currentY - startY)
      
      // Only prevent default if this is clearly a horizontal swipe
      if (deltaX > deltaY && deltaX > 10) {
        isHorizontalSwipe = true
        e.preventDefault() // Prevent text selection during horizontal drag
      }
      // For vertical movements or ambiguous movements, let the browser handle scrolling
    }

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return
      endX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
      isDragging = false
      
      // Only trigger navigation if this was a horizontal swipe
      if (isHorizontalSwipe) {
        const swipeThreshold = 50
        const diff = startX - endX
        
        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) {
            nextNote() // Drag left = next (already calls pauseAutoAdvance)
          } else {
            prevNote() // Drag right = previous (already calls pauseAutoAdvance)
          }
        }
      }
      
      isHorizontalSwipe = false
    }

    const notesSection = document.getElementById('notes-section')
    if (notesSection) {
      // Touch events
      notesSection.addEventListener('touchstart', handleStart)
      notesSection.addEventListener('touchmove', handleMove)
      notesSection.addEventListener('touchend', handleEnd)
      
      // Mouse events
      notesSection.addEventListener('mousedown', handleStart)
      notesSection.addEventListener('mousemove', handleMove)
      notesSection.addEventListener('mouseup', handleEnd)
      notesSection.addEventListener('mouseleave', () => isDragging = false)
      
      // Make it feel more draggable
      notesSection.style.cursor = 'grab'
      notesSection.addEventListener('mousedown', () => {
        if (notesSection) notesSection.style.cursor = 'grabbing'
      })
      notesSection.addEventListener('mouseup', () => {
        if (notesSection) notesSection.style.cursor = 'grab'
      })
      
      // Pause auto-advance on hover/focus
      notesSection.addEventListener('mouseenter', () => pauseAutoAdvance())
      notesSection.addEventListener('focusin', () => pauseAutoAdvance())
      
      return () => {
        notesSection.removeEventListener('touchstart', handleStart)
        notesSection.removeEventListener('touchmove', handleMove)
        notesSection.removeEventListener('touchend', handleEnd)
        notesSection.removeEventListener('mousedown', handleStart)
        notesSection.removeEventListener('mousemove', handleMove)
        notesSection.removeEventListener('mouseup', handleEnd)
        notesSection.removeEventListener('mouseleave', () => isDragging = false)
        notesSection.removeEventListener('mouseenter', () => pauseAutoAdvance())
        notesSection.removeEventListener('focusin', () => pauseAutoAdvance())
      }
    }
  }, [currentNoteIndex, drop?.notes])

  // Auto-advance timer
  useEffect(() => {
    if (!drop?.notes || drop.notes.length <= 1 || autoAdvancePaused) return

    const timer = setInterval(() => {
      setCurrentNoteIndex(prevIndex => {
        const nextIndex = prevIndex + 1
        // Loop back to beginning after reaching the end
        return nextIndex >= drop.notes.length ? 0 : nextIndex
      })
    }, 8000) // 8 seconds per note

    return () => clearInterval(timer)
  }, [drop?.notes, currentNoteIndex, autoAdvancePaused])

  const checkSharedNote = async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const noteId = urlParams.get('note')
    
    if (noteId) {
      try {
        const res = await fetch(`${API_BASE}/api/note/${noteId}`)
        if (res.ok) {
          const noteData = await res.json()
          setSharedNote(noteData)
          setShowSharedModal(true)
        }
      } catch (error) {
        console.error('Failed to fetch shared note:', error)
      }
    }
  }

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

    pauseAutoAdvance()
    
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

  const pauseAutoAdvance = (permanent = false) => {
    setAutoAdvancePaused(true)
    if (!permanent) {
      // Resume auto-advance after 15 seconds of no interaction (for hover/heart/share)
      setTimeout(() => setAutoAdvancePaused(false), 15000)
    }
    // If permanent=true, auto-advance stays disabled for the session
  }

  const nextNote = () => {
    if (drop?.notes && currentNoteIndex < drop.notes.length - 1) {
      setCurrentNoteIndex(currentNoteIndex + 1)
      pauseAutoAdvance(true) // Permanently disable auto-advance
    }
  }

  const prevNote = () => {
    if (currentNoteIndex > 0) {
      setCurrentNoteIndex(currentNoteIndex - 1)
      pauseAutoAdvance(true) // Permanently disable auto-advance
    }
  }

  const goToNote = (index: number) => {
    setCurrentNoteIndex(index)
    pauseAutoAdvance(true) // Permanently disable auto-advance
  }

  const handleShare = (noteId: number) => {
    pauseAutoAdvance()
    
    const shareMessages = [
      "Ok this site is weirdly wholesome and I'm here for it →",
      "Who knew reading about other people's good days can make yours better?",
      "Coffee, Crossword, Gratitude. My new morning ritual →",
      "Remind yourself what matters most →", 
      "Pause and reflect on positive things →",
      "Warning: gratitude may be contagious →",
      "A moment of calm in a noisy world →"
    ]
    
    const randomMessage = shareMessages[Math.floor(Math.random() * shareMessages.length)]
    const shareLink = `https://www.gratitudedrop.com?note=${noteId}`
    const fullShareText = `${randomMessage} ${shareLink} #GratitudeDrop`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`
    
    // Try native sharing first (mobile), fallback to Twitter
    if (navigator.share) {
      navigator.share({
        title: 'The Daily Gratitude Drop',
        text: randomMessage,
        url: shareLink
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
      

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            The Daily Gratitude Drop
          </h1>
          <p className="text-xl text-slate-600">
            5 anonymous thank-you notes. One minute. Zero noise.
          </p>
        </header>

        <section id="notes-section" className="mb-12">
          {drop?.notes && drop.notes.length > 0 ? (
            <div className="relative">
              {/* Progress indicator */}
              <div className="flex justify-center space-x-2 mb-6">
                {drop.notes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToNote(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentNoteIndex 
                        ? 'bg-emerald-500' 
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              {/* Current note display */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 min-h-[300px] flex flex-col justify-between">
                <div className="flex-grow flex items-center">
                  <p className="text-xl md:text-2xl font-serif text-slate-700 leading-relaxed text-center">
                    "{drop.notes[currentNoteIndex].text}"
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => handleHeart(drop.notes[currentNoteIndex].id)}
                    disabled={likedNotes.has(drop.notes[currentNoteIndex].id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      likedNotes.has(drop.notes[currentNoteIndex].id)
                        ? 'text-red-400 cursor-not-allowed' 
                        : 'text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <span className="text-2xl">♥</span>
                    <span className="font-medium text-lg">{drop.notes[currentNoteIndex].hearts}</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare(drop.notes[currentNoteIndex].id)}
                    className="flex items-center space-x-2 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    <span className="text-xl">↗</span>
                    <span className="font-medium">Share this note</span>
                  </button>
                </div>
              </div>

              {/* Navigation arrows */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={prevNote}
                  disabled={currentNoteIndex === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentNoteIndex === 0 
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">&larr;</span>
                  <span className="font-medium">Previous</span>
                </button>

                <div className="text-sm text-slate-500 font-medium">
                  {currentNoteIndex + 1} of {drop.notes.length}
                </div>

                <button
                  onClick={nextNote}
                  disabled={currentNoteIndex === drop.notes.length - 1}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    currentNoteIndex === drop.notes.length - 1
                      ? 'text-slate-300 cursor-not-allowed' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-medium">Next</span>
                  <span className="text-xl">&rarr;</span>
                </button>
              </div>

              {/* Navigation hints */}
              <div className="text-center mt-4">
                <p className="text-xs text-slate-400 md:hidden">
                  Swipe left or right to navigate • Auto-advances every 8s {autoAdvancePaused ? '(paused)' : ''}
                </p>
                <p className="text-xs text-slate-400 hidden md:block">
                  Drag, use arrow keys, or click buttons to navigate • Auto-advances every 8s {autoAdvancePaused ? '(paused)' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600">No notes available today.</p>
            </div>
          )}
        </section>

        <div className="text-center pb-12">
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg"
          >
            What are you grateful for?
          </button>
        </div>

        <div className="text-center pb-16">
          <a 
            href="mailto:feedback@gratitudedrop.com"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            feedback@gratitudedrop.com
          </a>
        </div>
      </div>

      {showModal && (
        <SubmissionModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          apiBase={API_BASE}
        />
      )}

      {showSharedModal && sharedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Shared Gratitude Note</h2>
              <button
                onClick={() => {
                  setShowSharedModal(false)
                  // Clean up URL
                  window.history.replaceState({}, '', '/')
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
              <p className="text-lg font-serif text-slate-700 leading-relaxed">
                "{sharedNote.text}"
              </p>
            </div>
            
            <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
              <span>♥ {sharedNote.hearts} {sharedNote.hearts === 1 ? 'heart' : 'hearts'}</span>
              <span>Anonymous gratitude</span>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => {
                  setShowSharedModal(false)
                  window.history.replaceState({}, '', '/')
                  scrollToNotes()
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                See Today's Drop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}