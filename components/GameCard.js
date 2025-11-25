// components/GameCard.js
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

function extractGameMonetizeId(gameUrl) {
  if (!gameUrl) return null;
  try {
    const url = new URL(gameUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    console.log(gameUrl);
    return parts[0] || null;
  } catch {
    console.log(gameUrl);
    return null;
  }
}

const GameVideo = ({ gameId, containerId }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(e => console.log('Autoplay prevented:', e));
      video.muted = true;
    }
  }, [gameId]);

  const videoSrc = `https://gamemonetize.video/video/${gameId}.mp4`;

  return (
    <div 
      id={containerId} 
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <video 
        ref={videoRef}
        id={`${containerId}-video`}
        src={videoSrc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '15px',
          display: 'block',
          objectFit: 'cover', // Ensures video covers like the thumbnail
          transform: 'scale(1.7)', // Added to zoom in slightly for closer-up effect
        }}
        muted
        playsInline
        preload="metadata"
      />
    </div>
  );
};

export default function GameCard({ game }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimeoutRef = useRef(null);
  
  const walkthroughId = extractGameMonetizeId(game.game_id);
  const containerId = `gamemonetize-video-${game.id}`;

  const handleClick = (e) => {
    router.push(`/game/${game.id}`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Delay video load slightly to avoid loading on quick hovers
    hoverTimeoutRef.current = setTimeout(() => setShowVideo(true), 200);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowVideo(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Generate thumbnail URL from gameid (GameMonetize pattern)
  const gameId = extractGameMonetizeId(game.game_id);
  const thumbnailUrl = gameId ? `https://img.gamemonetize.com/${gameId}/512x384.jpg` : null;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full cursor-pointer group"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/20 shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-blue-500/20 group-hover:border-blue-500/50">
        
        {/* Thumbnail - always visible as base layer */}
        <img 
          src={thumbnailUrl || '/placeholder-game-thumbnail.jpg'} 
          alt={game.title}
          className="w-full h-full object-cover z-10"
        />
        
        {/* Video overlay on hover - covers thumbnail */}
        {isHovered && showVideo && walkthroughId && (
          <div 
            className="video-overlay absolute inset-0 z-20"
          >
            
            {/* Video container */}
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3">
              <div className="w-full h-full max-h-full">
                <GameVideo gameId={walkthroughId} containerId={containerId} />
              </div>
            </div>
          </div>
        )}

        {/* Title strip - always on top */}
        <div className="absolute inset-x-0 bottom-0 h-13 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent flex items-end opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
          <div className="w-full p-3 pb-2.5">
            <p className="text-xs font-bold text-slate-100 leading-tight line-clamp-2 drop-shadow-sm group-hover:text-white">
              {game.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
