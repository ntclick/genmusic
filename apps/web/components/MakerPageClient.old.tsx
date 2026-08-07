'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Scissors, Upload, Play, Pause, Filter, Check, Loader2, Volume2, VolumeX, Lightbulb, RefreshCcw, Download, Repeat, SkipBack, FileAudio } from 'lucide-react' // NEW: Import Lucide React components

export default function MakerPageClient() {
  const [state, setState] = useState({
    duration: 180,
    start: 20,
    end: 60,
    playing: false,
    playhead: 20,
    format: 'mp3'
  })

  const [fileName, setFileName] = useState('song.mp3')
  const [aiBadgeVisible, setAiBadgeVisible] = useState(false)
  const [aiScannerVisible, setAiScannerVisible] = useState(false)
  const [legalChecked, setLegalChecked] = useState(false)
  const [isUploadViewVisible, setIsUploadViewVisible] = useState(true) // NEW: State for upload view
  const [isAiButtonEnabled, setIsAiButtonEnabled] = useState(false) // NEW: Control AI button state
  const [isDownloadButtonEnabled, setIsDownloadButtonEnabled] = useState(false) // NEW: Control download button state
  const [isHeaderExportEnabled, setIsHeaderExportEnabled] = useState(false) // NEW: Control header export button state
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null) // Track audio URL for cleanup

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid audio file (MP3, WAV, or M4A)')
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 50MB')
      return
    }

    // Update filename state
    setFileName(file.name)

    // Create audio element for playback
    const audio = document.getElementById('audio-player') as HTMLAudioElement
    if (audio) {
      // Cleanup previous URL to prevent memory leak
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl)
      }
      
      const url = URL.createObjectURL(file)
      setCurrentAudioUrl(url)
      audio.src = url
      audio.load()

      // Wait for metadata to load
      audio.addEventListener('loadedmetadata', () => {
        setState(prev => ({
          ...prev,
          duration: audio.duration,
          start: 0,
          end: 100,
          playhead: 0
        }))

        // Switch to editor view and enable buttons
        setIsUploadViewVisible(false)
        setIsAiButtonEnabled(true)
        setIsDownloadButtonEnabled(true)
        setIsHeaderExportEnabled(true)

        // Initialize waveform
        initWaveform()
      }, { once: true })
    }
  }

  const waveformRef = useRef<HTMLDivElement>(null)
  const cutRegionRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)
  const trackAreaRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)


  // Haptic feedback for mobile
  const triggerHapticFeedback = () => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  // Update visuals
  const updateVisuals = useCallback(() => {
    if (cutRegionRef.current) {
      cutRegionRef.current.style.left = state.start + '%'
      cutRegionRef.current.style.right = (100 - state.end) + '%'
    }
    if (playheadRef.current) {
      playheadRef.current.style.left = state.playhead + '%'
    }

    // Update time displays
    const total = state.duration
    const startS = (state.start / 100) * total
    const endS = (state.end / 100) * total

    const startTimeInput = document.getElementById('start-time') as HTMLInputElement
    const endTimeInput = document.getElementById('end-time') as HTMLInputElement
    const durationText = document.getElementById('selection-duration')

    if (startTimeInput) startTimeInput.value = formatTime(startS)
    if (endTimeInput) endTimeInput.value = formatTime(endS)
    if (durationText) durationText.innerText = (endS - startS).toFixed(1) + 's'

    // Update waveform bars
    const bars = waveformRef.current?.children
    if (bars) {
      const sIdx = Math.floor(state.start / 100 * bars.length)
      const eIdx = Math.floor(state.end / 100 * bars.length)
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement
        if (i >= sIdx && i <= eIdx) {
          bar.style.backgroundColor = '#f97316' // Brand orange
          bar.style.opacity = '1'
        } else {
          bar.style.backgroundColor = '#334155' // Slate 700 for inactive
          bar.style.opacity = '0.3'
        }
      }
    }
  }, [state.start, state.end, state.playhead, state.duration, cutRegionRef, playheadRef, waveformRef]);

  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toISOString().substr(14, 7)
  }

  // Event handlers
  const togglePlay = useCallback(() => {
    const audio = document.getElementById('audio-player') as HTMLAudioElement
    if (!audio) return

    if (state.playing) {
      audio.pause()
      setState(prev => ({ ...prev, playing: false }))
      // Pause: clear interval
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    } else {
      // Play logic
      // Seek to start position if not in selection range
      const startTime = (state.start / 100) * state.duration
      const endTime = (state.end / 100) * state.duration
      const currentTime = audio.currentTime

      if (currentTime < startTime || currentTime > endTime) {
        audio.currentTime = startTime
      }

      audio.play()
      setState(prev => ({ ...prev, playing: true }))
    }
  }, [state.playing, state.start, state.end, state.duration]);

  const setFormat = (format: string, element: HTMLElement) => {
    // Remove active class from all format buttons
    document.querySelectorAll('.fmt-btn').forEach(btn => btn.classList.remove('active'))
    // Add active class to clicked button
    element.classList.add('active')
    setState(prev => ({ ...prev, format }))

    const dlText = document.getElementById('dl-text')
    if (dlText) dlText.innerText = `Export ${format.toUpperCase()}`
  }

  const resetEditor = () => {
    window.location.reload()
  }

  const analyzeAudioPeaks = useCallback(async () => {
    const audio = document.getElementById('audio-player') as HTMLAudioElement
    if (!audio || !audio.src) return null

    try {
      const response = await fetch(audio.src)
      const arrayBuffer = await response.arrayBuffer()
      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const raw = audioBuffer.getChannelData(0)
      const duration = audioBuffer.duration

      const windowSize = Math.floor(raw.length / 100)
      const energyLevels: number[] = []

      for (let i = 0; i < 100; i++) {
        let sum = 0
        const start = i * windowSize
        const end = Math.min(start + windowSize, raw.length)
        
        for (let j = start; j < end; j++) {
          sum += raw[j] * raw[j]
        }
        
        const rms = Math.sqrt(sum / (end - start))
        energyLevels.push(rms)
      }

      const smoothed = energyLevels.map((val, idx) => {
        const start = Math.max(0, idx - 2)
        const end = Math.min(energyLevels.length, idx + 3)
        const window = energyLevels.slice(start, end)
        return window.reduce((a, b) => a + b, 0) / window.length
      })

      let maxEnergy = 0
      let bestStart = 0
      const targetDuration = 30
      const targetWindows = Math.floor((targetDuration / duration) * 100)

      for (let i = 0; i <= smoothed.length - targetWindows; i++) {
        let windowEnergy = 0
        for (let j = i; j < i + targetWindows; j++) {
          windowEnergy += smoothed[j]
        }
        
        if (windowEnergy > maxEnergy) {
          maxEnergy = windowEnergy
          bestStart = i
        }
      }

      const startPct = bestStart
      const endPct = Math.min(bestStart + targetWindows, 100)

      return { start: startPct, end: endPct }
    } catch (error) {
      console.error('Error analyzing audio peaks:', error)
      return null
    }
  }, [])

  const handleAIAnalysis = useCallback(async () => {
    if (!isAiButtonEnabled) return

    setIsAiButtonEnabled(false)
    setAiScannerVisible(true)

    const result = await analyzeAudioPeaks()
    
    setTimeout(() => {
      setIsAiButtonEnabled(true)
      
      if (result) {
        setState(prev => ({ ...prev, start: result.start, end: result.end, playhead: result.start }))
      } else {
        setState(prev => ({ ...prev, start: 35, end: 65, playhead: 35 }))
      }
      
      setAiBadgeVisible(true)

      setTimeout(() => {
        if (!state.playing) togglePlay()
      }, 500)
    }, 1500)
  }, [isAiButtonEnabled, analyzeAudioPeaks, state.playing, togglePlay])

  const handleDownload = () => {
    const dlBtn = document.getElementById('dl-btn') as HTMLButtonElement
    const legalCheck = document.getElementById('legal-check') as HTMLInputElement

    if (!dlBtn || !legalCheck) return
    if (dlBtn.disabled || !legalCheck.checked) return

    const originalText = dlBtn.innerHTML
    dlBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...'

    setTimeout(() => {
      dlBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Saved!'
      dlBtn.classList.replace('bg-brand-orange', 'bg-green-500')

      setTimeout(() => {
        dlBtn.innerHTML = originalText
        dlBtn.classList.replace('bg-green-500', 'bg-brand-orange')
      }, 2000)
    }, 1500)
  }

  // Fallback demo waveform function
  const initDemoWaveform = useCallback(() => {
    if (!waveformRef.current) return

    waveformRef.current.innerHTML = ''
    const barCount = window.innerWidth < 768 ? 40 : 80

    // Demo heights for consistent rendering when no audio loaded
    const heights = [35, 65, 45, 75, 25, 55, 85, 40, 60, 30, 70, 50, 80]

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div')
      bar.className = 'w-1 md:w-1.5 rounded-full transition-all duration-200'
      bar.style.height = heights[i % heights.length] + '%'
      waveformRef.current.appendChild(bar)
    }
    updateVisuals()
  }, [updateVisuals]);

  // Waveform generation
  const initWaveform = useCallback(async () => {
    if (!waveformRef.current) return

    const audio = document.getElementById('audio-player') as HTMLAudioElement
    if (!audio || !audio.src) {
      // Fallback to demo waveform if no audio loaded
      initDemoWaveform()
      return
    }

    try {
      // Generate real waveform from audio file
      waveformRef.current.innerHTML = ''
      const barCount = window.innerWidth < 768 ? 40 : 80

      // Fetch audio data
      const response = await fetch(audio.src)
      const arrayBuffer = await response.arrayBuffer()

      // Decode audio data
      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

      // Get raw audio samples (use first channel)
      const raw = audioBuffer.getChannelData(0)
      const samplesPerBar = Math.floor(raw.length / barCount)

      for (let i = 0; i < barCount; i++) {
        // Calculate RMS amplitude for this bar
        let sum = 0
        for (let j = 0; j < samplesPerBar; j++) {
          const sample = raw[i * samplesPerBar + j]
          sum += sample * sample
        }
        const rms = Math.sqrt(sum / samplesPerBar)

        // Convert to percentage height (min 10%, max 90%)
        const height = Math.max(10, Math.min(90, rms * 100))

        const bar = document.createElement('div')
        bar.className = 'w-1 md:w-1.5 rounded-full transition-all duration-200'
        bar.style.height = height + '%'
        waveformRef.current.appendChild(bar)
      }

      updateVisuals()
    } catch (error) {
      console.error('Error generating real waveform:', error)
      // Fallback to demo waveform
      initDemoWaveform()
    }
  }, [updateVisuals, initDemoWaveform, waveformRef]);

  // Initialize on mount
  useEffect(() => {
    initWaveform()

    // Handle window resize
    const handleResize = () => initWaveform()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [initWaveform])

  // Add drag and touch handling
  useEffect(() => {
    let isDragging = false
    let dragSide: 'left' | 'right' | null = null

    const getPct = (e: MouseEvent | TouchEvent) => {
      if (!trackAreaRef.current) return 0
      const rect = trackAreaRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    }

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('#handle-left')) {
        isDragging = true
        dragSide = 'left'
        triggerHapticFeedback()
        e.preventDefault()
      } else if (target.closest('#handle-right')) {
        isDragging = true
        dragSide = 'right'
        triggerHapticFeedback()
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragSide) return

      const pct = getPct(e)
      if (dragSide === 'left') {
        setState(prev => ({ ...prev, start: Math.min(pct, prev.end - 5) }))
      } else {
        setState(prev => ({ ...prev, end: Math.max(pct, prev.start + 5) }))
      }
    }

    const handleMouseUp = () => {
      isDragging = false
      dragSide = null
    }

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('#handle-left')) {
        isDragging = true
        dragSide = 'left'
        triggerHapticFeedback()
        e.preventDefault()
      } else if (target.closest('#handle-right')) {
        isDragging = true
        dragSide = 'right'
        triggerHapticFeedback()
        e.preventDefault()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragSide) return
      e.preventDefault()

      const pct = getPct(e)
      if (dragSide === 'left') {
        setState(prev => ({ ...prev, start: Math.min(pct, prev.end - 5) }))
      } else {
        setState(prev => ({ ...prev, end: Math.max(pct, prev.start + 5) }))
      }
    }

    const handleTouchEnd = () => {
      isDragging = false
      dragSide = null
    }

    // Track area click
  const handleTrackClick = (e: MouseEvent) => {
    if (isDragging) return
    const pct = getPct(e)
    const audio = document.getElementById('audio-player') as HTMLAudioElement

    if (!audio) return

    setState(prev => ({ ...prev, playhead: pct }))

      if (audio) {
        const time = (pct / 100) * state.duration
        audio.currentTime = time
        if (!state.playing) {
          audio.play()
          setState(prev => ({ ...prev, playing: true }))
        }
      }
    }

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    const trackArea = trackAreaRef.current
    if (trackArea) {
      trackArea.addEventListener('click', handleTrackClick)
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)

      if (trackArea) {
        trackArea.removeEventListener('click', handleTrackClick)
      }
    }
  }, [state.duration, state.playing])

  // Add global window functions
  useEffect(() => {
    // Add window functions for global access
    const skipToStart = () => {
      const audio = document.getElementById('audio-player') as HTMLAudioElement
      if (!audio) return

      const startTime = (state.start / 100) * state.duration

      setState(prev => ({ ...prev, playhead: state.start }))

      if (audio) {
        audio.currentTime = startTime
        if (!state.playing) {
          audio.play()
          setState(prev => ({ ...prev, playing: true }))
        }
      }
    }

    const setFormat = (format: string, element: HTMLElement) => {
      // Remove active class from all format buttons
      document.querySelectorAll('.fmt-btn').forEach(btn => btn.classList.remove('active'))
      // Add active class to clicked button
      element.classList.add('active')
      setState(prev => ({ ...prev, format }))

      const dlText = document.getElementById('dl-text')
      if (dlText) dlText.innerText = `Export ${format.toUpperCase()}`
    }

    const resetEditor = () => {
      window.location.reload()
    }

    // Attach to window
    ;(window as any).skipToStart = skipToStart
    ;(window as any).setFormat = setFormat
    ;(window as any).resetEditor = resetEditor

    return () => {
      delete (window as any).skipToStart
      delete (window as any).setFormat
      delete (window as any).resetEditor
    }
  }, [state.playing, state.start, state.duration])

  // Update visuals when state changes
  useEffect(() => {
    updateVisuals()
  }, [state, updateVisuals])

  // Update waveform bars when selection changes
  useEffect(() => {
    const bars = waveformRef.current?.children
    if (bars) {
      const sIdx = Math.floor(state.start / 100 * bars.length)
      const eIdx = Math.floor(state.end / 100 * bars.length)
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement
        if (i >= sIdx && i <= eIdx) {
          bar.classList.add('bar-active')
          bar.style.opacity = '1'
        } else {
          bar.classList.remove('bar-active')
          bar.style.opacity = '0.3'
        }
      }
    }
  }, [state.start, state.end, state.playhead])

  const skipBack = useCallback(() => {
    const audio = document.getElementById('audio-player') as HTMLAudioElement
    if (!audio) return

    audio.currentTime = 0;
    setState(prev => ({ ...prev, playhead: 0 }));
    if (state.playing) {
      togglePlay(); // Re-toggle play to restart properly
    }
  }, [state.playing, togglePlay]);

  const resetPlayhead = useCallback(() => {
    setState(prev => ({ ...prev, playhead: prev.start }));
  }, []);

  return (
    <div className="h-full flex flex-col safe-pt safe-pb">
      {/* HEADER */}
      <header className="h-14 border-b border-bg-border bg-bg-panel flex items-center justify-between px-4 safe-pl safe-pr sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-brand-text hover:text-white transition group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium text-sm">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">Ringtone <span className="text-brand-orange">Maker</span></span>
          </div>
        </div>

        <button className="btn-primary text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95" id="header-export-btn" disabled={!isHeaderExportEnabled}>
          Download
        </button>
      </header>

      {/* MAIN SCROLLABLE WRAPPER */}
      <div className="flex-grow overflow-y-auto relative">
        {/* EDITOR VIEW */}
        <div
          id="editor-view"
          className="w-full max-w-[1600px] mx-auto mt-0 lg:mt-6 opacity-100"
        >
          {/* TOOL WIDGET */}
          <div className="w-full max-w-[1600px] flex flex-col lg:flex-row h-[calc(100vh-200px)] lg:h-[650px] mx-auto mt-0 lg:mt-6 lg:rounded-xl border-b lg:border border-bg-border shadow-2xl relative bg-bg-panel overflow-hidden">

          {/* VISUALIZER AREA */}
          <div className="relative flex flex-col bg-brand-dark lg:order-2 min-h-[50vh] lg:h-full lg:flex-1 border-b border-bg-border lg:border-b-0 lg:border-l shrink-0">
              <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-bg-panel/80 backdrop-blur-sm z-20">
                <span className="text-xs font-medium text-white truncate max-w-[200px] flex items-center gap-2">
                  <FileAudio className="w-3 h-3 text-brand-orange" />
                  <span>{fileName}</span>
                </span>
                <div className="flex items-center gap-2">
                  {aiBadgeVisible && (
                    <div className="flex items-center gap-1 text-[9px] bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-0.5 rounded font-bold animate-pulse">
                      AI READY
                    </div>
                  )}
                  <label htmlFor="file-input" className="text-xs text-brand-orange hover:text-brand-orangeHover cursor-pointer transition flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-orange/10">
                    <Upload className="w-3 h-3" />
                    <span className="hidden sm:inline">Change</span>
                  </label>
                </div>
              </div>

              <div id="track-area" ref={trackAreaRef} className="flex-grow relative flex items-center justify-center overflow-hidden cursor-crosshair select-none touch-safe visualizer-bg pt-12 pb-24 lg:pt-12 lg:pb-20">
                
                {/* UPLOAD OVERLAY */}
                {isUploadViewVisible && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/95 backdrop-blur-sm">
                    <div className="text-center w-full max-w-xs px-6">
                      <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-orange/20">
                        <Upload className="w-8 h-8 text-brand-orange" />
                      </div>
                      <h2 className="font-bold text-white text-xl mb-2">Click to Upload</h2>
                      <p className="text-xs text-brand-text mb-4">MP3, WAV, M4A</p>
                      <input type="file" id="file-input" className="hidden" accept="audio/*" onChange={handleFileSelect} />
                      <label htmlFor="file-input" className="inline-block bg-brand-orange hover:bg-brand-orangeHover text-white font-bold py-3 px-6 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg">
                        Choose File
                      </label>
                      <p className="text-xs text-brand-text mt-3">Max size: 50MB</p>
                    </div>
                  </div>
                )}

                <div id="ai-playhead-scanner" className={`absolute top-0 bottom-0 w-0.5 bg-brand-orange shadow-[0_0_20px_#f97316] z-10 ${aiScannerVisible ? 'animate-scan' : 'hidden'} pointer-events-none`}></div>
                <div id="playhead" className="absolute top-16 bottom-24 lg:top-12 lg:bottom-20 w-0.5 bg-white z-25 pointer-events-none shadow-[0_0_10px_white]" style={{ left: `${state.playhead}%` }}></div>
                <div id="waveform-container" ref={waveformRef} className="w-full h-full px-4 flex items-center justify-center gap-[2px] opacity-80 transition-all duration-500"></div>

                <div id="cut-region" ref={cutRegionRef} className="absolute top-16 bottom-24 lg:top-12 lg:bottom-20 border-x-2 border-brand-primary bg-brand-orange/10 cursor-move group z-10 transition-all duration-200 touch-safe selection-box" style={{ left: `${state.start}%`, right: `${100 - state.end}%` }}>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                    <span id="selection-duration">{((state.end - state.start) / 100 * state.duration).toFixed(1)}s</span>
                  </div>
                </div>

                <div className="handle-touch left absolute top-16 bottom-24 lg:top-12 lg:bottom-20 z-20" id="handle-left" onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} style={{ left: `${state.start}%` }}>
                  <div className="handle-grip">
                    <RefreshCcw className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div className="handle-touch right absolute top-16 bottom-24 lg:top-12 lg:bottom-20 z-20" id="handle-right" onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} style={{ left: `${state.end}%` }}>
                  <div className="handle-grip">
                    <RefreshCcw className="w-4 h-4 text-black rotate-180" />
                  </div>
                </div>

                <div id="playhead-live" ref={playheadRef} className="absolute top-16 bottom-24 lg:top-12 lg:bottom-20 w-0.5 bg-white shadow-[0_0_10px_white] z-20 pointer-events-none" style={{ left: `${state.playhead}%` }}></div>
                  </div>

              <div className="h-24 lg:h-20 bg-bg-panel border-t border-white/5 flex items-center justify-center gap-8 z-20 absolute bottom-0 left-0 right-0">
                <button onClick={skipBack} className="text-brand-text hover:text-white transition active:scale-90 p-2">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button id="play-btn" onClick={togglePlay} className="w-16 h-16 lg:w-14 lg:h-14 bg-white rounded-full flex items-center justify-center text-black active:scale-90 hover:shadow-[0_0_20px_white] transition shadow-lg touch-target">
                  {state.playing ? (
                    <Pause className="w-6 h-6 fill-black ml-1" />
                  ) : (
                    <Play className="w-6 h-6 fill-black ml-1" />
                  )}
                </button>
                <button className="text-brand-orange transition active:scale-90 relative p-2">
                  <Repeat className="w-5 h-5" />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-orange rounded-full"></span>
                </button>
              </div>
          </div>

          {/* CONTROLS SIDEBAR */}
          <aside className="sidebar w-full lg:w-[360px] flex flex-col z-20 shrink-0 h-auto lg:h-full overflow-y-auto custom-scroll p-5 lg:p-6 lg:order-1 safe-pb border-t lg:border-t-0 lg:border-r border-bg-border bg-bg-panel">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Filter className="w-5 h-5 text-brand-orange" />
                Toolbox
              </h2>
              <button onClick={resetEditor} className="text-xs text-brand-text hover:text-white flex gap-1 items-center px-2 py-1 rounded hover:bg-white/5 transition">
                <RefreshCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="mb-6 bg-brand-orange/5 border border-brand-orange/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">AI Auto-Cut</h3>
                {aiBadgeVisible && (
                  <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/50 px-2 py-0.5 rounded-full font-bold animate-pulse">AI</span>
                )}
              </div>
              <button id="ai-btn" onClick={handleAIAnalysis} disabled={!isAiButtonEnabled} className="w-full btn-primary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02] active:scale-95">
                <Lightbulb className="w-4 h-4" />
                Find Best Chorus
              </button>
              </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[9px] uppercase text-brand-text font-bold block mb-1">Start</label>
                <input type="text" id="start-time" value={formatTime((state.start/100)*state.duration)} readOnly className="time-input w-full py-3 outline-none" inputMode="none" />
              </div>
              <div>
                <label className="text-[9px] uppercase text-brand-text font-bold block mb-1">End</label>
                <input type="text" id="end-time" value={formatTime((state.end/100)*state.duration)} readOnly className="time-input w-full py-3 outline-none" inputMode="none" />
              </div>
            </div>

            <div className="mb-4 md:mb-auto">
              <label className="text-[9px] uppercase text-brand-text font-bold block mb-2">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={(e) => setFormat('mp3', e.currentTarget)} className={`fmt-btn px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95 ${state.format === 'mp3' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'text-brand-text hover:bg-white/5'}`}>
                  <span className="font-bold text-xs">MP3</span>
                  <span className="text-[10px] text-brand-muted">Std</span>
                </button>
                <button onClick={(e) => setFormat('m4r', e.currentTarget)} className={`fmt-btn px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95 ${state.format === 'm4r' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'text-brand-text hover:bg-white/5'}`}>
                  <span className="font-bold text-xs">M4R</span>
                  <span className="text-[10px] text-brand-muted">iOS</span>
                </button>
                <button onClick={(e) => setFormat('wav', e.currentTarget)} className={`fmt-btn px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95 ${state.format === 'wav' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'text-brand-text hover:bg-white/5'}`}>
                  <span className="font-bold text-xs">WAV</span>
                  <span className="text-[10px] text-brand-muted">HQ</span>
                </button>
                <button onClick={(e) => setFormat('flac', e.currentTarget)} className={`fmt-btn px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95 ${state.format === 'flac' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'text-brand-text hover:bg-white/5'}`}>
                  <span className="font-bold text-xs">FLAC</span>
                  <span className="text-[10px] text-brand-muted">Lossless</span>
                </button>
                <button onClick={(e) => setFormat('aac', e.currentTarget)} className={`fmt-btn px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95 ${state.format === 'aac' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'text-brand-text hover:bg-white/5'}`}>
                  <span className="font-bold text-xs">AAC</span>
                  <span className="text-[10px] text-brand-muted">Audio</span>
                </button>
                <button onClick={(e) => setFormat('ogg', e.currentTarget)} className={`fmt-btn px-3 py-2.5 text-sm font-semibold transition-all duration-200 flex flex-col items-center hover:scale-105 active:scale-95 ${state.format === 'ogg' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'text-brand-text hover:bg-white/5'}`}>
                  <span className="font-bold text-xs">OGG</span>
                  <span className="text-[10px] text-brand-muted">Web</span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 pb-4">
              <label className="flex items-center gap-2 cursor-pointer group mb-3 justify-center">
                <input type="checkbox" id="legal-check" checked={legalChecked} onChange={e => setLegalChecked(e.target.checked)} className="accent-brand-orange w-3.5 h-3.5 rounded" />
                <span className="text-[10px] text-brand-text">I own rights. <Link href="/dmca" className="underline">DMCA</Link>.</span>
              </label>
            </div>

            <button id="dl-btn" disabled={!legalChecked || !isDownloadButtonEnabled} onClick={handleDownload} className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 group active:scale-95 shadow-lg disabled:opacity-50 ${isDownloadButtonEnabled ? 'bg-brand-orange text-white' : 'bg-brand-muted/20 text-brand-muted cursor-not-allowed'}`}>
              <span id="dl-text">Download Ringtone</span>
              <Download className="w-4 h-4" />
            </button>
          </aside>
        </div> {/* END EDITOR VIEW */}

        {/* SEO SECTION */}
        <section className="container mx-auto px-4 py-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="seo-box">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center text-brand-orange">
                  <Scissors className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">iPhone Ringtone Maker</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">
                Convert MP3 to M4R instantly. The only tool you need to <strong>create iPhone ringtone</strong> files without iTunes.
              </p>
              </div>
            <div className="seo-box">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Ringtone Maker Android</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">
                Create high-quality MP3 notifications. Use our <strong>ringtone cutter</strong> to trim start/end times precisely.
              </p>
            </div>
            <div className="seo-box">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">AI-Powered Editing</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">
                Our AI automatically detects the best parts of your song for perfect ringtones. No manual editing required.
              </p>
            </div>
            <div className="seo-box">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                  <RefreshCcw className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Loop & Trim</h3>
              </div>
              <p className="text-brand-text text-sm leading-relaxed">
                Precise audio trimming with visual waveform. Create seamless loops for your favorite tracks.
              </p>
            </div>
          </div>
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">How to Make a Ringtone</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="step-box">
                <span className="step-num">1. Upload</span>
                <p className="text-xs text-brand-text">Upload your MP3, WAV, or M4A file.</p>
              </div>
              <div className="step-box">
                <span className="step-num">2. Edit</span>
                <p className="text-xs text-brand-text">Drag handles or use AI to select the loop.</p>
              </div>
              <div className="step-box">
                <span className="step-num">3. Download</span>
                <p className="text-xs text-brand-text">Save as M4R (iOS) or MP3 (Android).</p>
              </div>
            </div>
            <p className="text-center text-sm text-brand-text mt-8 pt-8 border-t border-white/5 max-w-2xl mx-auto">
              Looking for a <strong>best iphone ringtone app</strong> alternative? Phonezoo provides the same features for free on the web. It&apos;s the simplest way to <strong>create iphone ringtone</strong> files from your music library. Start your <strong>phone ringtone download</strong> journey today.
            </p>
          </div>
        </section>
      </div>
        </div> {/* Closing div for MAIN SCROLLABLE WRAPPER, was causing errors */}

      <footer className="bg-bg-panel border-t border-bg-border py-8 text-center text-xs text-brand-text">
        <p>&copy; 2024 Phonezoo Inc.</p>
      </footer>

      {/* Hidden audio player */}
      <audio
        id="audio-player"
        preload="metadata"
        onTimeUpdate={(e) => {
          const audio = e.target as HTMLAudioElement
          const pct = (audio.currentTime / state.duration) * 100
          const endTime = (state.end / 100) * state.duration

          setState(prev => ({ ...prev, playhead: pct }))

          // Loop back to start when reaching end
          if (audio.currentTime >= endTime) {
            const startTime = (state.start / 100) * state.duration
            audio.currentTime = startTime
          }
        }}
        onEnded={() => {
          // Loop back to start position (don't stop playing)
          const startTime = (state.start / 100) * state.duration
          const audio = document.getElementById('audio-player') as HTMLAudioElement
          if (audio) {
            audio.currentTime = startTime
            // Keep playing state active for seamless loop
            setState(prev => ({ ...prev, playhead: prev.start }))
          }
        }}
        onPlay={() => {
          setState(prev => ({ ...prev, playing: true }))
        }}
        onPause={() => {
          setState(prev => ({ ...prev, playing: false }))
        }}
      />
    </div>
  )
}
