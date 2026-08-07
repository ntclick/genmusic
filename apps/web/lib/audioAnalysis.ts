/**
 * Audio analysis utilities for the Ringtone Maker.
 *
 * Strategy v3: Onset-Segment Based Analysis
 *
 * Instead of finding the loudest POINT (which is often mid-phrase and
 * not a good cut start), we detect where the music CHANGES — onset
 * points where energy rises at musical phrase boundaries.
 *
 * Key improvements over v2:
 * 1. Onset detection finds where new sections START (phrase boundaries)
 * 2. Markers represent section starts, not arbitrary energy peaks
 * 3. Each marker includes a suggested cut region (start → next boundary)
 * 4. Auto-cut snaps to nearest onset for clean phrase start
 * 5. Higher resolution (400 windows) for better accuracy
 */

// ─── Singleton AudioContext ──────────────────────────────────

let sharedAudioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    sharedAudioCtx = new AudioCtxClass()
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume()
  }
  return sharedAudioCtx
}

// ─── Decode / Waveform ───────────────────────────────────────

/** Fetch audio from URL and decode to AudioBuffer */
export async function decodeAudioFromUrl(url: string): Promise<AudioBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch audio: HTTP ${response.status}`)
  const arrayBuffer = await response.arrayBuffer()
  if (arrayBuffer.byteLength === 0) throw new Error('Empty audio file')
  const audioCtx = getAudioContext()
  return audioCtx.decodeAudioData(arrayBuffer)
}

/** Compute waveform bar heights from AudioBuffer. Returns number[] with values 10-90 (percentage). */
export function computeWaveformBars(audioBuffer: AudioBuffer, barCount: number): number[] {
  const raw = audioBuffer.getChannelData(0)
  const samplesPerBar = Math.floor(raw.length / barCount)
  const bars: number[] = []

  for (let i = 0; i < barCount; i++) {
    let sum = 0
    const start = i * samplesPerBar
    const end = Math.min(start + samplesPerBar, raw.length)
    for (let j = start; j < end; j++) {
      sum += raw[j] * raw[j]
    }
    const rms = Math.sqrt(sum / (end - start))
    bars.push(Math.max(10, Math.min(90, rms * 200)))
  }

  return bars
}

// ─── Internal helpers ────────────────────────────────────────

function normalize(arr: number[]): number[] {
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const range = max - min
  if (range === 0) return arr.map(() => 0)
  return arr.map(v => (v - min) / range)
}

function smooth(arr: number[], radius: number): number[] {
  return arr.map((_, idx) => {
    const s = Math.max(0, idx - radius)
    const e = Math.min(arr.length, idx + radius + 1)
    const win = arr.slice(s, e)
    return win.reduce((a, b) => a + b, 0) / win.length
  })
}

// ─── Audio Profile ───────────────────────────────────────────

export interface AudioProfile {
  /** Smoothed, normalized [0,1] energy per window */
  energy: number[]
  /** Energy flux — positive-only forward difference (where energy rises) */
  flux: number[]
  /** Onset point indices (windows where energy rises significantly) */
  onsets: number[]
  /** Number of analysis windows */
  windowCount: number
}

/**
 * Analyse an AudioBuffer with onset-segment approach.
 *
 * Default 400 windows gives ~0.45s per window for a 3-min song.
 * Detects onset points (where energy jumps up = start of new phrase).
 */
export function computeAudioProfile(
  audioBuffer: AudioBuffer,
  windowCount: number = 400
): AudioProfile {
  const raw = audioBuffer.getChannelData(0)
  const windowSize = Math.floor(raw.length / windowCount)

  // ── Pass 1: raw RMS energy per window ──
  const rawEnergy: number[] = []
  for (let i = 0; i < windowCount; i++) {
    const wStart = i * windowSize
    const wEnd = Math.min(wStart + windowSize, raw.length)
    let sumSq = 0
    for (let j = wStart; j < wEnd; j++) sumSq += raw[j] * raw[j]
    rawEnergy.push(Math.sqrt(sumSq / (wEnd - wStart)))
  }

  // ── Smooth and normalize energy ──
  const sEnergy = smooth(rawEnergy, 3)
  const energy = normalize(sEnergy)

  // ── Compute energy flux (onset detection function) ──
  // Looks at how much energy INCREASED compared to a lookback window.
  // Positive-only: we only care about energy RISES (new section starts).
  const lookback = 5
  const rawFlux: number[] = new Array(windowCount).fill(0)
  for (let i = lookback; i < windowCount; i++) {
    let prevAvg = 0
    for (let j = i - lookback; j < i; j++) prevAvg += energy[j]
    prevAvg /= lookback
    rawFlux[i] = Math.max(0, energy[i] - prevAvg)
  }
  const flux = normalize(rawFlux)

  // ── Find onset points: peaks in flux ──
  // These mark where energy RISES suddenly = start of new musical phrases.
  // Min gap: ~4-5 seconds between onsets (2.5% of 400 windows = 10 windows)
  const minGap = Math.max(10, Math.floor(windowCount * 0.025))
  const fluxThreshold = 0.10

  // Energy gate: only consider onsets where energy is above 35% of max
  const energyThreshold = 0.35

  const candidates: Array<{ index: number; strength: number }> = []
  for (let i = 2; i < windowCount - 2; i++) {
    // Must be a local peak in flux (or plateau peak)
    if (flux[i] > fluxThreshold && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1]) {
      // Must be in a region with meaningful energy
      if (energy[i] >= energyThreshold) {
        candidates.push({ index: i, strength: flux[i] })
      }
    }
  }

  // Greedy selection: strongest onsets first, enforce minimum gap
  candidates.sort((a, b) => b.strength - a.strength)
  const onsets: number[] = []
  for (const c of candidates) {
    if (!onsets.some(o => Math.abs(o - c.index) < minGap)) {
      onsets.push(c.index)
    }
  }
  onsets.sort((a, b) => a - b)

  return { energy, flux, onsets, windowCount }
}

// ─── Legacy wrapper ──────────────────────────────────────────

export function computeEnergyProfile(
  audioBuffer: AudioBuffer,
  windowCount: number = 100
): number[] {
  return computeAudioProfile(audioBuffer, windowCount).energy
}

// ─── Best Segment Finder ─────────────────────────────────────

/**
 * Find the best ~targetSeconds segment, aligned to onset points.
 *
 * 1. Sliding window finds highest-energy ~30s region
 * 2. Snaps start to nearest onset point (clean phrase start)
 * 3. Position bias avoids intro/outro
 */
export function findBestSegment(
  profile: AudioProfile,
  durationSeconds: number,
  targetSeconds: number = 30
): { startPct: number; endPct: number } {
  const { energy, onsets, windowCount } = profile
  const targetWindows = Math.max(1, Math.floor((targetSeconds / durationSeconds) * windowCount))

  // Position bias: penalise intro and outro
  const posBias = (idx: number): number => {
    const pos = idx / windowCount
    if (pos < 0.05) return 0.2
    if (pos < 0.12) return 0.2 + (pos - 0.05) * (0.8 / 0.07)
    if (pos > 0.95) return 0.2
    if (pos > 0.88) return 0.2 + (0.95 - pos) * (0.8 / 0.07)
    return 1.0
  }

  // Sliding window with position bias
  let maxScore = -Infinity
  let bestStart = 0
  for (let i = 0; i <= windowCount - targetWindows; i++) {
    let s = 0
    for (let j = i; j < i + targetWindows; j++) {
      s += energy[j] * posBias(j)
    }
    if (s > maxScore) {
      maxScore = s
      bestStart = i
    }
  }

  // Snap start to nearest onset point (within ±8 windows ≈ ±3.5s)
  if (onsets.length > 0) {
    let nearestOnset = bestStart
    let nearestDist = Infinity
    for (const o of onsets) {
      const dist = Math.abs(o - bestStart)
      if (dist < nearestDist && dist <= 8) {
        nearestDist = dist
        nearestOnset = o
      }
    }
    if (nearestOnset >= 0 && nearestOnset + targetWindows <= windowCount) {
      bestStart = nearestOnset
    }
  }

  const startPct = (bestStart / windowCount) * 100
  const endPct = Math.min(((bestStart + targetWindows) / windowCount) * 100, 100)
  return { startPct, endPct }
}

// ─── Marker Data ─────────────────────────────────────────────

export interface MarkerData {
  /** Position percentage on waveform (0-100) */
  timePct: number
  /** Suggested cut start percentage */
  cutStartPct: number
  /** Suggested cut end percentage */
  cutEndPct: number
  /** Descriptive label */
  label: string
  /** Score for ranking (higher = better) */
  score: number
}

/**
 * Find the best markers (onset-based section starts).
 *
 * Each marker represents the START of a musically interesting section
 * and includes a suggested cut region from that onset to the next
 * natural boundary (or onset + cutDuration seconds).
 *
 * @param profile        AudioProfile from computeAudioProfile
 * @param durationSeconds total audio duration in seconds
 * @param count          max number of markers
 * @param cutDurationSeconds suggested cut length from each marker
 */
export function findBestMarkers(
  profile: AudioProfile,
  durationSeconds: number,
  count: number = 5,
  cutDurationSeconds: number = 30
): MarkerData[] {
  const { energy, onsets, windowCount } = profile
  const segmentWindows = Math.max(1, Math.floor((cutDurationSeconds / durationSeconds) * windowCount))

  if (onsets.length === 0) {
    // Fallback: no onsets detected (very uniform energy) → use energy peaks
    return fallbackPeakMarkers(energy, windowCount, durationSeconds, count, cutDurationSeconds)
  }

  // ── Score each onset point by the quality of the segment that follows it ──
  const scored = onsets.map(onset => {
    const segEnd = Math.min(onset + segmentWindows, windowCount)
    const segLen = segEnd - onset
    let sumEnergy = 0
    for (let j = onset; j < segEnd; j++) sumEnergy += energy[j]
    const avgEnergy = sumEnergy / segLen

    // Position bias
    const pos = onset / windowCount
    let posBias = 1.0
    if (pos < 0.05) posBias = 0.15
    else if (pos < 0.12) posBias = 0.15 + (pos - 0.05) * (0.85 / 0.07)
    else if (pos > 0.93) posBias = 0.15
    else if (pos > 0.86) posBias = 0.15 + (0.93 - pos) * (0.85 / 0.07)

    // Energy sustain: what % of windows are above 50% of avg energy?
    // Prefer segments where energy stays high (chorus) vs brief spike
    let sustainedCount = 0
    for (let j = onset; j < segEnd; j++) {
      if (energy[j] >= avgEnergy * 0.5) sustainedCount++
    }
    const sustainRatio = sustainedCount / segLen

    return {
      onset,
      score: avgEnergy * posBias * (0.5 + 0.5 * sustainRatio),
    }
  })

  // ── Pick top N by score, with minimum gap ──
  scored.sort((a, b) => b.score - a.score)
  const minGap = Math.floor(windowCount * 0.08) // min 8% apart (~14s for 3min)
  const selected: typeof scored = []

  for (const s of scored) {
    if (selected.length >= count) break
    if (!selected.some(sel => Math.abs(sel.onset - s.onset) < minGap)) {
      selected.push(s)
    }
  }

  // Sort chronologically
  selected.sort((a, b) => a.onset - b.onset)

  // ── Build markers with smart cut regions ──
  const maxScore = Math.max(...selected.map(s => s.score), 0.001)

  return selected.map(s => {
    const timePct = (s.onset / windowCount) * 100

    // Cut region: from onset forward by ~cutDuration
    // Try to snap end to next onset (natural boundary)
    const halfSegMin = Math.floor(segmentWindows * 0.4) // don't snap if next onset is < 40% away
    const nextOnset = onsets.find(o => o > s.onset + halfSegMin)
    let endWindow = s.onset + segmentWindows

    // If next onset is close to our natural end, snap to it
    if (nextOnset && Math.abs(nextOnset - endWindow) <= 10) {
      endWindow = nextOnset
    }
    endWindow = Math.min(endWindow, windowCount)

    const cutStartPct = timePct
    const cutEndPct = (endWindow / windowCount) * 100

    return {
      timePct,
      cutStartPct,
      cutEndPct,
      label: labelForSection(s.onset, windowCount, s.score / maxScore),
      score: s.score,
    }
  })
}

// ─── Fallback: energy-peak markers ───────────────────────────

function fallbackPeakMarkers(
  energy: number[],
  windowCount: number,
  durationSeconds: number,
  count: number,
  cutDurationSeconds: number
): MarkerData[] {
  const segmentWindows = Math.max(1, Math.floor((cutDurationSeconds / durationSeconds) * windowCount))

  // Find energy peaks
  const indexed = energy.map((e, i) => ({ index: i, energy: e }))
  indexed.sort((a, b) => b.energy - a.energy)

  const minGap = Math.floor(windowCount * 0.08)
  const peaks: typeof indexed = []
  for (const c of indexed) {
    if (peaks.length >= count) break
    if (!peaks.some(p => Math.abs(p.index - c.index) < minGap)) {
      peaks.push(c)
    }
  }
  peaks.sort((a, b) => a.index - b.index)

  const maxE = Math.max(...peaks.map(p => p.energy), 0.001)

  return peaks.map(p => {
    // Start a few windows before the peak (catch the phrase start)
    const preRoll = Math.floor(segmentWindows * 0.2)
    const cutStart = Math.max(0, p.index - preRoll)
    const cutEnd = Math.min(windowCount, cutStart + segmentWindows)

    return {
      timePct: (p.index / windowCount) * 100,
      cutStartPct: (cutStart / windowCount) * 100,
      cutEndPct: (cutEnd / windowCount) * 100,
      label: labelForSection(p.index, windowCount, p.energy / maxE),
      score: p.energy,
    }
  })
}

// ─── Section Labels ──────────────────────────────────────────

function labelForSection(
  windowIndex: number,
  totalWindows: number,
  relativeStrength: number
): string {
  const pos = windowIndex / totalWindows

  let section: string
  if (pos < 0.08) section = 'Intro'
  else if (pos < 0.22) section = 'Verse'
  else if (pos < 0.38) section = 'Pre-Chorus'
  else if (pos < 0.62) section = 'Chorus'
  else if (pos < 0.78) section = 'Hook'
  else if (pos < 0.92) section = 'Bridge'
  else section = 'Outro'

  if (relativeStrength > 0.85) return `★ ${section} — Peak`
  if (relativeStrength > 0.60) return `${section} — High`
  return section
}

/** Public alias for backward compat */
export function labelForPeak(
  peakIndex: number,
  totalWindows: number,
  relativeStrength: number
): string {
  return labelForSection(peakIndex, totalWindows, relativeStrength)
}

// ─── Legacy peak finder (kept for backward compat) ───────────

export function findTopPeaks(
  scores: number[],
  count: number = 5,
  minDistance: number = 25
): Array<{ index: number; energy: number }> {
  const maxScore = Math.max(...scores)
  const threshold = maxScore * 0.35
  const indexed = scores
    .map((energy, index) => ({ index, energy }))
    .filter(p => p.energy >= threshold)
  indexed.sort((a, b) => b.energy - a.energy)
  const peaks: Array<{ index: number; energy: number }> = []
  for (const candidate of indexed) {
    if (peaks.length >= count) break
    const tooClose = peaks.some(p => Math.abs(p.index - candidate.index) < minDistance)
    if (!tooClose) peaks.push(candidate)
  }
  peaks.sort((a, b) => a.index - b.index)
  return peaks
}

// ─── Trimming & Export ───────────────────────────────────────

/** Create a trimmed copy of an AudioBuffer based on start/end percentages (0-100). */
export function trimAudioBuffer(
  audioBuffer: AudioBuffer,
  startPct: number,
  endPct: number
): AudioBuffer {
  const sampleRate = audioBuffer.sampleRate
  const totalSamples = audioBuffer.length
  const startSample = Math.floor((startPct / 100) * totalSamples)
  const endSample = Math.floor((endPct / 100) * totalSamples)
  const trimmedLength = Math.max(1, endSample - startSample)

  const audioCtx = getAudioContext()
  const trimmedBuffer = audioCtx.createBuffer(
    audioBuffer.numberOfChannels,
    trimmedLength,
    sampleRate
  )

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const originalData = audioBuffer.getChannelData(channel)
    const trimmedData = trimmedBuffer.getChannelData(channel)
    for (let i = 0; i < trimmedLength; i++) {
      trimmedData[i] = originalData[startSample + i]
    }
  }

  return trimmedBuffer
}

/** Convert AudioBuffer to WAV Blob. */
export function audioBufferToWav(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels
  const length = abuffer.length * numOfChan * 2 + 44
  const buffer = new ArrayBuffer(length)
  const view = new DataView(buffer)
  const channels: Float32Array[] = []
  let offset = 0
  let pos = 0

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true)
    pos += 2
  }
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true)
    pos += 4
  }

  // WAV header
  setUint32(0x46464952) // "RIFF"
  setUint32(length - 8)
  setUint32(0x45564157) // "WAVE"
  setUint32(0x20746d66) // "fmt "
  setUint32(16)
  setUint16(1) // PCM
  setUint16(numOfChan)
  setUint32(abuffer.sampleRate)
  setUint32(abuffer.sampleRate * 2 * numOfChan)
  setUint16(numOfChan * 2)
  setUint16(16)
  setUint32(0x61746164) // "data"
  setUint32(length - pos - 4)

  for (let i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i))

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      const sample = Math.max(-1, Math.min(1, channels[i][offset]))
      view.setInt16(pos, (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0, true)
      pos += 2
    }
    offset++
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
