'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import GameCard from '@/components/GameCard'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState(null)
  const [relatedGames, setRelatedGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (params.id) {
      fetchGameData(params.id)
    }
  }, [params.id])

  async function fetchGameData(id) {
    try {
      // Fetch current game
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setGame(data)

      // Initialize list for sidebar
      let sidebarGames = []
      const excludedIds = new Set([id]) // Keep track of IDs to exclude (current game + related)

      // 1. Try to find related games
      if (data.title) {
        const words = data.title.split(' ')
        // Pick the first word that is at least 3 characters, or just the first word
        const term = words.find(w => w.length >= 3) || words[0]
        
        if (term) {
          // Remove special characters to avoid query errors
          const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '')
          if (cleanTerm) {
            const { data: related } = await supabase
              .from('games')
              .select('*')
              .eq('is_active', true)
              .neq('id', id)
              .or(`title.ilike.%${cleanTerm}%`)
              .limit(20)

            if (related) {
              sidebarGames = [...related]
              related.forEach(g => excludedIds.add(g.id))
            }
          }
        }
      }

      // 2. Fill the rest with other games if needed
      const targetCount = 40
      if (sidebarGames.length < targetCount) {
        const { data: filler } = await supabase
          .from('games')
          .select('*')
          .eq('is_active', true)
          .neq('id', id) // Basic exclusion
          .limit(100) // Fetch more to allow for randomization

        if (filler) {
          // Filter out games already added as "related"
          let newFiller = filler.filter(g => !excludedIds.has(g.id))
          
          // Shuffle the filler games
          for (let i = newFiller.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newFiller[i], newFiller[j]] = [newFiller[j], newFiller[i]];
          }

          sidebarGames = [...sidebarGames, ...newFiller].slice(0, targetCount)
        }
      }

      setRelatedGames(sidebarGames)
    } catch (error) {
      console.error('Error fetching game:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fullscreen functionality
  const toggleFullscreen = () => {
    const iframe = document.getElementById('game-iframe')
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen()
      } else if (iframe.mozRequestFullScreen) { // Firefox
        iframe.mozRequestFullScreen()
      } else if (iframe.webkitRequestFullscreen) { // Chrome, Safari, Opera
        iframe.webkitRequestFullscreen()
      } else if (iframe.msRequestFullscreen) { // IE/Edge
        iframe.msRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    const iframeEl = iframeRef.current
    if (!iframeEl) return

    const gradientValue = 'radial-gradient(circle at top, rgba(59,130,246,0.55), rgba(15,23,42,0.95))'
    const overlayId = 'letterbox-gradient-overlay'

    const applyGradient = () => {
      try {
        const doc = iframeEl.contentDocument || iframeEl.contentWindow?.document
        if (!doc) return
        const container =
          doc.getElementById('c2canvasdiv') ||
          doc.querySelector('#canvas') ||
          doc.body

        if (!container) return

        container.style.background = gradientValue
        container.style.position = container.style.position || 'relative'
        container.style.overflow = 'hidden'

        let overlay = doc.getElementById(overlayId)
        if (!overlay) {
          overlay = doc.createElement('div')
          overlay.id = overlayId
          container.prepend(overlay)
        }
        Object.assign(overlay.style, {
          position: 'absolute',
          inset: '0',
          pointerEvents: 'none',
          zIndex: '0',
          background: gradientValue,
          transition: 'background 0.35s ease'
        })

        container.querySelectorAll('canvas').forEach((canvasEl) => {
          canvasEl.style.background = 'transparent'
          canvasEl.style.position = 'relative'
          canvasEl.style.zIndex = '1'
        })

        const targets = [doc.documentElement, doc.body]
        targets.forEach((el) => {
          el.style.background = gradientValue
          el.style.backgroundColor = 'transparent'
        })
      } catch (err) {
        console.warn('Unable to style embedded game background:', err)
      }
    }

    iframeEl.addEventListener('load', applyGradient)
    const retryTimer = setInterval(applyGradient, 2000)

    return () => {
      iframeEl.removeEventListener('load', applyGradient)
      clearInterval(retryTimer)
    }
  }, [game])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-lg animate-pulse">Loading game...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-lg mb-4">Game not found</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 font-nunito">
      {/* Import Softer Font & Hide Scrollbar */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        .font-nunito {
          font-family: 'Nunito', sans-serif;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            {game.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Game Player */}
        <main className="flex-1 overflow-y-auto p-6 no-scrollbar flex flex-col items-center">
          <div className="w-full max-w-6xl">
            <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative aspect-video">
              <iframe
                ref={iframeRef}
                id="game-iframe"
                src={game.game_id}
                title={game.title}
                className="absolute top-0 left-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; ambient-light-sensor; autoplay; camera; encrypted-media; fullscreen; gamepad *; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; speaker-selection; usb; web-share; xr-spatial-tracking"
                allowFullScreen
              />
            </div>

            <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{game.title}</h2>
                {game.category && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm font-semibold rounded-full border border-blue-500/20">
                    {game.category}
                  </span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">{game.description}</p>
            </div>
          </div>
        </main>

        {/* Right Side: Related Games Sidebar */}
        <aside className="w-80 lg:w-96 bg-slate-950/30 border-l border-white/5 overflow-y-auto no-scrollbar p-4 hidden md:block">
          <h3 className="text-lg font-bold text-slate-200 mb-4 px-2">More Games</h3>
          <div className="grid grid-cols-2 gap-3">
            {relatedGames.map((relatedGame) => (
              <GameCard key={relatedGame.id} game={relatedGame} />
            ))}
          </div>
        </aside>

      </div>
    </div>
  )
}
