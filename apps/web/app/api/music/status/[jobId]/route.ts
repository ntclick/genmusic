import { NextRequest, NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { getGenerationStatus, markGenerationFailed } from '@/lib/music-storage'

export const dynamic = 'force-dynamic'

const STALE_JOB_TIMEOUT_MS = 10 * 60 * 1000

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  noStore()
  const { jobId } = params
  if (!jobId) return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })

  const data = await getGenerationStatus(jobId)
  if (!data) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  if (data.status === 'processing') {
    const ageMs = Date.now() - new Date(data.created_at).getTime()
    if (ageMs > STALE_JOB_TIMEOUT_MS) {
      await markGenerationFailed(jobId)
      return NextResponse.json(
        { status: 'failed', error: 'Generation timed out' },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }
  }

  return NextResponse.json(
    {
      status: data.status,
      audio_url: data.audio_url ?? undefined,
      generation_time_ms: data.generation_time_ms ?? undefined,
      title: data.title ?? undefined,
      slug: data.slug ?? undefined,
    },
    { headers: { 'Cache-Control': 'no-store, no-cache' } }
  )
}
