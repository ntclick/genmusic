'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Upload, Play, Pause, SkipBack, FileAudio, Sliders, RefreshCw, Download, Sparkles, GripVertical, ChevronDown, Loader2, Check, Apple, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react'
import { transcodeWav, loadFFmpeg } from '@/lib/ffmpegClient'
import {
  decodeAudioFromUrl,
  computeWaveformBars,
  computeAudioProfile,
  findBestSegment,
  findBestMarkers,
  trimAudioBuffer,
  audioBufferToWav,
  type MarkerData,
} from '@/lib/audioAnalysis'

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function MakerPageClient() {
  const searchParams = useSearchParams()

  // Core state
  const [state, setState] = useState({
    duration: 180,
    start: 20,
    end: 60,
    playing: false,
    playhead: 20,
    format: 'mp3'
  })

  const [fileName, setFileName] = useState('song.mp3')
  const [uploadViewVisible, setUploadViewVisible] = useState(true)
  const [aiBadgeVisible, setAiBadgeVisible] = useState(false)
  const [markers, setMarkers] = useState<Array<{ id: number; timePct: number; label: string; cutStartPct: number; cutEndPct: number }>>([])
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)
  const [legalChecked, setLegalChecked] = useState(false)

  // Waveform bars as React state (not DOM)
  const [waveformBars, setWaveformBars] = useState<number[]>([])

  // Handle dragging (l/r trim handles)
  const [dragHandle, setDragHandle] = useState<'l' | 'r' | null>(null)

  // Drag & drop file upload
  const [isDragOver, setIsDragOver] = useState(false)

  // AI processing state
  const [aiProcessing, setAiProcessing] = useState(false)

  // Download state
  const [downloadState, setDownloadState] = useState<'idle' | 'processing' | 'done'>('idle')

  // Collapsible AI sections (mobile)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Refs
  const cutRegionRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const trackAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const decodedBufferRef = useRef<AudioBuffer | null>(null)
  const dragOffsetRef = useRef(0)

  // Format time helper
  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toISOString().slice(14, 21)
  }

  // Waveform bar index range
  const startBarIdx = Math.floor((state.start / 100) * waveformBars.length)
  const endBarIdx = Math.floor((state.end / 100) * waveformBars.length)

  // Initialize waveform from audio (responsive bar count)
  const initWaveform = useCallback(async () => {
    if (!audioRef.current?.src) return
    const w = window.innerWidth
    const barCount = w < 375 ? 30 : w < 768 ? 50 : 80

    try {
      const audioBuffer = await decodeAudioFromUrl(audioRef.current.src)
      decodedBufferRef.current = audioBuffer
      const bars = computeWaveformBars(audioBuffer, barCount)
      setWaveformBars(bars)
      // Preload FFmpeg in background
      loadFFmpeg().catch(() => {})
    } catch (error) {
      console.error('Error generating waveform:', error)
      // Fallback demo waveform
      setWaveformBars(Array.from({ length: barCount }, () => Math.floor(Math.random() * 60 + 20)))
    }
  }, [])

  // Get percentage from mouse/touch event
  const getPct = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!trackAreaRef.current) return 0
    const rect = trackAreaRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }, [])

  // Drag handlers for trim handles — store cursor-to-handle offset for smooth dragging
  const startDrag = useCallback((dir: 'l' | 'r') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const pct = getPct(e.nativeEvent)
    // Calculate offset between cursor position and actual handle position
    // so the handle doesn't "jump" when grabbed (grip extends outside cut region)
    setState(prev => {
      dragOffsetRef.current = pct - (dir === 'l' ? prev.start : prev.end)
      return prev // don't change state yet — wait for mousemove
    })
    setDragHandle(dir)
  }, [getPct])

  // Mouse/touch move + end for drag (with body scroll lock)
  useEffect(() => {
    if (!dragHandle) return

    // Lock body scroll during handle drag
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const rawPct = getPct(e)
      const pct = rawPct - dragOffsetRef.current // subtract cursor-to-handle offset
      if (dragHandle === 'l') {
        setState(prev => ({ ...prev, start: Math.min(Math.max(0, pct), prev.end - 5), playhead: Math.min(Math.max(0, pct), prev.end - 5) }))
      } else {
        setState(prev => ({ ...prev, end: Math.max(Math.min(100, pct), prev.start + 5) }))
      }
    }
    const endDrag = () => {
      setDragHandle(null)
      // Restore body scroll
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }

    window.addEventListener('mousemove', moveHandler)
    window.addEventListener('touchmove', moveHandler, { passive: false })
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('touchend', endDrag)

    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('touchmove', moveHandler)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('touchend', endDrag)
    }
  }, [dragHandle, getPct])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioRef.current.duration) return

    if (state.playing) {
      audioRef.current.pause()
      setState(prev => ({ ...prev, playing: false }))
    } else {
      const startTime = (state.start / 100) * audioRef.current.duration
      audioRef.current.currentTime = startTime
      audioRef.current.play()
      setState(prev => ({ ...prev, playing: true, playhead: state.start }))
    }
  }, [state.playing, state.start])

  // Skip to start
  const skipToStart = useCallback(() => {
    if (!audioRef.current || !audioRef.current.duration) return
    const startTime = (state.start / 100) * audioRef.current.duration
    audioRef.current.currentTime = startTime
    setState(prev => ({ ...prev, playhead: prev.start }))
    if (!state.playing) togglePlay()
  }, [state.start, state.playing, togglePlay])

  // Process uploaded file (shared by click + drag & drop)
  const processFile = useCallback((file: File) => {
    if (!audioRef.current) return
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 50MB.')
      return
    }
    decodedBufferRef.current = null
    // Revoke previous blob URL to prevent memory leak
    if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
      URL.revokeObjectURL(audioRef.current.src)
    }
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    audioRef.current.src = url

    audioRef.current.onloadedmetadata = () => {
      if (!audioRef.current) return
      const duration = audioRef.current.duration
      setState(prev => ({ ...prev, duration, start: 0, end: 100, playhead: 0 }))
      setUploadViewVisible(false)
      setAiBadgeVisible(false)
      setMarkers([])
      setSelectedMarkerId(null)
      initWaveform()

      // Mobile scroll hint: briefly peek at sidebar below
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollBy({ top: 80, behavior: 'smooth' })
          setTimeout(() => window.scrollBy({ top: -80, behavior: 'smooth' }), 500)
        }, 400)
      }
    }
  }, [initWaveform])

  // Handle file input change
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  // AI Auto-Cut: Onset-segment based analysis — finds best ~30s segment aligned to phrase start
  const handleAIAnalysis = useCallback(async () => {
    if (!audioRef.current?.src || !decodedBufferRef.current || aiProcessing) return
    setAiProcessing(true)

    try {
      const profile = computeAudioProfile(decodedBufferRef.current, 400)
      const result = findBestSegment(profile, state.duration, 30)
      setState(prev => ({ ...prev, start: result.startPct, end: result.endPct, playhead: result.startPct }))
      setAiBadgeVisible(true)

      // Auto-play from new position
      if (audioRef.current) {
        audioRef.current.currentTime = (result.startPct / 100) * state.duration
        if (!state.playing) {
          audioRef.current.play()
          setState(prev => ({ ...prev, playing: true }))
        }
      }
    } catch (err) {
      console.error('AI analysis failed:', err)
      setState(prev => ({ ...prev, start: 35, end: 65, playhead: 35 }))
    } finally {
      setAiProcessing(false)
    }
  }, [aiProcessing, state.duration, state.playing])

  // AI Markers: Onset-based section detection — finds phrase starts with suggested cut regions
  const handleAIMarkers = useCallback(async () => {
    if (!audioRef.current?.src || !decodedBufferRef.current || aiProcessing) return
    setAiProcessing(true)

    try {
      const profile = computeAudioProfile(decodedBufferRef.current, 400)
      const markerResults = findBestMarkers(profile, state.duration, 5, 30)

      const newMarkers = markerResults.map((m, i) => ({
        id: Date.now() + i,
        timePct: m.timePct,
        label: m.label,
        cutStartPct: m.cutStartPct,
        cutEndPct: m.cutEndPct,
      }))

      setMarkers(newMarkers)

      // Auto-select the strongest marker AND apply its cut region immediately
      const bestIdx = markerResults.reduce((bestI, m, i, arr) =>
        m.score > arr[bestI].score ? i : bestI, 0)
      const bestMarker = newMarkers[bestIdx]
      if (bestMarker) {
        setSelectedMarkerId(bestMarker.id)
        // Apply cut region so user sees immediate result
        setState(prev => ({
          ...prev,
          start: bestMarker.cutStartPct,
          end: bestMarker.cutEndPct,
          playhead: bestMarker.cutStartPct,
        }))
        // Auto-play from cut start
        if (audioRef.current) {
          audioRef.current.currentTime = (bestMarker.cutStartPct / 100) * state.duration
          if (!state.playing) {
            audioRef.current.play()
            setState(prev => ({ ...prev, playing: true }))
          }
        }
      }
      setAiBadgeVisible(true)
    } catch (err) {
      console.error('AI markers failed:', err)
    } finally {
      setAiProcessing(false)
    }
  }, [aiProcessing, state.duration, state.playing])

  // Navigate to marker
  const goToMarker = useCallback((marker: { timePct: number }) => {
    if (!audioRef.current || !audioRef.current.duration) return
    const t = (marker.timePct / 100) * audioRef.current.duration
    audioRef.current.currentTime = t
    setState(prev => ({ ...prev, playhead: marker.timePct }))
  }, [])

  // Apply marker to cut region — use marker's suggested cut boundaries
  const applyMarkerToCut = useCallback((marker: { timePct: number; cutStartPct: number; cutEndPct: number }) => {
    const start = Math.max(0, marker.cutStartPct)
    const end = Math.min(100, marker.cutEndPct)
    setState(prev => ({ ...prev, start, end, playhead: start }))

    // Auto-play from the cut start
    if (audioRef.current) {
      audioRef.current.currentTime = (start / 100) * state.duration
      if (!state.playing) {
        audioRef.current.play()
        setState(prev => ({ ...prev, playing: true }))
      }
    }
  }, [state.duration, state.playing])

  // Set export format
  const setFormat = useCallback((format: string) => {
    setState(prev => ({ ...prev, format }))
  }, [])

  // Cycle through common formats (for mobile quick-select)
  const cycleFormat = useCallback(() => {
    const formats = ['mp3', 'm4r', 'wav', 'aac', 'ogg', 'flac']
    const idx = formats.indexOf(state.format)
    setFormat(formats[(idx + 1) % formats.length])
  }, [state.format, setFormat])

  // Download handler with loading states
  const handleDownload = useCallback(async () => {
    if (!audioRef.current?.src || downloadState === 'processing') return
    setDownloadState('processing')

    try {
      const audioBuffer = decodedBufferRef.current ?? await decodeAudioFromUrl(audioRef.current.src)
      const trimmed = trimAudioBuffer(audioBuffer, state.start, state.end)
      const wavBlob = audioBufferToWav(trimmed)

      let downloadBlob = wavBlob
      let ext = 'wav'

      if (['mp3', 'm4r', 'aac', 'ogg', 'flac'].includes(state.format)) {
        try {
          downloadBlob = await transcodeWav(wavBlob, state.format as 'mp3' | 'm4r' | 'aac' | 'ogg' | 'flac')
          ext = state.format
        } catch {
          console.warn('Transcode failed, falling back to WAV')
          downloadBlob = wavBlob
          ext = 'wav'
        }
      }

      const url = URL.createObjectURL(downloadBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ringtone_${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDownloadState('done')
      setTimeout(() => setDownloadState('idle'), 2000)
    } catch (error) {
      console.error('Download error:', error)
      alert('Error downloading ringtone. Please try again.')
      setDownloadState('idle')
    }
  }, [downloadState, state.start, state.end, state.format])

  // Reset editor
  const resetEditor = () => window.location.reload()

  // Initialize on mount
  useEffect(() => {
    initWaveform()
    const handleResize = () => initWaveform()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load from URL search param (?source=...)
  useEffect(() => {
    const source = searchParams.get('source')
    if (!source || !audioRef.current) return

    const nameFromUrl = (() => {
      try {
        if (source.startsWith('data:')) return 'ai_ringtone.wav'
        const u = new URL(source)
        return u.pathname.split('/').pop() || 'ai_ringtone.wav'
      } catch { return 'ai_ringtone.wav' }
    })()

    decodedBufferRef.current = null
    setFileName(nameFromUrl)
    audioRef.current.src = source
    audioRef.current.onloadedmetadata = () => {
      if (!audioRef.current) return
      const duration = audioRef.current.duration
      setState(prev => ({ ...prev, duration, start: 0, end: 100, playhead: 0 }))
      setUploadViewVisible(false)
      setAiBadgeVisible(false)
      setMarkers([])
      setSelectedMarkerId(null)
      initWaveform()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return (
    <>
      {/* Hidden audio player */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current || !audioRef.current.duration) return
          const currentTime = audioRef.current.currentTime
          const duration = audioRef.current.duration
          const pct = (currentTime / duration) * 100
          const endTime = (state.end / 100) * duration

          setState(prev => ({ ...prev, playhead: pct }))

          // Loop back to start when reaching end
          if (currentTime >= endTime) {
            const startTime = (state.start / 100) * duration
            audioRef.current.currentTime = startTime
          }
        }}
        onEnded={() => {
          if (audioRef.current && audioRef.current.duration) {
            const startTime = (state.start / 100) * audioRef.current.duration
            audioRef.current.currentTime = startTime
          }
        }}
        preload="metadata"
      />

      <div className="flex-grow min-h-0 overflow-y-auto relative pb-20 lg:pb-0">
        {/* TOOL WIDGET */}
        <div className="w-full max-w-[1600px] flex flex-col lg:flex-row h-auto lg:h-[650px] mx-auto mt-0 lg:mt-6 lg:rounded-xl border-b lg:border border-bg-border shadow-2xl relative bg-bg-panel overflow-visible lg:overflow-hidden">

          {/* VISUALIZER AREA */}
          <div className="relative flex flex-col bg-brand-dark lg:order-2 h-maker-viz lg:flex-1 border-b border-bg-border lg:border-b-0 lg:border-l shrink-0">
            <div className={`flex flex-col h-full transition-opacity duration-500 relative ${uploadViewVisible ? 'opacity-0 pointer-events-none' : ''}`}>
              {/* Top bar */}
              <div className="h-11 sm:h-12 lg:h-12 border-b border-white/5 flex items-center justify-between px-3 sm:px-4 bg-bg-panel/80 backdrop-blur-sm z-20 absolute top-0 left-0 right-0">
                <span className="text-xs font-medium text-white truncate max-w-[180px] sm:max-w-[200px] flex items-center gap-1.5 sm:gap-2">
                  <FileAudio className="w-3 h-3 text-brand-orange shrink-0" />
                  <span className="truncate">{fileName}</span>
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {aiBadgeVisible && (
                    <div className="flex items-center gap-1 text-[11px] bg-green-500/20 text-green-400 border border-green-500/50 px-1.5 sm:px-2 py-0.5 rounded font-bold animate-pulse">
                      <span className="lg:hidden">AI</span><span className="hidden lg:inline">AI READY</span>
                    </div>
                  )}
                  <label htmlFor="file-input" className="text-xs text-brand-orange hover:text-brand-orangeHover cursor-pointer transition flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-orange/10">
                    <Upload className="w-3 h-3" />
                    <span className="hidden sm:inline">Change</span>
                  </label>
                </div>
              </div>

              {/* Waveform track area */}
              <div ref={trackAreaRef} className="flex-grow relative flex items-center justify-center overflow-hidden cursor-crosshair select-none touch-safe visualizer-bg pt-11 sm:pt-12 pb-16 sm:pb-20 px-3 sm:px-4 lg:px-6">
                {/* Waveform bars (React-driven) */}
                <div className="w-full h-full flex items-center justify-between gap-[1px] sm:gap-0 opacity-80 pointer-events-none transition-all duration-500">
                  {waveformBars.map((height, i) => {
                    const isActive = i >= startBarIdx && i <= endBarIdx
                    return (
                      <div
                        key={i}
                        className="flex-1 min-w-[3px] max-w-[8px] rounded-full transition-colors duration-200"
                        style={{
                          height: `${height}%`,
                          backgroundColor: isActive ? '#f97316' : '#334155',
                          opacity: isActive ? 1 : 0.3,
                        }}
                      />
                    )
                  })}
                </div>

                {/* AI Markers overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {markers.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMarkerId(m.id)
                        goToMarker(m)
                      }}
                      className={`absolute top-[20%] h-[60%] w-[3px] rounded-full pointer-events-auto transition-all ${
                        selectedMarkerId === m.id
                          ? 'bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.85)]'
                          : 'bg-cyan-500/70 hover:bg-cyan-300'
                      }`}
                      style={{ left: `${m.timePct}%` }}
                      title={`${m.label} (${formatTime((m.timePct / 100) * state.duration)})`}
                      aria-label={`Marker: ${m.label}`}
                    />
                  ))}
                </div>

                {/* Cut region with handles */}
                <div ref={cutRegionRef} className="absolute top-1/2 -translate-y-1/2 h-[60%] border-x-2 border-brand-primary bg-brand-orange/10 cursor-move group z-10 transition-all duration-200 touch-safe" style={{ left: `${state.start}%`, right: `${100 - state.end}%` }}>
                  <div className="handle-touch left" onMouseDown={startDrag('l')} onTouchStart={startDrag('l')}>
                    <div className="handle-grip">
                      <GripVertical className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="handle-touch right" onMouseDown={startDrag('r')} onTouchStart={startDrag('r')}>
                    <div className="handle-grip">
                      <GripVertical className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  {/* Duration badge - floats above cut region */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                    <span>{((state.end - state.start) / 100 * state.duration).toFixed(1)}s</span>
                  </div>
                </div>

                {/* Playhead */}
                <div ref={playheadRef} className="absolute top-1/2 -translate-y-1/2 h-[60%] w-0.5 bg-white shadow-[0_0_10px_white] z-20 pointer-events-none transition-all duration-75" style={{ left: `${state.playhead}%`, display: state.playing ? 'block' : 'none' }}></div>
              </div>

              {/* Transport controls - responsive sizing */}
              <div className="h-16 sm:h-20 lg:h-20 bg-bg-panel border-t border-white/5 flex items-center justify-center gap-4 sm:gap-8 z-20 absolute bottom-0 left-0 right-0 safe-pb">
                <button type="button" onClick={skipToStart} className="text-brand-text hover:text-white transition active:scale-90 p-2" aria-label="Skip to start">
                  <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button type="button" onClick={togglePlay} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center text-black active:scale-90 hover:shadow-[0_0_20px_white] transition shadow-lg" aria-label={state.playing ? 'Pause' : 'Play'}>
                  {state.playing ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 sm:ml-1 fill-black" />}
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-brand-orange transition active:scale-90 relative p-2" title="Change music" aria-label="Upload new file">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* UPLOAD VIEW with Drag & Drop */}
            <div
              className={`absolute inset-0 z-30 flex items-center justify-center bg-bg-main transition-opacity duration-300 ${uploadViewVisible ? '' : 'hidden'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                const file = e.dataTransfer.files[0]
                if (file && (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|mp4|caf|aiff)$/i.test(file.name))) {
                  processFile(file)
                }
              }}
            >
              <div
                className={`text-center w-full max-w-[280px] sm:max-w-xs lg:max-w-sm px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 rounded-2xl cursor-pointer active:scale-95 transition-all border-2 border-dashed ${
                  isDragOver
                    ? 'border-brand-orange bg-brand-orange/10 scale-105'
                    : 'border-brand-text/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border transition-all ${
                  isDragOver ? 'bg-brand-orange/20 border-brand-orange scale-110' : 'bg-brand-orange/10 border-brand-orange/20'
                }`}>
                  <Upload className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-brand-orange transition-transform ${isDragOver ? 'scale-110' : ''}`} />
                </div>
                <h2 className="font-bold text-white text-lg sm:text-xl mb-1">
                  {isDragOver ? 'Drop to Upload' : <><span className="lg:hidden">Tap to Upload</span><span className="hidden lg:inline">Click or Drag to Upload</span></>}
                </h2>
                <p className="text-xs text-brand-text">MP3, WAV, M4A &middot; Max 50MB</p>
                <input ref={fileInputRef} type="file" id="file-input" className="sr-only" accept="audio/*,.mp3,.wav,.m4a,.aac,.mp4,.caf,.aiff,.flac,.ogg" onChange={handleFileUpload} />
              </div>
            </div>
          </div>

          {/* CONTROLS SIDEBAR */}
          <aside className="w-full lg:w-[360px] flex flex-col z-20 shrink-0 h-auto lg:h-full overflow-y-auto p-4 lg:p-6 lg:order-1 border-t lg:border-t-0 lg:border-r border-bg-border bg-bg-panel">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-white font-bold text-lg sm:text-xl flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-orange" />
                Toolbox
              </h2>
              <button type="button" onClick={resetEditor} className="text-xs text-brand-text hover:text-white flex gap-1 items-center px-2 py-1 rounded hover:bg-white/5 transition" aria-label="Reset editor">
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* AI Tools — compact row on desktop, collapsible on mobile */}
            {!uploadViewVisible && (
              <div className="mb-3 lg:mb-4">
                {/* Desktop: prominent row with 2 buttons */}
                <div className="hidden lg:grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleAIAnalysis}
                    disabled={aiProcessing}
                    className="bg-gradient-to-r from-brand-orange/25 to-brand-orangeHover/20 border border-brand-orange/50 text-brand-orange font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 text-sm hover:from-brand-orange/35 hover:to-brand-orangeHover/30 hover:border-brand-orange/70 hover:shadow-[0_0_12px_rgba(255,140,50,0.15)]"
                  >
                    {aiProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Auto-Cut</>
                    )}
                  </button>
                  <button
                    onClick={handleAIMarkers}
                    disabled={aiProcessing}
                    className="bg-gradient-to-r from-brand-orange/25 to-brand-orangeHover/20 border border-brand-orange/50 text-brand-orange font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 text-sm hover:from-brand-orange/35 hover:to-brand-orangeHover/30 hover:border-brand-orange/70 hover:shadow-[0_0_12px_rgba(255,140,50,0.15)]"
                  >
                    {aiProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> AI Markers{markers.length > 0 && ` (${markers.length})`}</>
                    )}
                  </button>
                </div>

                {/* Desktop: markers list (if any) */}
                {markers.length > 0 && (
                  <div className="hidden lg:block mt-2 space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                    {markers.map(m => (
                      <div
                        key={m.id}
                        className={`p-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          selectedMarkerId === m.id
                            ? 'border-brand-orange/60 bg-brand-orange/10'
                            : 'border-bg-border bg-bg-main'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-white text-[11px]">{formatTime((m.cutStartPct / 100) * state.duration)}</span>
                          <span className="text-[10px] text-brand-text mx-1">→</span>
                          <span className="font-bold text-white text-[11px]">{formatTime((m.cutEndPct / 100) * state.duration)}</span>
                          <span className="text-[11px] text-brand-text ml-1.5">{m.label}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => { setSelectedMarkerId(m.id); goToMarker(m) }} className="px-2 py-1 text-[11px] rounded bg-white/10 hover:bg-white/20">Go</button>
                          <button type="button" onClick={() => applyMarkerToCut(m)} className="px-2 py-1 text-[11px] rounded bg-brand-orange text-black font-bold hover:opacity-90">Cut</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile: collapsible AI Auto-Cut */}
                <div className="lg:hidden mb-2 bg-brand-orange/5 border border-brand-orange/20 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'ai-cut' ? null : 'ai-cut')}
                    className="w-full flex items-center justify-between p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      AI Auto-Cut
                    </div>
                    <ChevronDown className={`w-4 h-4 text-brand-orange transition-transform duration-200 ${expandedSection === 'ai-cut' ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSection === 'ai-cut' && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <button
                        onClick={handleAIAnalysis}
                        disabled={aiProcessing}
                        className="w-full bg-gradient-to-r from-brand-orange to-brand-orangeHover text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-2 disabled:opacity-50 transition-all active:scale-95 shadow-lg text-sm"
                      >
                        {aiProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Find Best Chorus'}
                      </button>
                      <p className="text-[11px] text-brand-text text-center">Detects high energy peaks automatically.</p>
                    </div>
                  )}
                </div>

                {/* Mobile: collapsible AI Markers */}
                <div className="lg:hidden bg-brand-orange/5 border border-brand-orange/20 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(expandedSection === 'ai-markers' ? null : 'ai-markers')}
                    className="w-full flex items-center justify-between p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      AI Markers
                      {markers.length > 0 && (
                        <span className="bg-brand-orange text-black text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-1">{markers.length}</span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-brand-orange transition-transform duration-200 ${expandedSection === 'ai-markers' ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSection === 'ai-markers' && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <button
                        onClick={handleAIMarkers}
                        disabled={aiProcessing}
                        className="w-full bg-gradient-to-r from-brand-orange to-brand-orangeHover text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-3 disabled:opacity-50 transition-all active:scale-95 shadow-lg text-sm"
                      >
                        {aiProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Find Key Moments'}
                      </button>
                      <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                        {markers.length === 0 ? (
                          <p className="text-[11px] text-brand-text text-center">No markers yet.</p>
                        ) : (
                          markers.map(m => (
                            <div
                              key={m.id}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                                selectedMarkerId === m.id ? 'border-brand-orange/60 bg-brand-orange/10' : 'border-bg-border bg-bg-main'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">
                                  {formatTime((m.cutStartPct / 100) * state.duration)}
                                  <span className="text-brand-text mx-1">→</span>
                                  {formatTime((m.cutEndPct / 100) * state.duration)}
                                </div>
                                <div className="text-[11px] text-brand-text truncate">{m.label}</div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button type="button" onClick={() => { setSelectedMarkerId(m.id); goToMarker(m) }} className="px-2.5 py-1.5 text-[11px] rounded bg-white/10 hover:bg-white/20 min-h-[32px]">Go</button>
                                <button type="button" onClick={() => applyMarkerToCut(m)} className="px-2.5 py-1.5 text-[11px] rounded bg-brand-orange text-black font-bold hover:opacity-90 min-h-[32px]">Apply</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Start / End time display */}
            <div className="grid grid-cols-2 gap-3 mb-4 lg:mb-6">
              <div>
                <label className="text-[11px] uppercase text-brand-text font-bold block mb-1">Start</label>
                <input type="text" value={formatTime((state.start / 100) * state.duration)} readOnly className="w-full py-2 sm:py-2.5 outline-none bg-bg-main border border-bg-border text-white text-center rounded-lg font-mono text-sm" />
              </div>
              <div>
                <label className="text-[11px] uppercase text-brand-text font-bold block mb-1">End</label>
                <input type="text" value={formatTime((state.end / 100) * state.duration)} readOnly className="w-full py-2 sm:py-2.5 outline-none bg-bg-main border border-bg-border text-white text-center rounded-lg font-mono text-sm" />
              </div>
            </div>

            {/* Export format */}
            <div className="mb-4">
              <label className="text-[11px] uppercase text-brand-text font-bold block mb-2">Export Format</label>
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                {[
                  { format: 'wav', label: 'WAV', sub: 'Compatibility' },
                  { format: 'mp3', label: 'MP3', sub: 'Most devices' },
                  { format: 'm4r', label: 'M4R', sub: 'iPhone' },
                  { format: 'aac', label: 'AAC', sub: 'Mobile' },
                  { format: 'ogg', label: 'OGG', sub: 'Web' },
                  { format: 'flac', label: 'FLAC', sub: 'Lossless' }
                ].map(({ format, label, sub }) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setFormat(format)}
                    className={`px-2 sm:px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center rounded-xl border ${
                      state.format === format
                        ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-primary'
                        : 'bg-bg-main border-bg-border text-brand-text hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold text-xs">{label}</span>
                    <small className="text-[11px] text-brand-muted">{sub}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Download section (sidebar — hidden on mobile, shown on desktop) */}
            <div className="mt-4 pt-4 border-t border-white/5 pb-6 hidden lg:block">
              <label className="flex items-center gap-2 cursor-pointer group mb-3 justify-center">
                <input type="checkbox" checked={legalChecked} onChange={(e) => setLegalChecked(e.target.checked)} className="accent-brand-orange w-3.5 h-3.5 rounded" />
                <span className="text-[11px] text-brand-text">
                  I own rights. <Link href="/dmca" className="underline">DMCA</Link>.
                </span>
              </label>
              <button
                onClick={handleDownload}
                disabled={!legalChecked || uploadViewVisible || downloadState === 'processing'}
                className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-lg ${
                  downloadState === 'done'
                    ? 'bg-green-500 text-white'
                    : legalChecked && !uploadViewVisible
                      ? 'bg-brand-orange text-white'
                      : 'bg-brand-muted/20 text-brand-muted cursor-not-allowed opacity-50'
                }`}
              >
                {downloadState === 'processing' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> <span>Processing...</span></>
                ) : downloadState === 'done' ? (
                  <><Check className="w-4 h-4" /> <span>Done!</span></>
                ) : (
                  <><span>Download Ringtone</span> <Download className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Mobile-only: Download section inline (visible below lg, above sticky bar as secondary) */}
            <div className="mt-3 pt-3 border-t border-white/5 pb-4 lg:hidden">
              <label className="flex items-center gap-2 cursor-pointer group mb-3 justify-center">
                <input type="checkbox" checked={legalChecked} onChange={(e) => setLegalChecked(e.target.checked)} className="accent-brand-orange w-4 h-4 rounded" />
                <span className="text-[11px] text-brand-text">
                  I own rights to this audio. <Link href="/dmca" className="underline">DMCA</Link>.
                </span>
              </label>
            </div>
          </aside>
        </div>

        {/* SEO CONTENT */}
        <section className="max-w-6xl w-full px-4 sm:px-6 py-12 sm:py-16 mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-white leading-tight">Best iPhone Ringtone Maker & Android Converter</h1>
            <p className="text-brand-text text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              Looking for a <strong className="text-brand-orange">free ringtone maker</strong>? Phonezoo is the ultimate web-based <strong>ringtone creator</strong> that lets you turn any song into a custom ringtone for iPhone or Android. No app install needed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 sm:p-8 hover:border-brand-orange/40 transition duration-300">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center text-brand-orange shrink-0">
                  <Apple className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">iPhone Ringtone Maker</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">Convert MP3 to M4R instantly. The only tool you need to <strong>create iPhone ringtone</strong> files without iTunes.</p>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 sm:p-8 hover:border-brand-orange/40 transition duration-300">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Ringtone Maker Android</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">Create high-quality MP3 notifications. Use our <strong>ringtone cutter</strong> to trim start/end times precisely.</p>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 sm:p-8 hover:border-brand-orange/40 transition duration-300">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">AI Auto-Cut</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">Don&apos;t know where to cut? Let our AI find the best chorus for your <strong>phone ringtone download</strong>.</p>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 sm:p-8 hover:border-brand-orange/40 transition duration-300">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">100% Free & Secure</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">Better than any <strong>best iphone ringtone app</strong>. We process files locally in your browser.</p>
            </div>
          </div>

          <div className="mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-8 sm:mb-10 text-center flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" />
              How to use Phonezoo Ringtone Editor?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
              <div className="bg-bg-main border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:border-brand-orange hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition duration-300">
                <span className="text-brand-orange text-3xl sm:text-4xl font-extrabold mb-3 sm:mb-4 block">1. Upload</span>
                <p className="text-xs text-brand-text">Select MP3, WAV or M4A file from your library.</p>
              </div>
              <div className="bg-bg-main border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:border-brand-orange hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition duration-300">
                <span className="text-brand-orange text-3xl sm:text-4xl font-extrabold mb-3 sm:mb-4 block">2. Edit</span>
                <p className="text-xs text-brand-text">Drag handles or use AI to select the loop.</p>
              </div>
              <div className="bg-bg-main border border-white/10 rounded-2xl p-6 sm:p-8 text-center hover:border-brand-orange hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition duration-300">
                <span className="text-brand-orange text-3xl sm:text-4xl font-extrabold mb-3 sm:mb-4 block">3. Download</span>
                <p className="text-xs text-brand-text">Save as M4R (iOS) or MP3 (Android).</p>
              </div>
            </div>
            <p className="text-center text-sm text-brand-text mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/5 max-w-2xl mx-auto">
              Looking for a <strong>best iphone ringtone app</strong> alternative? Phonezoo provides the same features for free on the web. It&apos;s the simplest way to <strong>create iphone ringtone</strong> files from your music library. Start your <strong>phone ringtone download</strong> journey today.
            </p>
          </div>
        </section>

        {/* Detailed Guide Section for SEO */}
        <section className="py-8 sm:py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-invert prose-sm max-w-none text-brand-text">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">Complete Guide: How to Make a Custom Ringtone</h2>

              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-3">Supported Audio Formats</h3>
                  <p className="leading-relaxed mb-3">
                    Our Ringtone Maker accepts all common audio formats including MP3, WAV, M4A, OGG, FLAC, and AAC.
                    You can upload files up to 50MB in size. Once uploaded, you can export your trimmed ringtone in
                    any of these output formats:
                  </p>
                  <ul className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 list-none pl-0">
                    <li className="bg-bg-panel border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-sm"><strong className="text-white">MP3</strong> — Universal, works on all Android phones</li>
                    <li className="bg-bg-panel border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-sm"><strong className="text-white">M4R</strong> — Native iPhone/iOS ringtone format</li>
                    <li className="bg-bg-panel border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-sm"><strong className="text-white">WAV</strong> — Lossless, highest audio quality</li>
                    <li className="bg-bg-panel border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-sm"><strong className="text-white">FLAC</strong> — Lossless compressed format</li>
                    <li className="bg-bg-panel border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-sm"><strong className="text-white">AAC</strong> — High quality, small file size</li>
                    <li className="bg-bg-panel border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-sm"><strong className="text-white">OGG</strong> — Open-source audio format</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-3">How to Set Your Ringtone on iPhone</h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Download your ringtone in <strong className="text-white">M4R format</strong> from Phonezoo</li>
                    <li>Open the file with <strong className="text-white">GarageBand</strong> on your iPhone</li>
                    <li>Tap the <strong className="text-white">Share</strong> icon and select <strong className="text-white">&quot;Ringtone&quot;</strong></li>
                    <li>Name your ringtone and tap <strong className="text-white">Export</strong></li>
                    <li>Go to <strong className="text-white">Settings &gt; Sounds &amp; Haptics &gt; Ringtone</strong> and select your new tone</li>
                  </ol>
                  <p className="mt-2 text-xs italic">Alternative: Connect your iPhone to a Mac, drag the M4R file into the Tones section in Finder.</p>
                </div>

                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-3">How to Set Your Ringtone on Android</h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Download your ringtone in <strong className="text-white">MP3 format</strong> from Phonezoo</li>
                    <li>Go to <strong className="text-white">Settings &gt; Sound &amp; Vibration &gt; Phone Ringtone</strong></li>
                    <li>Tap <strong className="text-white">&quot;Add Ringtone&quot;</strong> and select the downloaded file</li>
                    <li>Your new ringtone is now set and ready to use</li>
                  </ol>
                  <p className="mt-2 text-xs italic">Tip: On Samsung phones, you can also use the &quot;My Files&quot; app to move MP3s directly to the Ringtones folder.</p>
                </div>

                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-3">Privacy &amp; Security</h3>
                  <p className="leading-relaxed">
                    Phonezoo&apos;s Ringtone Maker uses <strong className="text-white">FFmpeg WebAssembly</strong> technology to process
                    audio entirely within your web browser. Your audio files are never uploaded to any server —
                    all trimming, converting, and exporting happens locally on your device. This means your music
                    files remain completely private and secure throughout the entire process.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      {/* MOBILE STICKY DOWNLOAD BAR — fixed at bottom, only on mobile, only after upload */}
      {!uploadViewVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden bg-bg-panel/95 backdrop-blur-md border-t border-bg-border mobile-download-bar">
          <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3">
            {/* Format quick-cycle button */}
            <button
              type="button"
              onClick={cycleFormat}
              className="shrink-0 px-3 py-2.5 rounded-lg bg-bg-main border border-bg-border text-white text-xs font-bold uppercase min-w-[52px] text-center active:scale-95 transition"
              aria-label={`Current format: ${state.format.toUpperCase()}. Tap to change.`}
            >
              {state.format.toUpperCase()}
            </button>

            {/* Download button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={!legalChecked || downloadState === 'processing'}
              className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg text-sm ${
                downloadState === 'done'
                  ? 'bg-green-500 text-white'
                  : legalChecked
                    ? 'bg-brand-orange text-white'
                    : 'bg-brand-muted/20 text-brand-muted cursor-not-allowed opacity-50'
              }`}
            >
              {downloadState === 'processing' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing</>
              ) : downloadState === 'done' ? (
                <><Check className="w-4 h-4" /> Done!</>
              ) : (
                <><Download className="w-4 h-4" /> Download</>
              )}
            </button>

            {/* Legal checkbox compact */}
            <label className="shrink-0 flex items-center gap-1.5 cursor-pointer p-1">
              <input
                type="checkbox"
                checked={legalChecked}
                onChange={(e) => setLegalChecked(e.target.checked)}
                className="accent-brand-orange w-4 h-4 rounded"
              />
              <span className="text-[11px] text-brand-text leading-tight hidden xs:block">Rights<br />owned</span>
            </label>
          </div>
        </div>
      )}
    </>
  )
}
