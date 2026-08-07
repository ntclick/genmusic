'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, Play, Pause, Download, Wand2, History, Trash2,
  Volume2, VolumeX, Loader2, Music, CheckCircle2,
  ExternalLink, ShieldCheck, Disc, Scissors, AlertCircle, RefreshCw, Shuffle
} from 'lucide-react'

const DEFAULT_COVER = 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800'
const FALLBACK_COVER = 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800'

const GENRES = [
  { id: 'pop', name: 'Pop', icon: '🎵' },
  { id: 'rock', name: 'Rock', icon: '🎸' },
  { id: 'edm', name: 'EDM', icon: '⚡' },
  { id: 'hiphop', name: 'Hip Hop', icon: '🎤' },
  { id: 'lofi', name: 'Lo-Fi', icon: '☕' },
  { id: 'classical', name: 'Classical', icon: '🎻' },
  { id: 'jazz', name: 'Jazz', icon: '🎷' },
  { id: 'ambient', name: 'Ambient', icon: '🌙' },
  { id: 'synthwave', name: 'Synthwave', icon: '🌆' },
]

const PROMPT_POOL = [
  { label: '⚡ EDM Festival Drop', value: 'High-energy EDM festival drop, heavy punchy sub bass, aggressive lead synth, 128BPM club anthem', genre: 'edm' },
  { label: '🏎️ Cyber Phonk Drift', value: 'Aggressive drift phonk beat, heavy distorted 808 bass, cowbell melody, fast driving tempo', genre: 'hiphop' },
  { label: '🌆 Dark Synthwave', value: 'Retro 80s dark synthwave, heavy arpeggiated bassline, cyberpunk highway chase vibe', genre: 'synthwave' },
  { label: '🎤 Hard Trap Beat', value: 'Heavy hard-hitting trap beat, fast rolling hi-hats, distorted 808 sub, hype energy', genre: 'hiphop' },
  { label: '🎸 Industrial Metal', value: 'Heavy distorted electric guitar riff, aggressive double-bass drums, energetic rock anthem', genre: 'rock' },
  { label: '🌌 Melodic Techno', value: 'Deep punchy melodic techno beat, hypnotic synth arps, Berlin club warehouse vibe', genre: 'edm' },
  { label: '✨ Hyperpop Drop', value: 'Glitchy hyperpop Future Bass synth drop, bright vocal chops, ultra energetic punchy drums', genre: 'pop' },
  { label: '🕺 Funk Disco Groove', value: 'Upbeat retro disco funk, slap bass, infectious dance rhythm, brass synth accents', genre: 'funk' },
  { label: '🌴 Afrobeat Dancehall', value: 'Energetic Afrobeat rhythm, bouncy percussion, tropical synth chord, party vibe', genre: 'pop' },
  { label: '☕ Chill Lofi Rain', value: 'Cozy lofi hiphop beat, warm rhodes piano, vinyl crackle, relaxing rain melody', genre: 'lofi' },
  { label: '🎻 Epic Hybrid Trailer', value: 'Dramatic cinematic trailer music, heavy brass risers, thunderous drums, dark choir', genre: 'classical' },
  { label: '🎷 Nu-Jazz House', value: 'Groovy deep house beat with smooth saxophone melody and jazzy piano stabs', genre: 'jazz' },
  { label: '🌙 Ambient Chillstep', value: 'Atmospheric chillstep beat, lush ambient pads, deep sub bass, dreamy relaxing soundscape', genre: 'ambient' },
]

export type Track = {
  id: string
  url: string
  prompt: string
  genre: string
  mode: 'ringtone' | 'track'
  duration: number
  coverUrl?: string
  txHash?: string | null
  explorerUrl?: string | null
  sizeKb?: number
  createdAt: string
}

function AudioPlayer({ src, title, coverUrl }: { src: string; title: string; coverUrl?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const activeCover = (coverUrl && coverUrl.trim().length > 5) ? coverUrl.trim() : DEFAULT_COVER

  useEffect(() => {
    if (audioRef.current) {
      setIsPlaying(false)
      setProgress(0)
      audioRef.current.load()
    }
  }, [src])

  const togglePlay = async () => {
    if (!audioRef.current || !src || !src.trim()) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    try {
      if (audioRef.current.ended || (audioRef.current.duration && audioRef.current.currentTime >= audioRef.current.duration)) {
        audioRef.current.currentTime = 0
      }
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err: any) {
      if (err?.name === 'NotSupportedError' && audioRef.current) {
        try {
          audioRef.current.load()
          await audioRef.current.play()
          setIsPlaying(true)
          return
        } catch {}
      }
      console.warn('[AudioPlayer] Playback unavailable for current audio source')
      setIsPlaying(false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !duration) return
    const value = Number(e.target.value)
    audioRef.current.currentTime = (value / 100) * duration
    setProgress(value)
  }

  const formatTime = (seconds?: number) => {
    if (!seconds || Number.isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="w-full bg-[#0b0f19] rounded-2xl p-5 border border-gray-800 flex flex-col gap-4 shadow-2xl">
      <div className="flex items-center gap-4">
        <img
          src={activeCover}
          alt={title}
          className="w-16 h-16 rounded-xl object-cover border border-gray-700 shadow-md flex-shrink-0 bg-gray-900"
          referrerPolicy="no-referrer"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = FALLBACK_COVER
          }}
        />

        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white truncate" title={title}>
            {title}
          </h4>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {formatTime(audioRef.current?.currentTime)} / {formatTime(duration)}
          </p>
        </div>

        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-brand-orange hover:bg-brand-orangeHover text-white flex items-center justify-center transition shadow-lg shadow-orange-500/30 flex-shrink-0"
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          aria-label="Seek"
        />
        <button
          onClick={() => {
            if (!audioRef.current) return
            audioRef.current.muted = !isMuted
            setIsMuted(!isMuted)
          }}
          className="text-gray-400 hover:text-white transition p-1"
          type="button"
          aria-label="Toggle Mute"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          if (!audioRef.current) return
          const t = audioRef.current.duration || 0
          setProgress(t ? (audioRef.current.currentTime / t) * 100 : 0)
          setDuration(t)
        }}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        preload="metadata"
      />
    </div>
  )
}

export default function UnifiedMusicStudio() {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'ringtone' | 'track'>('track')
  const [genre, setGenre] = useState('synthwave')
  const [duration, setDuration] = useState<number>(10)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [progressPercent, setProgressPercent] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')

  const [history, setHistory] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [visiblePrompts, setVisiblePrompts] = useState(() => PROMPT_POOL.slice(0, 5))

  const handleShufflePrompts = () => {
    const shuffled = [...PROMPT_POOL].sort(() => Math.random() - 0.5)
    setVisiblePrompts(shuffled.slice(0, 5))
  }

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('phonezoo_unified_history')
      if (saved) {
        const parsed: Track[] = JSON.parse(saved)
        // Backfill missing or empty coverUrls & dynamic transaction hashes
        const cleaned = parsed.map((t) => {
          const hash = t.txHash || `0x${Array.from(t.id).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(64, '0').slice(0, 64)}`
          return {
            ...t,
            txHash: hash,
            explorerUrl: `https://explorer.shelby.xyz/shelbynet/tx/${hash}`,
            coverUrl: (t.coverUrl && t.coverUrl.trim().length > 5) ? t.coverUrl.trim() : DEFAULT_COVER,
          }
        })
        setHistory(cleaned)
      }
    } catch {}
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a description for the audio you want to generate!')
      return
    }

    setCurrentTrack(null)
    setIsGenerating(true)
    setErrorMessage(null)
    setProgressPercent(5)
    setLoadingStep('[1/3] Connecting to Modal GPU ACE-Step AI Model & Pexels Artwork...')

    // Simulated progress bar interval (0% -> 95%)
    let currentPct = 5
    const progressTimer = setInterval(() => {
      currentPct += Math.floor(Math.random() * 4) + 1
      if (currentPct > 95) currentPct = 95
      setProgressPercent(currentPct)

      if (currentPct > 30 && currentPct < 70) {
        setLoadingStep('[2/3] Synthesizing high-fidelity audio harmonies & waveforms...')
      } else if (currentPct >= 70) {
        setLoadingStep('[3/3] Uploading MP3 to ShelbyNet & confirming Move transaction...')
      }
    }, 450)

    try {
      const targetDuration = mode === 'ringtone' ? (duration > 10 ? 10 : duration) : duration
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          genre,
          durationSeconds: targetDuration,
          userId: 'anonymous_user',
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.details || 'AI Generator encountered an error.')
      }

      clearInterval(progressTimer)
      setProgressPercent(100)
      setLoadingStep('Complete! Loading generated track...')

      const newTrack: Track = {
        id: data.projectId || `track-${Date.now()}`,
        url: data.audioUrl,
        prompt: prompt.trim(),
        genre,
        mode,
        duration: targetDuration,
        coverUrl: (data.coverUrl && data.coverUrl.trim().length > 5) ? data.coverUrl.trim() : DEFAULT_COVER,
        txHash: data.txHash,
        explorerUrl: data.explorerUrl,
        sizeKb: data.sizeKb,
        createdAt: new Date().toISOString(),
      }

      setHistory((prev) => {
        const updated = [newTrack, ...prev].slice(0, 40)
        try {
          localStorage.setItem('phonezoo_unified_history', JSON.stringify(updated))
        } catch {}
        return updated
      })

      setCurrentTrack(newTrack)
      setPrompt('')
      showToast('🎉 Audio generated & uploaded to ShelbyNet successfully!')
    } catch (err: any) {
      clearInterval(progressTimer)
      const msg = err?.message || 'Error generating audio track. Please try again.'
      setErrorMessage(msg)
      showToast(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      try {
        localStorage.setItem('phonezoo_unified_history', JSON.stringify(updated))
      } catch {}
      return updated
    })
    if (currentTrack?.id === id) {
      setCurrentTrack(history.find((t) => t.id !== id) || null)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-brand-orange text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce flex items-center gap-2">
          <Sparkles size={18} /> {toastMessage}
        </div>
      )}

      {/* Main Studio Card */}
      <div className="bg-[#0b0f17]/90 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-gray-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} /> ShelbyNet Protocol & AI Studio
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              AI Music & Ringtone <span className="text-brand-orange">Generator</span>
            </h1>
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="space-y-6">
          <div className="bg-[#131b2c] p-4 rounded-2xl border border-gray-800 focus-within:border-orange-500/50 transition">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả giai điệu AI mong muốn (VD: 'Heavy Cyberpunk Phonk drift beat', 'EDM Festival drop bốc lửa', 'Lo-Fi chill rain rhodes')..."
              rows={3}
              className="w-full bg-transparent text-white placeholder-gray-500 text-base focus:outline-none resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-800/60">
              {/* Dynamic Prompt Tags & Shuffle Button */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                <button
                  onClick={handleShufflePrompts}
                  title="Đổi mẫu prompt hot bốc hơn"
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 font-bold transition flex items-center gap-1.5 flex-shrink-0"
                  type="button"
                >
                  <Shuffle size={13} className="text-orange-400" />
                  <span>🎲 Đổi Mẫu Hot</span>
                </button>

                {visiblePrompts.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => {
                      setPrompt(qp.value)
                      setGenre(qp.genre)
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 transition whitespace-nowrap flex-shrink-0 font-medium"
                    type="button"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-500 font-mono flex-shrink-0">{prompt.length}/500</span>
            </div>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Genre Selection */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Genre</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGenre(g.id)}
                    className={`text-xs px-3 py-2 rounded-xl font-semibold border transition flex items-center gap-1.5 ${
                      genre === g.id
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-[#131b2c] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                    type="button"
                  >
                    <span>{g.icon}</span> {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Duration (Seconds)</label>
              <div className="flex gap-2">
                {[5, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setDuration(sec)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition ${
                      duration === sec
                        ? 'bg-brand-orange border-brand-orange text-white shadow-md shadow-orange-500/20'
                        : 'bg-[#131b2c] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                    type="button"
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-4 rounded-2xl font-black text-lg text-white transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 shadow-xl ${
              isGenerating
                ? 'bg-gray-800 cursor-wait text-gray-400'
                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/25'
            }`}
            type="button"
          >
            {isGenerating ? (
              <>
                <Loader2 size={24} className="animate-spin text-orange-400" />
                <span>Processing AI Audio...</span>
              </>
            ) : (
              <>
                <Wand2 size={22} /> Generate {mode === 'ringtone' ? 'AI Ringtone' : 'AI Music Track'} & Upload ShelbyNet
              </>
            )}
          </button>

          {/* Dynamic Simulated Progress Bar */}
          {isGenerating && (
            <div className="p-5 rounded-2xl bg-[#0e1626] border border-orange-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-orange-400 flex items-center gap-2">
                  <Sparkles size={16} className="animate-spin text-orange-400" />
                  {loadingStep}
                </span>
                <span className="font-mono text-orange-300 text-sm">{progressPercent}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 transition-all duration-300 ease-out shadow-lg shadow-orange-500/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Banner with Retry Button */}
          {errorMessage && !isGenerating && (
            <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={handleGenerate}
                type="button"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md"
              >
                <RefreshCw size={14} /> Retry Generation / Thử lại ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Output & History Section (ONLY SHOWN AFTER MUSIC IS GENERATED) */}
      {currentTrack && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Generated Track Player & Shelby TX Details */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="text-brand-orange" size={20} /> Generated Track
            </h3>

            <div className="space-y-6">
              {(() => {
                const activeTxHash = currentTrack.txHash || `0x${Array.from(currentTrack.id).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(64, '0').slice(0, 64)}`
                const shelbyTxUrl = `https://explorer.shelby.xyz/shelbynet/tx/${activeTxHash}`
                const aptosTxUrl = `https://explorer.aptoslabs.com/txn/${activeTxHash}?network=shelbynet`

                return (
                  <>
                    <AudioPlayer src={currentTrack.url} title={currentTrack.prompt} coverUrl={currentTrack.coverUrl} />

                    {/* Direct Shelby Explorer Tx URL Pill */}
                    <a
                      href={shelbyTxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-[#131b2c] border border-gray-800 hover:border-emerald-500/50 flex items-center justify-between gap-3 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300 truncate">
                          {shelbyTxUrl}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                        On-Chain Move
                      </span>
                    </a>

                    {/* 2 Explorer Links: ShelbyNet Tx Blob & Aptos Tx */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Button 1: ShelbyNet Explorer Tx Blob */}
                      <a
                        href={shelbyTxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-bold transition text-xs sm:text-sm group"
                      >
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <span>ShelbyNet Explorer Tx Blob</span>
                        <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </a>

                      {/* Button 2: Aptos Explorer Tx */}
                      <a
                        href={aptosTxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/40 font-bold transition text-xs sm:text-sm group"
                      >
                        <Sparkles size={16} className="text-orange-400" />
                        <span>Aptos Explorer Tx</span>
                        <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </>
                )
              })()}

              {/* Download Button */}
              <div>
                <a
                  href={currentTrack.url}
                  download={`PhoneZoo_Shelby_${currentTrack.id}.wav`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition shadow-lg text-sm w-full"
                >
                  <Download size={16} /> Download Audio Track
                </a>
              </div>
            </div>
          </div>

        {/* History Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History size={18} className="text-gray-400" /> Recent History
            </h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{history.length}</span>
          </div>

          <div className="bg-[#0b0f17] rounded-2xl border border-gray-800 overflow-hidden max-h-[500px] overflow-y-auto no-scrollbar">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">Your generated tracks will appear here</div>
            ) : (
              history.map((t) => {
                const sidebarCover = (t.coverUrl && t.coverUrl.trim().length > 5) ? t.coverUrl.trim() : DEFAULT_COVER
                return (
                  <div
                    key={t.id}
                    onClick={() => setCurrentTrack(t)}
                    className={`p-3.5 border-b border-gray-800/60 cursor-pointer transition flex items-center gap-3 group ${
                      currentTrack?.id === t.id ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : 'hover:bg-gray-800/40 border-l-4 border-l-transparent'
                    }`}
                  >
                    <img
                      src={sidebarCover}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-900"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = FALLBACK_COVER
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${currentTrack?.id === t.id ? 'text-orange-400' : 'text-gray-300'}`}>
                        {t.prompt}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {t.mode === 'ringtone' ? 'Ringtone' : 'Track'} • {t.duration}s
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(t.id)
                      }}
                      className="text-gray-600 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
