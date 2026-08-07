'use client'

import { useEffect, useState } from 'react'
import MusicTrackDetailClient from './MusicTrackDetailClient'
import type { MusicGeneration } from '@/types/music'

import { getGenreContent } from '@/lib/music-genre-content'

export default function MusicTrackDetailClientWrapper({
  initialTrack,
  slug,
}: {
  initialTrack: MusicGeneration | null
  slug: string
}) {
  const [track, setTrack] = useState<MusicGeneration | null>(initialTrack)
  const [loading, setLoading] = useState(!initialTrack)

  useEffect(() => {
    if (initialTrack) return

    try {
      const keys = ['phonezoo_unified_history', 'phonezoo_music_generations', 'phonezoo_history']
      for (const k of keys) {
        const saved = localStorage.getItem(k)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            const found = parsed.find(
              (t: any) => t.id === slug || t.slug === slug || t.id?.toString() === slug
            )
            if (found) {
              const formatted: MusicGeneration = {
                id: found.id,
                prompt: found.prompt || found.title || 'AI Generated Track',
                title: found.title || found.prompt?.slice(0, 50) || 'AI Generated Track',
                genre: found.genre || 'synthwave',
                duration_seconds: found.duration || found.duration_seconds || 10,
                audio_url: found.url || found.audio_url,
                artwork_url: found.coverUrl || found.artwork_url,
                status: 'completed',
                is_public: true,
                has_vocals: false,
                created_at: found.createdAt || new Date().toISOString(),
                slug: found.slug || slug,
              } as any
              setTrack(formatted)
              break
            }
          }
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [initialTrack, slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-bold text-sm">
        Loading track...
      </div>
    )
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold text-orange-400 mb-2">404</h1>
        <h2 className="text-xl font-bold mb-3">Music Track Not Found</h2>
        <p className="text-gray-400 text-sm max-w-md mb-6">
          The requested music track does not exist or was removed.
        </p>
        <a
          href="/music"
          className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white text-sm transition"
        >
          Back to Studio
        </a>
      </div>
    )
  }

  return (
    <MusicTrackDetailClient
      track={track}
      genreContent={getGenreContent(track.genre)}
      creator={null}
    />
  )
}
