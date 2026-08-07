'use client'

import { useRef, useState, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

interface MusicAudioPlayerProps {
  src: string
  title?: string
  onPrev?: () => void
  onNext?: () => void
}

export default function MusicAudioPlayer({ src, title, onPrev, onNext }: MusicAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = async () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); return }
    try { await audioRef.current.play(); setIsPlaying(true) } catch { setIsPlaying(false) }
  }

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * duration
    setCurrentTime(ratio * duration)
  }, [duration])

  const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full">
      {/* Controls: prev / play / next */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <button
          onClick={onPrev}
          className="text-gray-400 hover:text-white transition disabled:opacity-30"
          disabled={!onPrev}
          aria-label="Previous">
          <SkipBack size={24} fill="currentColor" />
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-brand-orange flex items-center justify-center text-white hover:bg-brand-orangeHover transition shadow-lg shadow-orange-500/20"
          aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying
            ? <Pause size={22} fill="currentColor" />
            : <Play size={22} fill="currentColor" className="ml-0.5" />
          }
        </button>

        <button
          onClick={onNext}
          className="text-gray-400 hover:text-white transition disabled:opacity-30"
          disabled={!onNext}
          aria-label="Next">
          <SkipForward size={24} fill="currentColor" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 font-mono w-10 text-right select-none">
          {formatTime(currentTime)}
        </span>

        <div
          ref={progressRef}
          onClick={handleSeek}
          className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer relative group"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}>
          <div
            className="absolute inset-y-0 left-0 bg-brand-orange rounded-full transition-all"
            style={{ width: `${progress}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition"
            style={{ left: `calc(${progress}% - 6px)` }} />
        </div>

        <span className="text-xs text-gray-400 font-mono w-10 select-none">
          {formatTime(duration)}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
        }}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
    </div>
  )
}
