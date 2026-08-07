'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Play, Pause, Download, Headphones, Sparkles, ShieldCheck } from 'lucide-react'
import type { MusicGeneration } from '@/types/music'
import { useAudio } from '@/contexts/AudioContext'

const GENRE_GRADIENTS: Record<string, string> = {
  pop: 'from-pink-500 via-rose-500 to-orange-500',
  rock: 'from-red-600 via-orange-600 to-amber-700',
  edm: 'from-cyan-500 via-blue-600 to-purple-600',
  hiphop: 'from-amber-600 via-orange-600 to-gray-900',
  lofi: 'from-teal-600 via-emerald-600 to-indigo-700',
  classical: 'from-indigo-600 via-purple-600 to-pink-500',
  jazz: 'from-amber-500 via-yellow-600 to-amber-800',
  ambient: 'from-cyan-600 via-teal-700 to-indigo-800',
  funk: 'from-purple-600 via-pink-500 to-yellow-500',
  kpop: 'from-pink-500 via-purple-500 to-cyan-400',
  rnb: 'from-purple-700 via-pink-600 to-indigo-600',
  latin: 'from-emerald-500 via-yellow-500 to-orange-600',
}

const GENRE_ICONS: Record<string, string> = {
  pop: '🎵', rock: '🎸', edm: '⚡', hiphop: '🎤', lofi: '☕', classical: '🎻',
  jazz: '🎷', ambient: '🌙', funk: '🕺', kpop: '✨', rnb: '💜', latin: '🌴',
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:30'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function MusicTrackCard({ track }: { track: MusicGeneration }) {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio()

  const title = track.title || track.prompt.slice(0, 45) || 'AI Generated Track'
  const trackId = track.id?.toString() || ''
  const href = track.slug ? `/music/${track.slug}` : `/music/${trackId}`
  const gradient = GENRE_GRADIENTS[track.genre] || 'from-purple-600 via-pink-500 to-orange-500'
  const icon = GENRE_ICONS[track.genre] || '🎵'
  const isPlayingCurrent = currentTrack?.id?.toString() === trackId && isPlaying

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (currentTrack?.id?.toString() === trackId) {
      togglePlay()
    } else {
      playTrack({
        id: track.id,
        title: title,
        artist: `Genre: ${track.genre.toUpperCase()}`,
        url_mp3: track.audio_url || undefined,
        artwork_url: track.artwork_url || null,
      })
    }
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (track.audio_url) {
      const a = document.createElement('a')
      a.href = track.audio_url
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mp3`
      a.click()
    }
  }

  return (
    <div
      className={`group relative bg-[#0f172a]/90 border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
        isPlayingCurrent
          ? 'border-orange-500 shadow-xl shadow-orange-500/15 ring-2 ring-orange-500/30'
          : 'border-white/10 hover:border-white/25 hover:shadow-xl hover:shadow-purple-500/10'
      }`}
    >
      {/* Thumbnail & Cover */}
      <div className="aspect-square relative overflow-hidden bg-gray-900">
        {track.artwork_url ? (
          <Image
            src={track.artwork_url}
            alt={title}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            unoptimized
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 relative`}>
            <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <span className="text-xs font-bold text-white/90 uppercase tracking-widest mt-2 bg-black/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              {track.genre}
            </span>
          </div>
        )}

        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${
          isPlayingCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <button
            onClick={handlePlayClick}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all"
            aria-label={isPlayingCurrent ? 'Pause track' : 'Play track'}
          >
            {isPlayingCurrent ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-1" />
            )}
          </button>
        </div>

        {/* Animated equalizer bars when playing */}
        {isPlayingCurrent && (
          <div className="absolute bottom-3 left-3 flex items-end gap-1 h-4 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">
            <span className="w-1 bg-orange-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full"></span>
            <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-3"></span>
            <span className="w-1 bg-purple-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-full"></span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <a
            href="https://explorer.shelby.xyz/shelbynet/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-emerald-500/90 hover:bg-emerald-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 backdrop-blur-sm transition"
          >
            <ShieldCheck className="w-3 h-3" /> ShelbyNet
          </a>
        </div>

        {track.has_vocals && (
          <span className="absolute top-2.5 right-2.5 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 backdrop-blur-sm">
            <Sparkles className="w-2.5 h-2.5" /> Vocals
          </span>
        )}

        {/* Duration badge */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-gray-200 text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-sm">
          {formatDuration(track.duration_seconds)}
        </span>
      </div>

      {/* Info & Footer */}
      <div className="p-4 flex flex-col justify-between">
        <Link href={href} className="group/link">
          <h3 className="font-bold text-white text-sm truncate group-hover/link:text-orange-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
            {track.prompt || `Genre: ${track.genre}`}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded capitalize">
            {track.genre}
          </span>

          <div className="flex items-center gap-2">
            {(track.plays ?? 0) > 0 && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Headphones className="w-3 h-3 text-gray-500" /> {(track.plays ?? 0).toLocaleString()}
              </span>
            )}

            {track.audio_url && (
              <button
                onClick={handleDownloadClick}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="Download MP3"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
