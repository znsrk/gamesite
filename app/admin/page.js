'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
export default function AdminPanel() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    iframe_code: '',
    title: '',
    description: '',
    thumbnail_url: '',
    category: '',
    order_index: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Extract game URL from iframe code
  const extractGameUrl = (iframeCode) => {
    try {
      // Match src="..." or src='...' in iframe
      const srcMatch = iframeCode.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        return srcMatch[1]
      }
      return null
    } catch (error) {
      console.error('Error extracting URL:', error)
      return null
    }
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Submit form to add game to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Extract the full game URL from iframe code
      const gameUrl = extractGameUrl(formData.iframe_code)
      
      if (!gameUrl) {
        throw new Error('Could not extract game URL from iframe code. Please check the format.')
      }

      const { data, error } = await supabase
        .from('games')
        .insert([{
          game_id: gameUrl, // Store the full URL instead of just ID
          title: formData.title,
          description: formData.description,
          thumbnail_url: formData.thumbnail_url,
          category: formData.category,
          order_index: parseInt(formData.order_index),
          is_active: true
        }])

      if (error) throw error

      setMessage({ type: 'success', text: 'Game added successfully!' })
      
      // Reset form
      setFormData({
        iframe_code: '',
        title: '',
        description: '',
        thumbnail_url: '',
        category: '',
        order_index: 0
      })
    } catch (error) {
      console.error('Error adding game:', error)
      setMessage({ type: 'error', text: error.message || 'Error adding game. Please try again.' })
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Add new games to your website</p>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Game</h2>
          
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
            {/* Iframe Code - NEW FIELD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GameMonetize Iframe Code *
              </label>
              <textarea
                name="iframe_code"
                value={formData.iframe_code}
                onChange={handleChange}
                required
                rows="4"
                placeholder='<iframe src="https://html5.gamemonetize.co/ruobz36yp9vi68oj2s6xj1efn2sjds1r/" width="854" height="480" scrolling="none" frameborder="0"></iframe>'
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Paste the entire iframe code from GameMonetize
              </p>
            </div>

            {/* Game Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Super Racing Game"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of the game..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image URL *
              </label>
              <input
                type="url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                required
                placeholder="https://example.com/game-thumbnail.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Action, Puzzle, Racing"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Order Index */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                name="order_index"
                value={formData.order_index}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="mt-1 text-xs text-gray-500">
                Lower numbers appear first
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Game...' : 'Add Game'}
            </button>
          </form>
        </div>

        {/* Instructions Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">How to add a game:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Go to <a href="https://gamemonetize.com" target="_blank" className="underline">GameMonetize.com</a></li>
            <li>Browse and select a game</li>
            <li>Copy the entire <strong>&lt;iframe&gt;</strong> embed code</li>
            <li>Paste it in the "Iframe Code" field above</li>
            <li>Fill in the other details and click "Add Game"</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
