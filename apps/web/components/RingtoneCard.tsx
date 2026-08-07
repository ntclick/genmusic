'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Play, Pause, Download, Heart, Share2, ShieldCheck, Music } from 'lucide-react'
import { getAudioUrl, generateSlug } from '@/lib/database'
import { useAudio } from '@/contexts/AudioContext'

interface RingtoneCardProps {
  ringtone: any
  onPlay?: (ringtoneId: string) => void
  onLike?: (ringtoneId: string) => void
  onDownload?: (ringtoneId: string, title: string, ringtone: any) => void
}

export function RingtoneCard({
  ringtone,
  onPlay,
  onLike,
  onDownload
}: RingtoneCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio()

  const trackId = (ringtone.id || ringtone.ringtone_id || '').toString()
  const title = ringtone.title || ringtone.prompt || 'AI Ringtone'
  const isPlayingCard = currentTrack?.id?.toString() === trackId && isPlaying
  const duration = ringtone.duration_seconds || 30
  const genre = ringtone.genre || 'Ringtone'

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (currentTrack?.id?.toString() === trackId) {
      togglePlay()
      return
    }

    let audioUrl = ringtone.audio_url || ringtone.file_url_mp3
    if (!audioUrl && typeof getAudioUrl === 'function') {
      audioUrl = await getAudioUrl(ringtone)
    }

    playTrack({
      id: trackId,
      title: title,
      artist: `AI Ringtone (${genre})`,
      url_mp3: audioUrl || undefined,
      artwork_url: null
    })
    onPlay?.(trackId)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDownloading) return

    setIsDownloading(true)
    try {
      if (onDownload) {
        onDownload(trackId, title, ringtone)
      } else if (ringtone.audio_url || ringtone.file_url_mp3) {
        const url = ringtone.audio_url || ringtone.file_url_mp3
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mp3`
        a.click()
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLiked(!isLiked)
    onLike?.(trackId)
  }

  return (
    <div
      className={`group relative bg-[#0f172a]/90 border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
        isPlayingCard
          ? 'border-orange-500 shadow-xl shadow-orange-500/15 ring-2 ring-orange-500/30'
          : 'border-white/10 hover:border-white/25 hover:shadow-xl hover:shadow-orange-500/10'
      }`}
    >
      {/* Cover / Visual Banner */}
      <div className="h-32 relative bg-gradient-to-br from-orange-500/80 via-amber-600 to-purple-800 flex items-center justify-center p-4">
        <span className="text-4xl opacity-40 group-hover:scale-110 group-hover:opacity-70 transition-all duration-300">
          🔔
        </span>

        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
          isPlayingCard ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={handlePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all"
            aria-label={isPlayingCard ? 'Pause ringtone' : 'Play ringtone'}
          >
            {isPlayingCard ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Badges */}
        <a
          href="https://explorer.shelby.xyz/shelbynet/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 left-2.5 bg-emerald-500/90 hover:bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 backdrop-blur-sm z-10 transition"
        >
          <ShieldCheck className="w-3 h-3" /> ShelbyNet
        </a>

        <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-gray-200 text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-sm">
          0:{duration}s
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col justify-between">
        <Link href={`/ringtone/${ringtone.slug || generateSlug(title)}`}>
          <h3 className="font-bold text-white text-sm truncate group-hover:text-orange-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
            {ringtone.prompt || `Genre: ${genre}`}
          </p>
        </Link>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="text-[11px] font-semibold text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded capitalize">
            {genre}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={handleLike}
              className={`p-1.5 rounded-lg transition-colors ${
                isLiked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-white/5'
              }`}
              title="Like"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="Download MP3"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
