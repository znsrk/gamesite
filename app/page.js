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
    <div className="flex h-screen bg-gray-100">
      {/* Retractable Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Categories</h2>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <button
                  onClick={() => filterByCategory(category)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex items-center gap-4">
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo and Site Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">GameSite</h1>
          </div>
        </header>

        {/* Games Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Loading games...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">No games available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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

