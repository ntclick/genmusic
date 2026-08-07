'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Download, Bookmark, RefreshCw, ExternalLink, Check, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react'
import MusicAudioPlayer from './MusicAudioPlayer'
import type { MusicGeneration } from '@/types/music'
import type { GenreContent } from '@/lib/music-genre-content'

interface Props {
  track: MusicGeneration
  genreContent: GenreContent | null
  creator?: { name: string; avatar_url: string | null; uid: string } | null
}

const GENRE_FALLBACK_COLORS: Record<string, string> = {
  pop: 'from-pink-400 to-orange-400',
  rock: 'from-red-600 to-gray-900',
  edm: 'from-blue-500 to-purple-600',
  hiphop: 'from-gray-800 to-yellow-600',
  lofi: 'from-amber-700 to-teal-600',
  classical: 'from-indigo-500 to-pink-300',
  jazz: 'from-yellow-600 to-orange-800',
  ambient: 'from-teal-400 to-indigo-600',
  funk: 'from-purple-500 to-yellow-400',
  kpop: 'from-pink-400 to-blue-400',
  rnb: 'from-purple-600 to-pink-500',
  latin: 'from-green-400 to-yellow-500',
}

function formatLyrics(lyrics: string) {
  if (!lyrics) return null
  return lyrics.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) return <br key={i} />
    if (/^\[.+\]$/.test(trimmed)) {
      return (
        <p key={i} className="text-sm font-semibold text-orange-400 mt-6 mb-2 tracking-wide uppercase">
          {trimmed}
        </p>
      )
    }
    return (
      <p key={i} className="text-gray-300 leading-relaxed">
        {trimmed}
      </p>
    )
  })
}

export default function MusicTrackDetailClient({ track, genreContent, creator }: Props) {
  const [copied, setCopied] = useState(false)
  const [likeCount, setLikeCount] = useState(track.like_count || 0)
  const [dislikeCount, setDislikeCount] = useState(track.dislike_count || 0)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(`music_vote_${track.id}`)
    return stored as 'like' | 'dislike' | null
  })

  const handleVote = async (vote: 'like' | 'dislike') => {
    const prevVote = userVote

    // Toggle off if same vote
    if (prevVote === vote) {
      setUserVote(null)
      localStorage.removeItem(`music_vote_${track.id}`)
      if (vote === 'like') setLikeCount(c => Math.max(0, c - 1))
      else setDislikeCount(c => Math.max(0, c - 1))

      fetch(`/api/music/like/${track.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: vote === 'like' ? 'remove_like' : 'remove_dislike' }),
      }).catch(() => {})
      return
    }

    // Switch vote or new vote
    setUserVote(vote)
    localStorage.setItem(`music_vote_${track.id}`, vote)

    if (vote === 'like') {
      setLikeCount(c => c + 1)
      if (prevVote === 'dislike') setDislikeCount(c => Math.max(0, c - 1))
    } else {
      setDislikeCount(c => c + 1)
      if (prevVote === 'like') setLikeCount(c => Math.max(0, c - 1))
    }

    // Remove old vote + add new
    if (prevVote) {
      fetch(`/api/music/like/${track.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: prevVote === 'like' ? 'remove_like' : 'remove_dislike' }),
      }).catch(() => {})
    }
    fetch(`/api/music/like/${track.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: vote }),
    }).catch(() => {})
  }

  const title = track.title || 'AI Generated Track'
  const genreName = genreContent?.name || track.genre
  const fallbackGradient = GENRE_FALLBACK_COLORS[track.genre] || 'from-gray-600 to-gray-800'

  const handleShare = async () => {
    const url = `https://phonezoo.com/music/${track.slug || track.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen text-white pb-20">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <ChevronRight size={12} />
          <Link href="/music/explore" className="hover:text-white transition">Music Library</Link>
          <ChevronRight size={12} />
          {genreContent && (
            <>
              <Link href={`/music/explore?genre=${track.genre}`} className="hover:text-white transition">
                {genreContent.name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-brand-orange font-bold truncate max-w-[200px]">{title}</span>
        </nav>

        {/* Two-column layout: artwork + info */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {/* Artwork */}
          <div className="w-full sm:w-64 flex-shrink-0">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              {track.artwork_url ? (
                <Image
                  src={track.artwork_url}
                  alt={title}
                  width={480}
                  height={480}
                  className="w-full h-full object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
                  <span className="text-6xl opacity-60">{genreContent?.icon || '🎵'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                {title}
              </h1>

              {track.prompt && (
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  {track.prompt}
                </p>
              )}
            </div>

            {/* Artist + date */}
            <div className="flex items-center gap-3 mt-2">
              {creator ? (
                <>
                  <Link href={`/profile/${creator.uid}`}>
                    <img
                      src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(creator.uid)}`}
                      alt={creator.name}
                      className="w-8 h-8 rounded-full bg-gray-700 object-cover hover:ring-2 hover:ring-brand-orange transition"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div>
                    <Link href={`/profile/${creator.uid}`} className="text-sm font-medium text-white hover:text-brand-orange transition">
                      {creator.name}
                    </Link>
                    <p className="text-xs text-gray-400">{formatDate(track.created_at)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                    ?
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Anonymous</p>
                    <p className="text-xs text-gray-500">{formatDate(track.created_at)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Like / Dislike */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => handleVote('like')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition text-sm font-medium ${
              userVote === 'like'
                ? 'bg-green-500/15 border-green-500/50 text-green-400'
                : 'bg-[#0f172a] border-gray-800 text-gray-300 hover:text-white hover:border-gray-600'
            }`}>
            <ThumbsUp size={16} fill={userVote === 'like' ? 'currentColor' : 'none'} />
            {likeCount > 0 && <span>{likeCount.toLocaleString()}</span>}
          </button>
          <button
            onClick={() => handleVote('dislike')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition text-sm font-medium ${
              userVote === 'dislike'
                ? 'bg-red-500/15 border-red-500/50 text-red-400'
                : 'bg-[#0f172a] border-gray-800 text-gray-300 hover:text-white hover:border-gray-600'
            }`}>
            <ThumbsDown size={16} fill={userVote === 'dislike' ? 'currentColor' : 'none'} />
            {dislikeCount > 0 && <span>{dislikeCount.toLocaleString()}</span>}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {track.audio_url && (
            <a href={track.audio_url} download={`PhoneZoo_${track.slug || track.id}.mp3`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 transition text-sm">
              <Download size={16} /> Download
            </a>
          )}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 transition text-sm">
            <Bookmark size={16} /> Bookmark
          </button>
          <Link href={`/music?genre=${track.genre}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 transition text-sm">
            <RefreshCw size={16} /> Create Similar
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-600 transition text-sm">
            {copied ? <><Check size={16} className="text-green-400" /> Copied!</> : <><ExternalLink size={16} /> Share</>}
          </button>
        </div>

        {/* Lyrics */}
        {track.lyrics && (
          <div className="mb-10">
            {formatLyrics(track.lyrics)}
          </div>
        )}

        {/* Genre info */}
        {genreContent && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 mb-10">
            <span><span className="text-gray-300">Genre:</span> {genreContent.name}</span>
            <span><span className="text-gray-300">Tempo:</span> {genreContent.tempoRange}</span>
            <span><span className="text-gray-300">Mood:</span> {genreContent.moodKeywords.slice(0, 3).join(', ')}</span>
            <span><span className="text-gray-300">Instruments:</span> {genreContent.instruments.slice(0, 3).join(', ')}</span>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Create Your Own AI Music</h2>
          <p className="text-gray-400 text-sm mb-4">Describe the music you want, choose a genre, and let AI compose it for you.</p>
          <Link href="/music"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-brand-orangeHover text-white rounded-xl font-semibold transition text-sm shadow-lg shadow-orange-500/20">
            Start Creating
          </Link>
        </div>
      </main>

      {/* Player — sticky bottom */}
      {track.audio_url && (
        <div className="sticky bottom-16 z-30 max-w-2xl mx-auto px-4 py-4 bg-[#020617]/95 backdrop-blur-md border-t border-gray-800">
          <MusicAudioPlayer src={track.audio_url} />
        </div>
      )}
    </div>
  )
}
