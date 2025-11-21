'use client'

import { useState } from 'react'
import GameIframe from './GameIframe'

export default function GameCard({ game }) {
  const [showGame, setShowGame] = useState(false)

  return (
    <>
      <div 
        onClick={() => setShowGame(true)}
        className="flex flex-col items-center cursor-pointer group"
      >
        {/* Rounded cube with game thumbnail */}
        <div className="w-full aspect-square bg-white rounded-2xl shadow-md overflow-hidden transform transition hover:scale-105 hover:shadow-xl">
          <img 
            src={game.thumbnail_url} 
            alt={game.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Game name below */}
        <p className="mt-2 text-sm font-medium text-gray-700 text-center line-clamp-2 group-hover:text-blue-600 transition">
          {game.title}
        </p>
      </div>

      {showGame && (
        <GameIframe 
          gameId={game.game_id} 
          title={game.title}
          onClose={() => setShowGame(false)} 
        />
      )}
    </>
  )
}
