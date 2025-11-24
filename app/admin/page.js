'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPanel() {
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    json_data: '',
    order_index: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [gamesPreview, setGamesPreview] = useState([])

  // Parse JSON data and extract games
  const parseGamesFromJson = (jsonString) => {
    try {
      const games = JSON.parse(jsonString)
      if (!Array.isArray(games)) {
        throw new Error('JSON must be an array of game objects')
      }
      return games.map(game => ({
        id: game.id,
        title: game.title,
        description: game.description,
        url: game.url,
        category: game.category
      }))
    } catch (error) {
      console.error('Error parsing JSON:', error)
      return []
    }
  }

  // Handle JSON input change and preview games
  const handleJsonChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, json_data: value }))
    
    // Preview games
    if (value.trim()) {
      const previewGames = parseGamesFromJson(value)
      setGamesPreview(previewGames)
    } else {
      setGamesPreview([])
    }
  }

  // Handle manual form changes (for order_index)
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Submit form to add all games from JSON to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const games = parseGamesFromJson(formData.json_data)
      if (games.length === 0) {
        throw new Error('No valid games found in JSON data')
      }

      // Prepare games for database - ONLY required fields
      const gamesToInsert = games.map((game, index) => ({
        game_id: game.url,        // REQUIRED
        title: game.title,        // REQUIRED
        description: game.description, // REQUIRED
        category: game.category   // REQUIRED
      }))

      const { data, error } = await supabase
        .from('games')
        .insert(gamesToInsert)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: `${games.length} game(s) added successfully!` 
      })
      
      // Reset form
      setFormData({ json_data: '', order_index: 0 })
      setGamesPreview([])

    } catch (error) {
      console.error('Error adding games:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error adding games. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Bulk import games from GameMonetize JSON</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Import Games</h2>

          {/* Success/Error Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* JSON Data Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GameMonetize JSON Data
              </label>
              <textarea
                name="json_data"
                value={formData.json_data}
                onChange={handleJsonChange}
                required
                rows={8}
                placeholder='Paste JSON array here:
[
  {
    "id": "100",
    "title": "Billiards City",
    "description": "Billiards City is online HTML5...",
    "url": "https://html5.gamemonetize.com/...",
    "category": "Sports"
  }
]'
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-vertical font-mono text-sm text-black"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only game_id (url), title, description, and category will be imported
              </p>
            </div>

            {/* Games Preview */}
            {gamesPreview.length > 0 && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">
                  Preview ({gamesPreview.length} game{gamesPreview.length > 1 ? 's' : ''}):
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                  {gamesPreview.map((game, index) => (
                    <div key={index} className="border rounded p-3 bg-white">
                      <div className="font-medium text-sm">{game.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{game.category}</div>
                      <div className="text-xs text-gray-500 truncate">{game.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || gamesPreview.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Importing...</span>
                </>
              ) : (
                <span>Import {gamesPreview.length || 0} Game{gamesPreview.length !== 1 ? 's' : ''}</span>
              )}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">How to get JSON data:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Go to <a href="https://gamemonetize.com" target="_blank" className="underline" rel="noopener noreferrer">GameMonetize.com</a></li>
            <li>Browse and select games you want to add</li>
            <li>Check if they provide JSON export/API or use browser dev tools to extract game data</li>
            <li>Paste the JSON array in the field above</li>
            <li>Click "Import Games" to add all games at once</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

