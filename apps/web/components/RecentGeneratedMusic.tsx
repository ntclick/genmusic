'use client'

import { useEffect, useState } from 'react'
import MusicTrackCard from './MusicTrackCard'

const DEFAULT_FEATURED_TRACKS = [
  {
    id: 'song-demo-1',
    title: 'Cyberpunk Synthwave Beat',
    prompt: 'futuristic synthwave 80s neon vibe, energetic drum synth',
    genre: 'synthwave',
    audio_url: 'https://api.shelbynet.shelby.xyz/shelby/v1/blobs/0xdf66cf59a7d7bd10a9904518d17880226d03c66894c26bebaf1c35b0ba0c2757/phonezoo/ringtones/ai-generated/song-1786079361565.wav',
    artwork_url: 'https://images.pexels.com/photos/18076564/pexels-photo-18076564.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    duration_seconds: 10,
    has_vocals: false,
    plays: 124,
    move_tx_hash: '0x059f3d5237b9e602a2e7e3b1809b40cd47409863ea8894796bbc8648c11ad9d1',
  },
  {
    id: 'song-demo-2',
    title: 'EDM Festival Bounce Drop',
    prompt: 'High-energy EDM festival drop, heavy punchy sub bass',
    genre: 'edm',
    audio_url: 'https://api.shelbynet.shelby.xyz/shelby/v1/blobs/0xdf66cf59a7d7bd10a9904518d17880226d03c66894c26bebaf1c35b0ba0c2757/phonezoo/ringtones/ai-generated/song-1786093519346.wav',
    artwork_url: 'https://images.pexels.com/photos/38649600/pexels-photo-38649600.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    duration_seconds: 10,
    has_vocals: false,
    plays: 89,
    move_tx_hash: '0x2e07b92a35271c48f6e805a081bcbff8937cdad3ca7bcb91f2a9bbe9c8f07f81',
  },
]

export default function RecentGeneratedMusic({ initialTracks }: { initialTracks: any[] }) {
  const [tracks, setTracks] = useState<any[]>(() => {
    return initialTracks && initialTracks.length > 0 ? initialTracks : DEFAULT_FEATURED_TRACKS
  })

  useEffect(() => {
    const loadTracks = () => {
      try {
        const keys = ['phonezoo_unified_history', 'phonezoo_music_generations', 'phonezoo_history']
        let localTracks: any[] = []

        for (const k of keys) {
          const saved = localStorage.getItem(k)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed) && parsed.length > 0) {
              localTracks = parsed
              break
            }
          }
        }

        const formattedLocal = localTracks.map((t: any) => ({
          id: t.id || `loc-${Math.random()}`,
          title: t.prompt?.slice(0, 50) || t.title || 'AI Generated Track',
          prompt: t.prompt || t.title,
          genre: t.genre || 'synthwave',
          audio_url: t.url || t.audio_url || t.file_url_mp3,
          artwork_url: t.coverUrl || t.artwork_url,
          duration_seconds: t.duration || t.duration_seconds || 10,
          has_vocals: false,
          plays: 1,
          move_tx_hash: t.txHash || t.move_tx_hash,
        })).filter((t) => !!t.audio_url)

        const baseList = initialTracks && initialTracks.length > 0 ? initialTracks : DEFAULT_FEATURED_TRACKS
        const existingIds = new Set(formattedLocal.map((t) => t.id.toString()))
        const combined = [
          ...formattedLocal,
          ...baseList.filter((t: any) => !existingIds.has(t.id?.toString())),
        ]

        if (combined.length > 0) {
          setTracks(combined.slice(0, 12))
        }
      } catch (e) {
        console.warn('[RecentGeneratedMusic] load error:', e)
      }
    }

    loadTracks()
    window.addEventListener('storage', loadTracks)
    return () => window.removeEventListener('storage', loadTracks)
  }, [initialTracks])

  if (!tracks || tracks.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {tracks.map((track: any) => (
        <MusicTrackCard key={track.id} track={track} />
      ))}
    </div>
  )
}
