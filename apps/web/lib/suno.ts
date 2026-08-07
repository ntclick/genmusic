/**
 * Suno API integration via sunoapi.org
 * Users see "AI Music" — never see "Suno".
 *
 * API: https://api.sunoapi.org
 * Docs: https://docs.sunoapi.org
 *
 * Limits:
 * - Lyrics (prompt in custom mode): max 3000 chars
 * - Style: max 200 chars
 * - Duration: auto (Suno decides based on lyrics length, 1-4 min)
 * - Model: V4_5ALL (latest)
 */

const SUNO_API_BASE = process.env.SUNO_API_BASE_URL || 'https://api.sunoapi.org'

type SunoGenerateOptions = {
  prompt: string       // style description for instrumental, OR lyrics for vocal
  lyrics?: string      // lyrics with [Verse]/[Chorus] tags (custom mode)
  genre?: string       // style description
  title?: string
}

type SunoTaskResult = {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  audioUrl?: string
  duration?: number
  error?: string
}

function getSunoHeaders(): Record<string, string> {
  const apiKey = process.env.SUNO_API_KEY
  if (!apiKey) throw new Error('SUNO_API_KEY not configured')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
}

/**
 * Submit a music generation request to Suno via sunoapi.org
 */
export async function sunoGenerate(options: SunoGenerateOptions): Promise<string> {
  const { prompt, lyrics, genre, title } = options

  const hasLyrics = !!lyrics?.trim()

  const appUrl = process.env.APP_URL || 'https://phonezoo.com'

  // Build request body based on mode
  const body: Record<string, any> = {
    model: 'V4_5ALL',
    callBackUrl: `${appUrl.replace(/\/$/, '')}/api/music/suno-callback`,
  }

  if (hasLyrics) {
    // Custom mode: vocals with lyrics
    body.customMode = true
    body.instrumental = false
    body.prompt = lyrics!.slice(0, 3000)  // lyrics go in prompt field
    body.style = (genre ? `${genre} style. ${prompt}` : prompt).slice(0, 200)
    body.title = (title || 'AI Song').slice(0, 80)
  } else {
    // Simple mode: instrumental
    body.customMode = false
    body.instrumental = true
    body.prompt = (genre ? `${genre} style. ${prompt}` : prompt).slice(0, 200)
  }

  console.log(`[suno] Generating: customMode=${body.customMode}, instrumental=${body.instrumental}, model=${body.model}`)

  const res = await fetch(`${SUNO_API_BASE}/api/v1/generate`, {
    method: 'POST',
    headers: getSunoHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error(`[suno] API error ${res.status}: ${err}`)
    throw new Error(`Suno API error ${res.status}: ${err}`)
  }

  const data = await res.json()

  // sunoapi.org returns: { code: 200, data: { taskId: "..." } }
  const taskId = data?.data?.taskId || data?.taskId || data?.data?.task_id
  if (!taskId) {
    console.error('[suno] No taskId in response:', JSON.stringify(data).slice(0, 200))
    throw new Error('No task ID returned from Suno')
  }

  console.log(`[suno] Task created: ${taskId}`)
  return taskId
}

/**
 * Poll Suno task status via sunoapi.org
 */
export async function sunoPollStatus(taskId: string): Promise<SunoTaskResult> {
  const res = await fetch(`${SUNO_API_BASE}/api/v1/generate/record-info?taskId=${taskId}`, {
    headers: getSunoHeaders(),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    return { taskId, status: 'processing' }
  }

  const data = await res.json()
  const record = data?.data

  if (!record) return { taskId, status: 'processing' }

  const status = (record.status || '').toUpperCase()

  if (status === 'SUCCESS' || status === 'COMPLETED') {
    // Extract audio URL from sunoData array
    const sunoData = record.response?.sunoData || record.response?.data || []
    const firstTrack = Array.isArray(sunoData) ? sunoData[0] : sunoData

    const audioUrl = firstTrack?.audioUrl || firstTrack?.audio_url
    if (audioUrl) {
      return {
        taskId,
        status: 'completed',
        audioUrl,
        duration: firstTrack?.duration,
      }
    }
  }

  if (status === 'FAILED' || status === 'ERROR') {
    return {
      taskId,
      status: 'failed',
      error: record.failReason || record.error || 'Suno generation failed',
    }
  }

  // Still processing
  return { taskId, status: 'processing' }
}

/**
 * Generate music with Suno and wait for completion (with timeout).
 */
export async function sunoGenerateAndWait(
  options: SunoGenerateOptions,
  maxWaitMs = 5 * 60 * 1000
): Promise<{ audioUrl: string; duration?: number }> {
  const taskId = await sunoGenerate(options)

  const startTime = Date.now()
  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(r => setTimeout(r, 5000))

    const result = await sunoPollStatus(taskId)

    if (result.status === 'completed' && result.audioUrl) {
      console.log(`[suno] Task ${taskId} completed: ${result.audioUrl}`)
      return { audioUrl: result.audioUrl, duration: result.duration }
    }

    if (result.status === 'failed') {
      console.error(`[suno] Task ${taskId} failed: ${result.error}`)
      throw new Error(result.error || 'Music generation failed')
    }
  }

  throw new Error('Music generation timed out')
}
