'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { Sparkles, Play, Pause, Download, Scissors, X, Wand2, History, Trash2, Volume2, VolumeX, Lock, AlertCircle, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react'
import { firebaseAuth, firebaseDb } from '@/lib/firebaseClient'

const QUICK_PROMPTS = [
  { label: 'Instrumental', value: 'instrumental, no vocals, high fidelity, clear sound' },
  { label: 'Drum Loop', value: 'catchy drum loop, rhythmic, 120bpm, percussive' },
  { label: 'Piano', value: 'solo piano melody, emotional, reverb, clean' },
  { label: 'Alert', value: 'short notification sound, sharp ping, attention-grabbing' },
  { label: 'Synth', value: 'futuristic synthwave, electronic, digital, neon vibe' }
]

type ToastState = { message: string; type: 'error' | 'success' | '' }

type Track = {
  id: string
  url: string
  prompt: string
  createdAt?: string
}

function Toast({ message, type, onClose }: { message: string; type: ToastState['type']; onClose: () => void }) {
  if (!message) return null

  const bgColor = type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'
  const icon = type === 'error' ? <AlertCircle size={20} /> : <Sparkles size={20} />

  return (
    <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md text-white font-medium animate-bounce-in ${bgColor}`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100" aria-label="Close toast">
        <X size={16} />
      </button>
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
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const current = audioRef.current.currentTime
    const total = audioRef.current.duration || 0
    setProgress(total ? (current / total) * 100 : 0)
    setDuration(total)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !duration) return
    const value = Number(e.target.value)
    const newTime = (value / 100) * duration
    audioRef.current.currentTime = newTime
    setProgress(value)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    const next = !isMuted
    audioRef.current.muted = next
    setIsMuted(next)
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
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center text-white hover:bg-brand-orangeHover transition shadow-lg shadow-orange-500/20 flex-shrink-0"
          title={isPlaying ? 'Pause' : 'Play Preview'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 flex flex-col justify-center gap-1">
          <div className="flex justify-between text-xs text-gray-400 font-medium font-mono">
            <span>{formatTime(audioRef.current?.currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
            aria-label="Seek slider"
          />
        </div>

        <button onClick={toggleMute} className="text-gray-400 hover:text-white transition" aria-label="Toggle mute">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        preload="metadata"
      />
    </div>
  )
}

export default function AIRingtoneGeneratorClient() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [toast, setToast] = useState<ToastState>({ message: '', type: '' })

  const [authUser, setAuthUser] = useState<User | null>(null)
  const [history, setHistory] = useState<Track[]>([])
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)

  const userView = useMemo(() => {
    if (!authUser) return null
    return {
      uid: authUser.uid,
      email: authUser.email || '',
      name: authUser.displayName || authUser.email || 'User',
      avatar: authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.uid)}`,
    }
  }, [authUser])

  const showToast = (message: string, type: ToastState['type'] = 'error') => {
    setToast({ message, type })
    window.setTimeout(() => setToast({ message: '', type: '' }), 3000)
  }

  const loadHistory = async (u: User) => {
    const q = query(
      collection(firebaseDb, 'ringtones'),
      where('userId', '==', u.uid),
      orderBy('createdAt', 'desc'),
      limit(25),
    )

    const snap = await getDocs(q)
    const items: Track[] = snap.docs.map((d: any) => {
      const data = d.data() as any
      const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : ''
      return {
        id: d.id,
        url: data.url,
        prompt: data.prompt,
        createdAt,
      }
    })

    setHistory(items)
    setCurrentTrack(items[0] ?? null)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u: User | null) => {
      setAuthUser(u)
      if (!u) {
        try {
          const saved = localStorage.getItem('phonezoo_ringtone_history')
          if (saved) {
            const items = JSON.parse(saved)
            setHistory(items)
            if (items.length > 0) setCurrentTrack(items[0])
          } else {
            setHistory([])
            setCurrentTrack(null)
          }
        } catch {
          setHistory([])
          setCurrentTrack(null)
        }
        return
      }
      loadHistory(u).catch((e) => {
        console.error(e)
      })
    })

    return () => unsub()
  }, [])

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(firebaseAuth, provider)
      // Sync user to backend DB (Supabase/Postgres)
      const u = firebaseAuth.currentUser
      if (u?.email) {
        fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          }),
        }).catch((err) => console.warn('sync-user failed', err))
      }
      showToast('Đăng nhập thành công!', 'success')
    } catch (e: any) {
      showToast(e?.message || 'Đăng nhập thất bại', 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth)
      showToast('Đã đăng xuất', 'success')
    } catch (e: any) {
      showToast(e?.message || 'Đăng xuất thất bại', 'error')
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Vui lòng nhập mô tả âm thanh bạn muốn!', 'error')
      return
    }

    setIsGenerating(true)
    setLoadingStep('Sending to AI core...')

    try {
      const effectiveUserId = authUser?.uid || 'guest_user'
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId: effectiveUserId,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'AI error')
      }

      const audioUrl = data.audioUrl as string
      let trackId = `guest_${Date.now()}`

      if (authUser) {
        try {
          const docRef = await addDoc(collection(firebaseDb, 'ringtones'), {
            userId: authUser.uid,
            prompt,
            url: audioUrl,
            createdAt: serverTimestamp(),
          })
          trackId = docRef.id
        } catch (err) {
          console.warn('Firebase save failed for user:', err)
        }
      }

      const newTrack: Track = {
        id: trackId,
        url: audioUrl,
        prompt,
        createdAt: new Date().toISOString(),
      }

      setHistory(prev => {
        const updated = [newTrack, ...prev].slice(0, 50)
        if (!authUser) {
          try {
            localStorage.setItem('phonezoo_ringtone_history', JSON.stringify(updated))
          } catch {}
        }
        return updated
      })
      setCurrentTrack(newTrack)
      setPrompt('')
      showToast('Xong rồi! Nghe thử nào', 'success')
    } catch (e: any) {
      showToast(e?.message || 'Lỗi kết nối', 'error')
    } finally {
      setIsGenerating(false)
      setLoadingStep('')
    }
  }

  const handleDeleteTrack = async (id: string) => {
    try {
      if (authUser) {
        await deleteDoc(doc(firebaseDb, 'ringtones', id))
      }
      setHistory(prev => prev.filter(t => t.id !== id))
      if (currentTrack?.id === id) setCurrentTrack(null)
    } catch (e: any) {
      showToast(e?.message || 'Xoá thất bại', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-bg-main text-white font-sans selection:bg-orange-500/30 overflow-x-hidden pb-20">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        <div className="w-full flex justify-end mb-6">
          {userView ? (
            <div className="flex items-center gap-3">
              <img
                src={userView.avatar}
                alt="User"
                width={36}
                height={36}
                className="w-9 h-9 rounded-full bg-gray-600 object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="text-right">
                <div className="text-sm font-bold text-white leading-tight">{userView.name}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{userView.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-xs font-bold border border-red-500/20 transition"
                type="button"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-[#1e293b] hover:bg-[#2d3b55] text-white px-5 py-2 rounded-full text-xs font-semibold transition border border-gray-700 flex items-center gap-2"
              type="button"
            >
              Log in with Google
            </button>
          )}
        </div>

        <div className="w-full max-w-2xl text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            AI <span className="text-brand-orange">Ringtone Generator</span>
          </h1>

          <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
            Create custom notification sounds and unique melodies in seconds.
          </p>

          <div className="bg-[#111827] p-2 rounded-3xl border border-gray-800 shadow-2xl shadow-orange-900/10 hover:border-gray-700 transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500/50 text-left">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: '8-bit retro coin', 'Soft zen flute notification'..."
              className="w-full bg-transparent text-white placeholder-gray-600 text-lg p-4 focus:outline-none resize-none h-28 rounded-2xl"
              spellCheck={false}
              aria-label="Describe your ringtone"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between px-3 pb-3 pt-2 gap-3">
              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
                {QUICK_PROMPTS.map((item) => {
                  const isActive = prompt === item.value
                  return (
                    <button
                      key={item.label}
                      onClick={() => setPrompt(item.value)}
                      className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-lg transition border ${
                        isActive
                          ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-md shadow-orange-500/20'
                          : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border-gray-700/50'
                      }`}
                      type="button"
                    >
                      {isActive && <CheckCircle2 size={12} className="inline mr-1" />}
                      {item.label}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg min-w-[160px] ${
                  isGenerating ? 'bg-gray-700 cursor-wait' : 'bg-brand-orange hover:bg-brand-orangeHover shadow-orange-500/30'
                }`}
                aria-label="Generate Ringtone"
                type="button"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing</span>
                  </div>
                ) : (
                  <>
                    <Wand2 size={18} /> Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {isGenerating && (
            <div className="mt-4 text-orange-400 text-sm font-medium animate-pulse flex items-center justify-center gap-2">
              <Sparkles size={14} /> {loadingStep}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up mb-20">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-brand-orange" /> Current Track
              </h3>

              {currentTrack ? (
                <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-3xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

                  <div className="mb-4">
                    <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded uppercase tracking-wider">AI Generated</span>
                    <h2 className="text-lg font-bold text-white mt-2 line-clamp-1" title={currentTrack.prompt}>
                      {currentTrack.prompt}
                    </h2>
                    <p className="text-gray-400 text-sm">{currentTrack.createdAt ? new Date(currentTrack.createdAt).toLocaleString() : ''}</p>
                  </div>

                  <AudioPlayer src={currentTrack.url} />

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <a
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition border border-gray-600/50 group"
                      href={`/maker?source=${encodeURIComponent(currentTrack.url)}`}
                    >
                      <Scissors size={18} className="group-hover:rotate-90 transition-transform text-gray-400 group-hover:text-white" />
                      Cut / Edit
                    </a>
                    <a
                      href={currentTrack.url}
                      download={`PhoneZoo_AI_${currentTrack.id}.wav`}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-bold transition shadow-lg"
                      title="Download WAV"
                    >
                      <Download size={18} /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1e293b]/30 rounded-3xl p-8 text-center border border-dashed border-gray-700 text-gray-500">
                  Select a track from history to play
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="text-gray-400" /> Recent
                </h3>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{history.length}</span>
              </div>

              {!userView && history.length > 0 && (
                <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs text-blue-300">
                  <span>Sign in to save your history permanently!</span>
                  <button onClick={handleLogin} className="text-white font-bold underline" type="button">
                    Login
                  </button>
                </div>
              )}

              <div className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden max-h-[500px] overflow-y-auto no-scrollbar">
                {history.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setCurrentTrack(track)}
                    className={`p-4 border-b border-gray-800 cursor-pointer transition-colors flex items-center gap-3 group ${
                      currentTrack?.id === track.id ? 'bg-orange-500/10 border-l-4 border-l-orange-500' : 'hover:bg-gray-800 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        currentTrack?.id === track.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {currentTrack?.id === track.id ? <Sparkles size={18} className="animate-pulse" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-orange-400' : 'text-gray-300'}`}>{track.prompt}</p>
                      <p className="text-xs text-gray-500">{track.createdAt ? new Date(track.createdAt).toLocaleTimeString() : ''}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrack(track.id)
                      }}
                      className="text-gray-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-5xl mt-12 mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">How to create AI Ringtones?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: '1. Describe It', desc: "Enter a prompt like 'Funny duck quack remix' or 'Sad violin loop'." },
              { title: '2. Generate It', desc: 'Our AI model composes a unique audio track.' },
              { title: '3. Download It', desc: 'Save and set as your ringtone or notification sound.' }
            ].map((step, idx) => (
              <div key={idx} className="bg-[#111827]/50 border border-gray-800 p-6 rounded-2xl hover:border-orange-500/30 transition">
                <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center font-bold text-lg mb-4">{idx + 1}</div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl text-left border-t border-gray-800 pt-10 pb-20">
          <div className="flex items-center gap-2 mb-6 text-orange-500">
            <HelpCircle size={24} />
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <div className="group">
              <h3 className="text-lg font-semibold text-gray-200 mb-2 group-hover:text-orange-400 transition-colors">Is this AI Ringtone Generator free?</h3>
              <p className="text-gray-400 leading-relaxed">Yes. You can create ringtones during testing. Performance depends on the AI provider.</p>
            </div>
            <div className="group">
              <h3 className="text-lg font-semibold text-gray-200 mb-2 group-hover:text-orange-400 transition-colors">Why do I sometimes see errors?</h3>
              <p className="text-gray-400 leading-relaxed">Hugging Face free tier may return 503 while the model is loading. Retry after a short wait.</p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        @keyframes bounce-in {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          50% { transform: translate(-50%, 5px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  )
}
