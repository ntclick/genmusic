'use client'

import React, { useCallback, useEffect } from 'react' // Import useEffect
import Link from 'next/link'
import { useRouter } from 'next/navigation' // ✅ NEW: Import useRouter
import { Play, Pause, Download, Scissors } from 'lucide-react' // ✅ NEW: Import Lucide React components
// Removed Play, Pause, Download, Heart, Share, Loader2 from lucide-react as they will be rendered via i data-lucide
// import Image from 'next/image' // Removed as artwork is not explicitly in track-item HTML

interface Ringtone {
  ringtone_id: number
  title: string
  slug: string
  artist: string
  description: string | null // ✅ FIXED: Allow null
  duration_seconds: number
  file_url_mp3: string | null // ✅ FIXED: Allow null
  file_url_m4r: string | null // ✅ FIXED: Allow null
  artwork_url: string | null // ✅ FIXED: Allow null
  play_count: number
  download_count: number
  like_count: number
  created_at: string
  categories?: {
    category_name: string
    category_slug: string
  }[] // Changed to array to match API responses
}

interface RingtoneListItemProps {
  ringtone: Ringtone
  rank: number // ✅ NEW: rank prop
  isPlaying: boolean // Changed from currentPlaying: string | null
  hasAudioFile?: boolean // ✅ NEW: indicates if track has audio file
  onPlay: (trackId: string, title: string, artist: string, url_mp3: string | null, artwork_url: string | null) => void // ✅ FIXED: Allow null for url_mp3 and artwork_url
  onLike: (ringtoneId: string) => void
  onDownload: (ringtoneId: string, title: string, ringtone: Ringtone) => void
}

export function RingtoneListItem({ ringtone, rank, isPlaying, hasAudioFile = true, onPlay, onLike, onDownload }: RingtoneListItemProps) {
  const router = useRouter() // ✅ NEW: Initialize useRouter
  const trackIdStr = ringtone.ringtone_id.toString()
  const formattedDuration = `${Math.floor(ringtone.duration_seconds / 60)}:${(ringtone.duration_seconds % 60).toString().padStart(2, '0')}`
  const formattedPlayCount = ringtone.play_count >= 1000 ? `${(ringtone.play_count / 1000).toFixed(0)}k` : ringtone.play_count.toString()

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering parent Link
    onPlay(trackIdStr, ringtone.title, ringtone.artist, ringtone.file_url_mp3, ringtone.artwork_url)
  }, [onPlay, trackIdStr, ringtone])

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(trackIdStr)
  }, [onLike, trackIdStr])

  const handleDownloadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload(trackIdStr, ringtone.title, ringtone)
  }, [onDownload, trackIdStr, ringtone]);

  // Removed useEffect for lucide.createIcons() as we are now using lucide-react components

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    router.push(`/ringtone/${ringtone.slug}`)
  }, [router, ringtone.slug])

  return (
    // ✅ THAY THẾ <Link> ngoài cùng bằng <div>
    <div 
        className={`track-item bg-bg-panel p-3 md:p-4 rounded-xl border border-white/5 hover:border-brand-primary/40 transition flex items-center gap-3 md:gap-5 cursor-pointer group touch-target ${isPlaying ? 'playing-card' : ''}`}
        onClick={handleItemClick} // ✅ NEW: Add click handler for item navigation
    >
        
        {/* Rank Number */}
        <span className={`rank-number text-brand-text font-extrabold text-sm w-4 text-center ${isPlaying ? 'playing-card' : ''}`}>{rank}</span>

        {/* Play Button (Left) */}
              <button
                className={`play-trigger w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-white transition shadow-lg ${
                  !hasAudioFile
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-white/5 group-hover:bg-brand-primary active:scale-95'
                }`}
                onClick={handlePlayClick}
                disabled={!hasAudioFile}
                aria-label={
                  !hasAudioFile
                    ? 'No audio file available'
                    : isPlaying
                    ? `Pause ${ringtone.title}`
                    : `Play ${ringtone.title}`
                }
              >
                {!hasAudioFile ? (
                  <span className="text-xs">⚠️</span>
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current icon-state" />
                ) : (
                  <Play className="w-4 h-4 fill-current icon-state ml-0.5" />
                )} {/* Replaced i data-lucide */}
              </button>
        
        {/* Track Info (Middle) */}
        {/* ✅ REMOVED <Link> from here, now it's just a div */}
        <div className="flex-grow min-w-0 group-hover:opacity-80 transition hover:text-brand-primary">
            <h3 className="font-bold text-white text-sm md:text-base truncate">{ringtone.title}</h3>
            <p className="text-xs text-brand-muted">{ringtone.artist} • {formattedDuration} • {ringtone.categories?.[0]?.category_name || 'Ringtone'}</p>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 action-btn">
            {/* Link to maker page remains a Link */}
            <Link href={`/maker?id=${ringtone.ringtone_id}`} className="p-2 text-brand-muted hover:text-brand-primary hover:bg-white/10 rounded-full transition active:scale-95" title="Cut/Edit" onClick={e => e.stopPropagation()}> {/* ✅ Stop propagation */}
                <Scissors className="w-4 h-4" /> {/* Replaced i data-lucide="scissors" */}
            </Link>
            <button 
                className="download-trigger p-2 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg transition active:scale-95"
                onClick={handleDownloadClick}
                aria-label={`Download ${ringtone.title}`}
            >
                <Download className="w-4 h-4" /> {/* Replaced i data-lucide="download" */}
            </button>
        </div>
    </div>
  )
}
