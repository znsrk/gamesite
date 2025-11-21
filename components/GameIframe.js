'use client'

import { useEffect } from 'react'

export default function GameIframe({ gameId, title, onClose }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold z-10"
        aria-label="Close game"
      >
        ×
      </button>

      {/* Game iframe */}
      <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
        <iframe
          src={`https://gamemonetize.com/${gameId}/`}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="gamepad; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  )
}
