'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPanel() {
  const [formData, setFormData] = useState({
    game_id: '',
    title: '',
    description: '',
    thumbnail_url: '',
    category: '',
    order_index: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

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
      const { data, error } = await supabase
        .from('games')
        .insert([{
          game_id: formData.game_id,
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
        game_id: '',
        title: '',
        description: '',
        thumbnail_url: '',
        category: '',
        order_index: 0
      })
    } catch (error) {
      console.error('Error adding game:', error)
      setMessage({ type: 'error', text: 'Error adding game. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Add new games to your website</p>
          <a 
            href="/" 
            className="inline-block mt-4 text-blue-600 hover:text-blue-800 transition"
          >
            ← Back to Home
          </a>
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
            {/* Game ID from GameMonetize */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GameMonetize Game ID *
              </label>
              <input
                type="text"
                name="game_id"
                value={formData.game_id}
                onChange={handleChange}
                required
                placeholder="e.g., 12345-game-slug"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="mt-1 text-xs text-gray-500">
                Find this in the GameMonetize iframe URL
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
          <h3 className="font-bold text-blue-900 mb-2">How to find GameMonetize Game ID:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Go to <a href="https://gamemonetize.com" target="_blank" className="underline">GameMonetize.com</a></li>
            <li>Browse their game library and select a game</li>
            <li>Look for the iframe embed code</li>
            <li>Copy the game ID from the URL (the part after gamemonetize.com/)</li>
            <li>Paste it in the "Game ID" field above</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
