import { NextRequest, NextResponse } from 'next/server'
import { findJobBySunoTaskId, completeGenerationWithMetadata, markGenerationFailed } from '@/lib/music-storage'
import { uploadToR2FromUrl } from '@/lib/music-utils'

/**
 * Suno callback — sunoapi.org POSTs results here when generation completes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[suno-callback] Received:', JSON.stringify(body).slice(0, 500))

    // Extract taskId
    const taskId = body?.taskId || body?.data?.taskId
    if (!taskId) {
      console.error('[suno-callback] No taskId in payload')
      return NextResponse.json({ received: true })
    }

    // Map Suno taskId → our jobId
    const jobId = await findJobBySunoTaskId(taskId)
    if (!jobId) {
      console.error(`[suno-callback] No job found for Suno task ${taskId}`)
      return NextResponse.json({ received: true })
    }

    // Extract audio data from various payload formats
    let tracks: any[] = []
    if (Array.isArray(body?.data)) {
      tracks = body.data
    } else if (body?.data?.response?.sunoData) {
      tracks = body.data.response.sunoData
    } else if (body?.data?.sunoData) {
      tracks = body.data.sunoData
    }

    const firstTrack = tracks[0]
    if (!firstTrack?.audioUrl) {
      const status = body?.data?.status || ''
      if (status === 'FAILED' || status === 'ERROR') {
        console.error(`[suno-callback] Task ${taskId} failed:`, body?.data?.errorMessage)
        await markGenerationFailed(jobId)
      }
      return NextResponse.json({ received: true })
    }

    const audioUrl = firstTrack.audioUrl
    const duration = firstTrack.duration || 0

    console.log(`[suno-callback] Task ${taskId} → job ${jobId}: ${audioUrl} (${duration}s)`)

    // Re-upload to R2 to hide Suno origin
    let finalUrl = audioUrl
    try {
      const r2Url = await uploadToR2FromUrl(audioUrl, `ringtones/ai/suno/${jobId}/music_${jobId}.mp3`)
      if (r2Url) finalUrl = r2Url
    } catch (e: any) {
      console.error(`[suno-callback] R2 re-upload failed, using Suno URL:`, e.message)
    }

    // Complete with AI metadata (title, slug, description)
    await completeGenerationWithMetadata(jobId, {
      audio_url: finalUrl,
      generation_time_ms: duration * 1000,
    })
    console.log(`[suno-callback] Job ${jobId} completed`)

    return NextResponse.json({ received: true, status: 'completed' })
  } catch (e: any) {
    console.error('[suno-callback] Error:', e.message)
    return NextResponse.json({ received: true })
  }
}
