'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import GameCard from '@/components/GameCard'

export default function Home() {
  const [games, setGames] = useState([])
  const [filteredGames, setFilteredGames] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  // Emoji mapping for categories
  const categoryEmojis = {
    "All": "🎮",
    "Action": "⚔️",
    "Adventure": "🗺️",
    "Puzzle": "🧩",
    "Strategy": "♟️",
    "Racing": "🏎️",
    "Sports": "⚽",
    "Arcade": "🕹️",
    "Shooter": "🔫",
    "RPG": "🛡️",
    "Simulation": "🏙️",
    "Casual": "☕",
    "Board": "🎲",
    "Card": "🃏"
  }

  // Fetch games from Supabase
  useEffect(() => {
    fetchGames()
  }, [])

  async function fetchGames() {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (error) throw error

      setGames(data || [])
      setFilteredGames(data || [])
      
      // Extract unique categories
      const uniqueCategories = ['All', ...new Set(data?.map(game => game.category).filter(Boolean))]
      setCategories(uniqueCategories)
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching games:', error)
      setLoading(false)
    }
  }

  // Filter games by category
  const filterByCategory = (category) => {
    setSelectedCategory(category)
    if (category === 'All') {
      setFilteredGames(games)
    } else {
      setFilteredGames(games.filter(game => game.category === category))
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 font-nunito">
      {/* Import Softer Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        .font-nunito {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>

      {/* Top Header - Full Width */}
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo Area */}
          <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            GameSite
          </h1>
        </div>

        {/* Right Side Header Items (Placeholder for search/profile) */}
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
             U
           </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar below Header */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-52 lg:w-60 opacity-100' : 'w-0 opacity-0'
          } bg-slate-950/40 border-r border-white/5 overflow-hidden flex flex-col`}
        >
          <div className="p-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Library</h2>
            </div>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category}>
                  <button
                    onClick={() => filterByCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-3 ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{categoryEmojis[category] || '🎮'}</span>
                    <span>{category}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Games Grid Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 font-semibold animate-pulse">Loading library...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400 font-semibold">No games found</p>
            </div>
          ) : (
            // Updated Grid: More columns = Smaller cards
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  )
}
