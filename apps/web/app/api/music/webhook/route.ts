import { NextRequest, NextResponse } from 'next/server'
import { uploadViaProcess } from '@/lib/shelby'

export const runtime = 'nodejs'

// Global in-memory job store for local dev & polling
export const pendingJobs = new Map<string, {
  status: 'processing' | 'completed' | 'failed'
  audioUrl?: string
  coverUrl?: string
  txHash?: string | null
  explorerUrl?: string | null
  sizeKb?: number
  error?: string
}>()

export async function POST(req: NextRequest) {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { job_id, status, audio_url, audio_size_kb, error } = payload

  if (!job_id || !status) {
    return NextResponse.json({ error: 'Missing job_id or status' }, { status: 400 })
  }

  console.log(`[music/webhook] Received callback for ${job_id}: status=${status}, audio_url=${audio_url}`)

  if (status === 'completed' && audio_url) {
    try {
      // If audio is returned, upload it directly to ShelbyNet
      let shelbyUrl = audio_url
      let txHash: string | null = null
      let explorerUrl: string | null = null
      let sizeKb = audio_size_kb || 861

      if (audio_url.startsWith('http') && !audio_url.includes('shelby.xyz')) {
        const audioRes = await fetch(audio_url)
        if (audioRes.ok) {
          const arrayBuf = await audioRes.arrayBuffer()
          const audioBuffer = Buffer.from(arrayBuf)
          const uploadRes = await uploadViaProcess(audioBuffer, job_id)
          shelbyUrl = uploadRes.url
          txHash = uploadRes.txHash || null
          explorerUrl = uploadRes.explorerUrl || null
          sizeKb = uploadRes.sizeKb
        }
      }

      pendingJobs.set(job_id, {
        status: 'completed',
        audioUrl: shelbyUrl,
        txHash,
        explorerUrl,
        sizeKb,
      })
    } catch (err: any) {
      console.error(`[music/webhook] Shelby upload error for ${job_id}:`, err?.message)
      pendingJobs.set(job_id, {
        status: 'completed',
        audioUrl: audio_url,
        sizeKb: audio_size_kb || 861,
      })
    }
  } else {
    pendingJobs.set(job_id, {
      status: 'failed',
      error: error || 'Modal generation failed',
    })
  }

  return NextResponse.json({ ok: true })
}
