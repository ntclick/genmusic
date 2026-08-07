'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Play, Pause, Download, Wand2, History, Trash2,
  Volume2, VolumeX, X, AlertCircle, Loader2, ChevronDown,
  ChevronUp, Zap, Music, Plus, CheckCircle, XCircle,
  Mic2, Lock, Share2, Heart,
} from 'lucide-react'

const PAYPAL_DONATE_URL = 'https://www.paypal.com/donate/?business=izuibloger%40gmail.com&currency_code=USD&item_name=Support+PhoneZoo'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'
import { useGenerateMusic } from '@/hooks/useGenerateMusic'
import { fetchQuota, enhancePromptWithAI, fetchUserTracks, updateTrack, deleteTrack } from '@/lib/music-api'
import type { QuotaResponse, MusicGenre } from '@/types/music'

// ─── Constants ───────────────────────────────────────────────────────────

const GENRES: MusicGenre[] = [
  { id: 'pop', name: 'Pop', description: null, prompt_template: '', icon: '🎵', sort_order: 1 },
  { id: 'rock', name: 'Rock', description: null, prompt_template: '', icon: '🎸', sort_order: 2 },
  { id: 'edm', name: 'EDM', description: null, prompt_template: '', icon: '⚡', sort_order: 3 },
  { id: 'hiphop', name: 'Hip Hop', description: null, prompt_template: '', icon: '🎤', sort_order: 4 },
  { id: 'lofi', name: 'Lo-Fi', description: null, prompt_template: '', icon: '☕', sort_order: 5 },
  { id: 'classical', name: 'Classical', description: null, prompt_template: '', icon: '🎻', sort_order: 6 },
  { id: 'jazz', name: 'Jazz', description: null, prompt_template: '', icon: '🎷', sort_order: 7 },
  { id: 'ambient', name: 'Ambient', description: null, prompt_template: '', icon: '🌙', sort_order: 8 },
  { id: 'funk', name: 'Funk', description: null, prompt_template: '', icon: '🕺', sort_order: 9 },
  { id: 'kpop', name: 'K-Pop', description: null, prompt_template: '', icon: '✨', sort_order: 10 },
  { id: 'rnb', name: 'R&B', description: null, prompt_template: '', icon: '💜', sort_order: 11 },
  { id: 'latin', name: 'Latin', description: null, prompt_template: '', icon: '🌴', sort_order: 12 },
]

const DURATION_OPTIONS = [15, 30, 60] as const

const PHASE_LABELS = [
  'Loading AI model...',
  'Composing melody...',
  'Adding harmonics...',
  'Mixing instruments...',
  'Mastering audio...',
]

const QUICK_PROMPTS = [
  { label: 'Chill Beats', value: 'chill lofi beats, mellow piano, relaxing vibe' },
  { label: 'Epic Cinematic', value: 'epic cinematic orchestral, dramatic strings, rising intensity' },
  { label: 'Party EDM', value: 'energetic EDM drop, festival vibes, heavy bass, 128 bpm' },
  { label: 'Acoustic', value: 'warm acoustic guitar, gentle fingerpicking, folk feel' },
  { label: 'Trap Beat', value: 'dark trap beat, 808 bass, hi-hats, atmospheric synth' },
]

// ─── Sub-components ──────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success' | ''; onClose: () => void }) {
  if (!message) return null
  const bgColor = type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'
  const icon = type === 'error' ? <AlertCircle size={20} /> : <Sparkles size={20} />
  return (
    <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md text-white font-medium animate-bounce-in ${bgColor}`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Close toast"><X size={16} /></button>
    </div>
  )
}

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlay = async () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); return }
    try { await audioRef.current.play(); setIsPlaying(true) } catch { setIsPlaying(false) }
  }

  const formatTime = (seconds?: number) => {
    if (!seconds || Number.isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className="w-full bg-[#0f172a] rounded-2xl p-4 border border-gray-800/50 flex flex-col gap-3 shadow-inner">
      <div className="flex items-center gap-4">
        <button onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center text-white hover:bg-brand-orangeHover transition shadow-lg shadow-orange-500/20 flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>
        <div className="flex-1 flex flex-col justify-center gap-1">
          <div className="flex justify-between text-xs text-gray-400 font-medium font-mono">
            <span>{formatTime(audioRef.current?.currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input type="range" min="0" max="100" value={progress || 0}
            onChange={(e) => { if (audioRef.current && duration) { const v = Number(e.target.value); audioRef.current.currentTime = (v / 100) * duration; setProgress(v) } }}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" aria-label="Seek" />
        </div>
        <button onClick={() => { if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted) } }}
          className="text-gray-400 hover:text-white transition" aria-label="Toggle mute">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => { if (audioRef.current) { const t = audioRef.current.duration || 0; setProgress(t ? (audioRef.current.currentTime / t) * 100 : 0); setDuration(t) } }}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        preload="metadata" />
    </div>
  )
}

function QuotaBadge({ quota }: { quota: QuotaResponse | null }) {
  if (!quota) return null
  const pct = quota.limit > 0 ? ((quota.used / quota.limit) * 100) : 0
  const color = pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-yellow-400' : 'text-green-400'
  return (
    <div className="flex items-center gap-2 text-xs">
      <Zap size={14} className={color} />
      <span className={color}>{quota.remaining}/{quota.limit}</span>
      <span className="text-gray-500">generations left today</span>
      {quota.plan !== 'free' && quota.plan !== 'starter' && (
        <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
          {quota.plan}
        </span>
      )}
    </div>
  )
}

function GenerationProgress({ elapsedMs, status }: { elapsedMs: number; status: string }) {
  const progress = status === 'completed' ? 100 : Math.min(95, 95 * (1 - Math.exp(-elapsedMs / 45_000)))
  const phaseIdx = Math.min(PHASE_LABELS.length - 1, Math.floor((progress / 95) * PHASE_LABELS.length))
  const elapsedSec = Math.floor(elapsedMs / 1000)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 size={18} className="text-brand-orange animate-spin" />
        <span className="text-sm">{PHASE_LABELS[phaseIdx]}</span>
        <span className="ml-auto text-xs tabular-nums">{elapsedSec}s</span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-brand-orange rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
      {elapsedSec > 25 && (
        <p className="text-xs text-gray-500">AI generation typically takes 60–90s. Hang tight!</p>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function MusicGeneratorClient() {
  // Auth
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [quota, setQuota] = useState<QuotaResponse | null>(null)

  // Form
  const [prompt, setPrompt] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('pop')
  const [duration, setDuration] = useState<number>(15)
  const [lyrics, setLyrics] = useState('')
  const [showLyrics, setShowLyrics] = useState(false)
  const [isAiWriting, setIsAiWriting] = useState(false)
  const [isLyricsWriting, setIsLyricsWriting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | '' }>({ message: '', type: '' })

  // History (DB for logged-in, localStorage fallback)
  type HistoryTrack = { id: string; prompt: string; url: string; createdAt: string; title?: string; slug?: string; description?: string; is_public?: boolean }
  const [history, setHistory] = useState<HistoryTrack[]>([])
  const [currentTrack, setCurrentTrack] = useState<HistoryTrack | null>(null)
  const [editingTrack, setEditingTrack] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { generate, reset, status, audioUrl, title: generatedTitle, slug: generatedSlug, isSubmitting, error, elapsedMs } = useGenerateMusic()

  const isGenerating = status === 'pending' || status === 'processing'
  const isCompleted = status === 'completed'
  const isDisabled = isGenerating || isSubmitting

  const userView = useMemo(() => {
    if (!authUser) return null
    return {
      uid: authUser.uid,
      email: authUser.email || '',
      name: authUser.displayName || authUser.email || 'User',
      avatar: authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.uid)}`,
    }
  }, [authUser])

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: '' }), 4000)
  }

  // Load auth state and quota
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setAuthUser(u)
      if (u) {
        localStorage.setItem('phonezoo_user_id', u.uid)
        // Sync to backend
        fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }),
        }).catch(() => {})
      } else {
        localStorage.removeItem('phonezoo_user_id')
      }
      // Refresh quota
      try {
        const q = await fetchQuota()
        setQuota(q)
      } catch {}
    })
    return () => unsub()
  }, [])

  // Load history: from DB if logged in, localStorage fallback
  const loadHistory = useCallback(async (userId?: string) => {
    if (userId) {
      try {
        const tracks = await fetchUserTracks()
        const mapped = tracks
          .filter((t: any) => t.status === 'completed' && t.audio_url)
          .map((t: any) => ({
            id: t.id,
            prompt: t.prompt,
            url: t.audio_url,
            createdAt: t.created_at,
            title: t.title || undefined,
            slug: t.slug || undefined,
            description: t.description || undefined,
            is_public: t.is_public,
          }))
        setHistory(mapped)
        if (mapped.length > 0 && !currentTrack) setCurrentTrack(mapped[0])
        return
      } catch {}
    }
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('phonezoo_music_history')
      if (saved) {
        const items = JSON.parse(saved)
        setHistory(items)
        if (items.length > 0 && !currentTrack) setCurrentTrack(items[0])
      }
    } catch {}
  }, [currentTrack])

  // Load history on auth change
  useEffect(() => {
    if (authUser) {
      loadHistory(authUser.uid)
    } else {
      loadHistory()
    }
  }, [authUser, loadHistory])

  // Track values for use in completion callback without re-triggering effect
  const promptRef = useRef(prompt)
  promptRef.current = prompt
  const titleRef = useRef(generatedTitle)
  titleRef.current = generatedTitle
  const slugRef = useRef(generatedSlug)
  slugRef.current = generatedSlug

  // When generation completes, reload history from DB
  useEffect(() => {
    if (isCompleted && audioUrl) {
      // Immediately show in UI
      const newTrack: HistoryTrack = {
        id: Date.now().toString(),
        prompt: promptRef.current,
        url: audioUrl,
        createdAt: new Date().toISOString(),
        title: titleRef.current || undefined,
        slug: slugRef.current || undefined,
        is_public: true,
      }
      setCurrentTrack(newTrack)
      setHistory(prev => {
        const updated = [newTrack, ...prev].slice(0, 50)
        localStorage.setItem('phonezoo_music_history', JSON.stringify(updated))
        return updated
      })
      showToast('Your music is ready!', 'success')

      // Refresh quota + reload full history from DB (gets real IDs, titles, slugs)
      fetchQuota().then(q => setQuota(q)).catch(() => {})
      if (authUser) {
        setTimeout(() => loadHistory(authUser.uid), 2000)
      }
    }
  }, [isCompleted, audioUrl])

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(firebaseAuth, provider)
      showToast('Signed in successfully!', 'success')
    } catch (e: any) {
      showToast(e?.message || 'Sign in failed')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth)
      showToast('Signed out', 'success')
    } catch {}
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      showToast('Please describe the music you want (at least 3 characters)')
      return
    }

    if (quota && !quota.can_generate) {
      showToast('Daily limit reached. Sign in or upgrade your plan for more generations.')
      return
    }

    // Check if vocals/lyrics needs premium
    const wantsVocals = showLyrics
    if (wantsVocals && quota && !quota.has_vocals) {
      showToast('Music with vocals requires Premium plan ($29.99/mo)')
      return
    }

    // Check duration limit
    if (quota && duration > quota.max_duration) {
      showToast(`Your plan allows max ${quota.max_duration}s. Upgrade for longer tracks.`)
      return
    }

    // If vocals mode: send lyrics if provided, or send a marker so backend knows to use AI songwriter
    await generate({
      prompt: prompt.trim(),
      lyrics: wantsVocals ? (lyrics.trim() || '[AI_WRITE_LYRICS]') : undefined,
      genre: selectedGenre,
      duration,
    })

    // Refresh quota immediately — backend already incremented before responding
    fetchQuota().then(q => setQuota(q)).catch(() => {})
  }

  const handleAiWrite = async () => {
    if (!prompt.trim() || isAiWriting || isDisabled) return
    setIsAiWriting(true)
    try {
      const enhanced = await enhancePromptWithAI(prompt.trim(), selectedGenre, lyrics.trim())
      setPrompt(enhanced)
    } catch {
      showToast('AI enhancement failed. Try again.')
    } finally {
      setIsAiWriting(false)
    }
  }

  const handleDeleteTrack = async (id: string) => {
    if (authUser) {
      try {
        await deleteTrack(id)
      } catch {}
    }
    setHistory(prev => {
      const updated = prev.filter(t => t.id !== id)
      localStorage.setItem('phonezoo_music_history', JSON.stringify(updated))
      return updated
    })
    if (currentTrack?.id === id) setCurrentTrack(null)
    if (editingTrack === id) setEditingTrack(null)
  }

  const handleStartEdit = (track: HistoryTrack) => {
    setEditingTrack(track.id)
    setEditTitle(track.title || '')
    setEditDescription(track.description || '')
  }

  const handleSaveEdit = async (id: string) => {
    if (!authUser) {
      showToast('Sign in to edit track details')
      return
    }
    setIsSaving(true)
    try {
      await updateTrack(id, { title: editTitle, description: editDescription })
      setHistory(prev => prev.map(t =>
        t.id === id ? { ...t, title: editTitle, description: editDescription } : t
      ))
      if (currentTrack?.id === id) {
        setCurrentTrack(prev => prev ? { ...prev, title: editTitle, description: editDescription } : prev)
      }
      setEditingTrack(null)
      showToast('Track updated!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    if (!authUser) return
    try {
      await updateTrack(id, { is_public: !isPublic })
      setHistory(prev => prev.map(t =>
        t.id === id ? { ...t, is_public: !isPublic } : t
      ))
      showToast(isPublic ? 'Track set to private' : 'Track is now public', 'success')
    } catch {
      showToast('Failed to update visibility')
    }
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-orange-500/30 overflow-x-hidden pb-20">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {/* Background blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Top bar: user info + quota */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <QuotaBadge quota={quota} />
          <div className="flex items-center gap-3">
            {userView ? (
              <>
                <img src={userView.avatar} alt="" width={36} height={36}
                  className="w-9 h-9 rounded-full bg-gray-600 object-cover" loading="lazy" referrerPolicy="no-referrer" />
                <div className="text-right">
                  <div className="text-sm font-bold text-white leading-tight">{userView.name}</div>
                  <div className="text-[11px] text-gray-400 leading-tight">{userView.email}</div>
                </div>
                <button onClick={handleLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-xs font-bold border border-red-500/20 transition" type="button">
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={handleLogin}
                className="bg-brand-orange hover:bg-brand-orangeHover text-white px-6 py-2.5 rounded-full text-sm font-bold transition shadow-lg shadow-orange-500/25 flex items-center gap-2 animate-pulse-slow" type="button">
                <Sparkles size={16} />
                Sign in for 10x more generations
              </button>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            AI <span className="text-brand-orange">Music Generator</span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto text-lg leading-relaxed">
            Create unique music tracks in seconds — instrumentals, beats, or full songs with lyrics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form + Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Genre selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Genre</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button key={g.id} type="button" disabled={isDisabled}
                    onClick={() => setSelectedGenre(g.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border disabled:cursor-not-allowed ${
                      selectedGenre === g.id
                        ? 'bg-brand-orange border-brand-orange text-white'
                        : 'bg-[#0f172a] border-gray-800 text-gray-400 hover:border-brand-orange hover:text-white'
                    }`}>
                    <span>{g.icon}</span> {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl overflow-hidden border border-gray-800">
              <button type="button" disabled={isDisabled}
                onClick={() => { setShowLyrics(false); setLyrics('') }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition ${
                  !showLyrics
                    ? 'bg-orange-500 text-white'
                    : 'bg-[#0f172a] text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}>
                <Music size={16} /> Instrumental
                {quota && <span className="text-[10px] opacity-70 ml-1">({quota.remaining}/{quota.limit})</span>}
              </button>
              <button type="button" disabled={isDisabled}
                onClick={() => setShowLyrics(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition ${
                  showLyrics
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#0f172a] text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}>
                <Mic2 size={16} /> Vocals & Lyrics
                {quota && <span className="text-[10px] opacity-70 ml-1">({quota.vocal_remaining}/{quota.vocal_limit})</span>}
              </button>
            </div>

            {/* Content area — changes based on mode */}
            <div className={`rounded-2xl border-2 p-5 space-y-4 transition-all ${
              showLyrics
                ? 'border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent'
                : 'border-orange-500/30 bg-gradient-to-b from-orange-500/5 to-transparent'
            }`}>
              {/* Prompt input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="music-prompt" className="text-sm font-medium text-white">
                    {showLyrics ? 'Describe your song' : 'Describe your music'}
                  </label>
                  <button type="button" onClick={handleAiWrite}
                    disabled={isDisabled || isAiWriting || !prompt.trim()}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      showLyrics
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white'
                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white'
                    }`}>
                    <Sparkles size={11} className={isAiWriting ? 'animate-pulse' : ''} />
                    {isAiWriting ? 'Writing...' : 'AI Write'}
                  </button>
                </div>
                <textarea id="music-prompt" value={prompt} onChange={e => setPrompt(e.target.value)}
                  disabled={isDisabled}
                  placeholder={showLyrics
                    ? "Ex: 'A love song about missing someone on a rainy night'"
                    : "Ex: 'Chill lo-fi beat with rain sounds' or 'Epic orchestral battle theme'"
                  }
                  maxLength={500} rows={2}
                  className={`w-full px-3 py-2.5 rounded-lg bg-[#0b0f19] border text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 transition resize-none disabled:cursor-not-allowed ${
                    showLyrics ? 'border-purple-500/20 focus:ring-purple-500/50' : 'border-gray-800 focus:ring-orange-500/50'
                  }`} />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {QUICK_PROMPTS.map(qp => (
                      <button key={qp.label} type="button" disabled={isDisabled}
                        onClick={() => setPrompt(qp.value)}
                        className={`whitespace-nowrap text-[11px] px-2.5 py-1 rounded-md transition border disabled:cursor-not-allowed ${
                          prompt === qp.value
                            ? (showLyrics ? 'bg-purple-500 text-white border-purple-500' : 'bg-orange-500 text-white border-orange-500')
                            : 'text-gray-500 bg-transparent border-gray-800 hover:text-white hover:border-gray-600'
                        }`}>
                        {qp.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-600 ml-2 flex-shrink-0">{prompt.length}/500</span>
                </div>
              </div>

              {/* Lyrics section (vocals mode only) */}
              {showLyrics && (
                <div className="space-y-2 pt-2 border-t border-purple-500/10">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Lyrics</label>
                    <button type="button"
                      disabled={isLyricsWriting || !prompt.trim()}
                      onClick={async () => {
                        if (!prompt.trim()) { showToast('Describe your song first'); return }
                        setIsLyricsWriting(true)
                        try {
                          const res = await fetch('/api/music/ai-lyrics', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ description: prompt.trim(), genre: selectedGenre, duration }),
                          })
                          if (!res.ok) throw new Error()
                          const data = await res.json()
                          if (data.lyrics) { setLyrics(data.lyrics); showToast('Lyrics generated!', 'success') }
                        } catch { showToast('Failed to generate lyrics. Try again.') }
                        finally { setIsLyricsWriting(false) }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500 hover:text-white transition text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                      <Sparkles size={12} className={isLyricsWriting ? 'animate-spin' : ''} />
                      {isLyricsWriting ? 'Writing...' : 'AI Write Lyrics'}
                    </button>
                  </div>
                  <textarea value={lyrics} onChange={e => setLyrics(e.target.value)}
                    disabled={isDisabled}
                    placeholder="Click 'AI Write Lyrics' or type your own lyrics..."
                    maxLength={2500} rows={5}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0b0f19] border border-purple-500/20 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition resize-none disabled:cursor-not-allowed" />
                </div>
              )}
            </div>

            {/* Donate hint */}
            <a href={PAYPAL_DONATE_URL} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-pink-300 hover:border-pink-500/40 transition text-xs shadow-lg shadow-pink-500/5 hover:-translate-y-0.5">
              <Heart size={16} className="text-pink-400 flex-shrink-0 animate-pulse" />
              <span>We rely on donations to pay for AI servers. <strong>Support us via PayPal</strong> to keep it free.</span>
            </a>

            {/* Duration — only for Instrumental (Suno auto-decides for vocals) */}
            {!showLyrics && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Duration</label>
                <div className="flex gap-2">
                  {DURATION_OPTIONS.map(d => {
                    const locked = quota ? d > quota.max_duration : d > 15
                    return (
                      <button key={d} type="button" disabled={isDisabled || locked}
                        onClick={() => !locked && setDuration(d)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition relative disabled:cursor-not-allowed ${
                          duration === d && !locked
                            ? 'bg-brand-orange border-brand-orange text-white'
                            : locked
                            ? 'bg-gray-900 border-gray-800 text-gray-600'
                            : 'bg-[#0f172a] border-gray-800 text-gray-400 hover:border-brand-orange hover:text-white'
                        }`}>
                        {d}s
                        {locked && <Lock size={10} className="inline ml-1 text-gray-600" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Generate button */}
            {isCompleted ? (
              <button type="button" onClick={reset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-[#1e293b] hover:bg-[#2d3b55] transition border border-gray-700">
                <Plus size={18} /> Create Another
              </button>
            ) : (
              <button type="button" onClick={handleGenerate}
                disabled={isDisabled}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition shadow-lg ${
                  isDisabled ? 'bg-gray-700 cursor-wait' : 'bg-brand-orange hover:bg-brand-orangeHover shadow-orange-500/30 active:scale-[0.98]'
                }`}>
                {isDisabled ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 size={18} /> Generate Music</>
                )}
              </button>
            )}

            {/* Error */}
            {status === 'failed' && error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <XCircle size={20} />
                <div>
                  <p className="font-semibold">Generation failed</p>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Generation progress */}
            {isGenerating && (
              <div className="border border-gray-800 rounded-xl p-5 bg-[#0f172a]">
                <GenerationProgress elapsedMs={elapsedMs} status={status || 'processing'} />
              </div>
            )}

            {/* Completed: Player */}
            {isCompleted && audioUrl && (
              <div className="border border-gray-700/50 rounded-2xl p-6 bg-[#1e293b]/60 backdrop-blur-md shadow-2xl animate-slide-up">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Your music is ready!</span>
                </div>
                {generatedTitle && (
                  <h3 className="text-lg font-bold text-white mb-3">{generatedTitle}</h3>
                )}
                <AudioPlayer src={audioUrl} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  <a href={`/maker?source=${encodeURIComponent(audioUrl)}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition border border-gray-600/50 text-sm">
                    <Music size={16} /> Edit / Trim
                  </a>
                  <a href={audioUrl} download={`PhoneZoo_Music_${Date.now()}.mp3`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition shadow-lg text-sm">
                    <Download size={16} /> Download
                  </a>
                  {generatedSlug && (
                    <Link href={`/music/${generatedSlug}`}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold transition text-sm">
                      <Share2 size={16} /> Share Track
                    </Link>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right: History & Donate */}
          <div className="lg:col-span-1 space-y-6">
            {/* Donate CTA */}
            <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-orange-500/10 border border-pink-500/20 rounded-2xl p-6 shadow-xl shadow-pink-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart size={24} className="text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">Support PhoneZoo</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    We rely entirely on user donations to pay for expensive AI server and operating costs. If this tool is useful to you, please consider buying us a coffee so we can keep the generator free and fast for everyone!
                  </p>
                  <a href={PAYPAL_DONATE_URL} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-pink-500/20 hover:-translate-y-0.5">
                    <Heart size={16} /> Donate via PayPal
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="text-gray-400" size={18} /> History
              </h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{history.length}</span>
            </div>

            {history.length === 0 ? (
              <div className="bg-[#0f172a] rounded-2xl border border-gray-800 p-8 text-center">
                <Music size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Your generated tracks will appear here</p>
              </div>
            ) : (
              <div className="bg-[#0f172a] rounded-2xl border border-gray-800 overflow-hidden max-h-[600px] overflow-y-auto no-scrollbar">
                {history.map(track => (
                  <div key={track.id}
                    className={`border-b border-gray-800/50 transition-colors ${
                      currentTrack?.id === track.id ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : 'hover:bg-gray-800/50 border-l-4 border-l-transparent'
                    }`}>
                    {/* Track row */}
                    <div onClick={() => setCurrentTrack(track)} className="p-4 cursor-pointer flex items-center gap-3 group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        currentTrack?.id === track.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {currentTrack?.id === track.id
                          ? <Sparkles size={16} className="animate-pulse" />
                          : <Play size={14} fill="currentColor" className="ml-0.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-orange-400' : 'text-gray-300'}`}>
                          {track.title || track.prompt}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(track.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {authUser && (
                          <button onClick={e => { e.stopPropagation(); handleStartEdit(track) }}
                            className="text-gray-500 hover:text-orange-400 p-1.5" type="button" title="Edit">
                            <Wand2 size={13} />
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); handleDeleteTrack(track.id) }}
                          className="text-gray-600 hover:text-red-500 p-1.5" type="button" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit panel */}
                    {editingTrack === track.id && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-800/30" onClick={e => e.stopPropagation()}>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          placeholder="Track title"
                          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-orange-500 outline-none" />
                        <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          rows={2}
                          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-orange-500 outline-none resize-none" />
                        <div className="flex items-center justify-between gap-2">
                          <button onClick={() => handleTogglePublic(track.id, track.is_public ?? true)}
                            className={`text-xs px-2 py-1 rounded-md border transition ${
                              track.is_public ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-700 text-gray-400 bg-gray-800'
                            }`} type="button">
                            {track.is_public ? 'Public' : 'Private'}
                          </button>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingTrack(null)}
                              className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition" type="button">
                              Cancel
                            </button>
                            <button onClick={() => handleSaveEdit(track.id)} disabled={isSaving}
                              className="text-xs bg-brand-orange hover:bg-brand-orangeHover text-white px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-50" type="button">
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selected track quick player */}
            {currentTrack && !isCompleted && (
              <div className="mt-4 border border-gray-800 rounded-2xl p-4 bg-[#0f172a]">
                <p className="text-xs text-orange-400 font-bold mb-2 truncate">{currentTrack.title || currentTrack.prompt}</p>
                <AudioPlayer src={currentTrack.url} />
                <a href={currentTrack.url} download={`PhoneZoo_${currentTrack.id}.mp3`}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition">
                  <Download size={14} /> Download
                </a>
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 mb-12">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: '1. Describe It', desc: 'Enter a prompt, choose a genre, and set duration. Add lyrics for vocal tracks.' },
              { title: '2. AI Creates', desc: 'Our AI composes a unique track tailored to your description in seconds.' },
              { title: '3. Download', desc: 'Preview, download, or send to the ringtone maker for trimming.' },
            ].map((step, idx) => (
              <div key={idx} className="bg-[#0f172a]/50 border border-gray-800 p-6 rounded-2xl hover:border-orange-500/30 transition">
                <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center font-bold text-lg mb-4">{idx + 1}</div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support / Donate (paid plans temporarily disabled) */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-orange-500/10 border border-pink-500/20 rounded-3xl p-8 text-center">
            <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-pink-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Support PhoneZoo</h2>
            <p className="text-gray-400 mb-6">
              Enjoying PhoneZoo? If our AI tools are useful to you, consider buying us a coffee — every small support helps cover server costs and keep it free. ☕️
            </p>
            <a href={PAYPAL_DONATE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition shadow-lg shadow-pink-500/20">
              <Heart size={18} /> Donate via PayPal
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto border-t border-gray-800 pt-10 pb-10">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Is the AI Music Generator free?', a: 'Yes! You can generate 1 track per day for free, or sign up for 10 free daily generations. Upgrade to Pro or Premium for more.' },
              { q: 'How does music with lyrics work?', a: 'Premium subscribers can input lyrics and our AI will compose a full song with vocals matching your genre and mood. The AI handles melody, arrangement, and vocal performance.' },
              { q: 'What audio quality do I get?', a: 'All tracks are generated in high quality. Pro and Premium users get access to multiple download formats including WAV and FLAC.' },
              { q: 'Can I use the music commercially?', a: 'Premium plan includes a commercial license for all generated tracks. Free and Pro tracks are for personal use only.' },
            ].map((faq, idx) => (
              <div key={idx} className="group">
                <h3 className="text-lg font-semibold text-gray-200 mb-2 group-hover:text-orange-400 transition-colors">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        @keyframes bounce-in { 0% { opacity: 0; transform: translate(-50%, -20px); } 50% { transform: translate(-50%, 5px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  )
}
