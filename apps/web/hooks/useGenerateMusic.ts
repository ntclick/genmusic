'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { submitMusicGeneration, pollMusicStatus } from '@/lib/music-api'
import type { GenerateRequest, JobStatus } from '@/types/music'

const TIMEOUT_MS = 10 * 60 * 1000
const STORAGE_KEY = 'phonezoo_pending_job'

interface PendingJob {
  jobId: string
  prompt: string
  startTime: number
}

export interface UseGenerateMusicReturn {
  generate: (input: GenerateRequest) => Promise<void>
  reset: () => void
  status: JobStatus | null
  audioUrl: string | null
  title: string | null
  slug: string | null
  isSubmitting: boolean
  error: string | null
  elapsedMs: number
  jobId: string | null
}

function savePendingJob(jobId: string, prompt: string) {
  try {
    const data: PendingJob = { jobId, prompt, startTime: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function loadPendingJob(): PendingJob | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: PendingJob = JSON.parse(raw)
    // Expired — older than timeout
    if (Date.now() - data.startTime > TIMEOUT_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function clearPendingJob() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export function useGenerateMusic(): UseGenerateMusicReturn {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const activeRef = useRef(false)

  const stopPolling = () => {
    activeRef.current = false
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null }
  }

  const reset = () => {
    stopPolling()
    clearPendingJob()
    setJobId(null)
    setStatus(null)
    setAudioUrl(null)
    setTitle(null)
    setSlug(null)
    setIsSubmitting(false)
    setError(null)
    setElapsedMs(0)
  }

  const schedulePoll = useCallback((id: string) => {
    if (!activeRef.current) return
    const elapsed = Date.now() - startTimeRef.current
    const interval = elapsed > 30_000 ? 5000 : 2000

    pollRef.current = setTimeout(async () => {
      if (!activeRef.current) return

      if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
        stopPolling()
        clearPendingJob()
        setStatus('failed')
        setError('Generation timed out. Please try again.')
        return
      }

      try {
        const result = await pollMusicStatus(id)
        if (!activeRef.current) return
        setStatus(result.status)

        if (result.status === 'completed') {
          setAudioUrl(result.audio_url || null)
          setTitle(result.title || null)
          setSlug(result.slug || null)
          stopPolling()
          clearPendingJob()
        } else if (result.status === 'failed') {
          setError(result.error || 'Generation failed. Please try again.')
          stopPolling()
          clearPendingJob()
        } else {
          schedulePoll(id)
        }
      } catch {
        if (activeRef.current) schedulePoll(id)
      }
    }, interval)
  }, [])

  // Start polling for a given job
  const startPolling = useCallback((id: string, start: number) => {
    activeRef.current = true
    startTimeRef.current = start

    setElapsedMs(Date.now() - start)
    elapsedRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 250)

    schedulePoll(id)
  }, [schedulePoll])

  // On mount: restore pending job if exists
  useEffect(() => {
    const pending = loadPendingJob()
    if (pending) {
      setJobId(pending.jobId)
      setStatus('processing')
      startPolling(pending.jobId, pending.startTime)
    }
    return stopPolling
  }, [startPolling])

  // When jobId changes from a new generation (not restore)
  const isNewJobRef = useRef(false)
  useEffect(() => {
    if (!jobId || !isNewJobRef.current) return
    isNewJobRef.current = false
    startPolling(jobId, Date.now())
    return stopPolling
  }, [jobId, startPolling])

  const generate = async (input: GenerateRequest) => {
    reset()
    setIsSubmitting(true)
    try {
      const response = await submitMusicGeneration(input)
      savePendingJob(response.job_id, input.prompt)
      isNewJobRef.current = true
      setJobId(response.job_id)
      setStatus('processing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation')
      setStatus('failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { generate, reset, status, audioUrl, title, slug, isSubmitting, error, elapsedMs, jobId }
}
