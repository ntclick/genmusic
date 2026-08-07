import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getGenreTemplate,
  createMusicGeneration,
  getUserQuota,
  incrementQuota,
  markGenerationFailed,
  updateMusicGenerationStatus,
} from '@/lib/music-storage'
import { sunoGenerate } from '@/lib/suno'
import { generateLyrics } from '@/lib/music-lyrics-writer'

export const runtime = 'nodejs'
export const maxDuration = 300

const GenerateSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(500, 'Prompt too long'),
  lyrics: z.string().max(2500, 'Lyrics too long (max 2500 chars)').optional().default(''),
  genre: z.string().min(1).max(50),
  duration: z.number().int().min(5).max(60),
  seed: z.number().int().optional(),
  title: z.string().max(200).optional(),
})

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT = 5

function isIpRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < windowMs)
  if (timestamps.length >= RATE_LIMIT) return true
  timestamps.push(now)
  rateLimitMap.set(ip, timestamps)
  return false
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 })
  }

  const { prompt, lyrics, genre, duration, seed, title } = parsed.data
  const userId = req.headers.get('x-user-id') || null

  // Check quota — use IP as identifier for anonymous users
  const quotaIdentifier = userId || `ip:${ip}`
  const quota = await getUserQuota(userId, quotaIdentifier)
  if (!quota.can_generate) {
    return NextResponse.json({
      error: 'Daily generation limit reached. Upgrade your plan for more generations.',
      quota,
    }, { status: 429 })
  }

  if (duration > quota.max_duration) {
    return NextResponse.json({
      error: `Your plan allows max ${quota.max_duration}s duration. Upgrade for longer tracks.`,
    }, { status: 400 })
  }

  const wantsVocals = !!lyrics?.trim()
  if (wantsVocals && quota.vocal_remaining <= 0) {
    return NextResponse.json({
      error: `Daily vocal limit reached (${quota.vocal_limit}/day). Upgrade for more vocal generations.`,
    }, { status: 429 })
  }

  if (!userId && isIpRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait before generating again.' }, { status: 429 })
  }

  const finalSeed = seed ?? Math.floor(Math.random() * 2_147_483_647)
  // Vocals → Suno (has lyrics/singing), Instrumental → Modal GPU (cheaper)
  const engine = wantsVocals ? 'suno' : 'musicgen'

  try {
    // Deduct quota FIRST — before starting generation
    await incrementQuota(userId || `ip:${ip}`)

    const template = await getGenreTemplate(genre)
    const enrichedPrompt = template ? `${template}, ${prompt}` : prompt

    const jobId = await createMusicGeneration({
      prompt: enrichedPrompt,
      lyrics: lyrics || '',
      genre,
      duration_seconds: duration,
      seed: finalSeed,
      title: title || null,
      user_id: userId,
      has_vocals: wantsVocals,
      engine,
    })

    if (wantsVocals) {
      // ─── Vocals: Suno API — fire-and-forget ────────────────
      // Submit to Suno with callback URL. Suno will POST results to
      // /api/music/suno-callback when done. No polling needed.
      try {
        let finalLyrics = lyrics || ''
        const needsAiLyrics = !finalLyrics.trim() || finalLyrics.trim() === '[AI_WRITE_LYRICS]'
        if (needsAiLyrics) {
          try {
            finalLyrics = await generateLyrics(prompt, genre, duration)
            console.log(`[music/generate] AI wrote lyrics for job ${jobId}: ${finalLyrics.slice(0, 80)}...`)
          } catch (err) {
            console.error(`[music/generate] Lyrics gen failed, using prompt:`, (err as Error).message)
            finalLyrics = prompt
          }
        }

        // Store taskId in DB so callback can map Suno taskId → our jobId
        const taskId = await sunoGenerate({
          prompt: enrichedPrompt,
          lyrics: finalLyrics,
          genre,
          title,
        })

        // Save suno taskId as our jobId mapping
        await updateMusicGenerationStatus(jobId, 'processing', { engine: `suno:${taskId}` })
        console.log(`[music/generate] Suno task ${taskId} submitted for job ${jobId}`)
      } catch (err) {
        console.error(`[music/generate] Suno submit failed for ${jobId}:`, (err as Error).message)
        await markGenerationFailed(jobId)
      }
    } else {
      // ─── Instrumental: Modal GPU — fire-and-forget ──────────
      // Modal generates audio → uploads to Shelby/R2 → calls webhook
      // Webhook route (/api/music/webhook) handles completion in DB
      const modalEndpoint = process.env.MODAL_ENDPOINT_URL
      if (!modalEndpoint) {
        console.error(`[music/generate] No MODAL_ENDPOINT_URL configured`)
        await markGenerationFailed(jobId)
      } else {
        try {
          // Use APP_URL (server-runtime), NOT NEXT_PUBLIC_APP_URL (inlined at build-time
          // → would freeze localhost from dev build). Hardcoded fallback is the prod URL.
          const appUrl = process.env.APP_URL || 'https://phonezoo.com'
          const res = await fetch(modalEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: enrichedPrompt,
              lyrics: '',
              duration,
              seed: finalSeed,
              job_id: jobId,
              webhook_url: `${appUrl.replace(/\/$/, '')}/api/music/webhook`,
            }),
            signal: AbortSignal.timeout(20_000),
          })

          if (!res.ok) {
            console.error(`[music/generate] Modal returned ${res.status}`)
            await markGenerationFailed(jobId)
          } else {
            console.log(`[music/generate] Modal dispatched job ${jobId} — waiting for webhook callback`)
          }
        } catch (err) {
          console.error(`[music/generate] Modal dispatch failed for ${jobId}:`, (err as Error).message)
          await markGenerationFailed(jobId)
        }
      }
    }

    return NextResponse.json({ job_id: jobId, status: 'processing' })
  } catch (err) {
    console.error('[music/generate] Error:', err)
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 })
  }
}
