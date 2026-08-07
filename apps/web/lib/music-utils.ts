/**
 * Utility functions for music generation feature.
 */
import { uploadAIAudio } from '@/lib/r2'

/** Fetch audio from URL and re-upload to R2. Returns R2 public URL or null. */
export async function uploadToR2FromUrl(sourceUrl: string, r2Path: string): Promise<string | null> {
  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 1000) return null
  const parts = r2Path.split('/')
  const filename = parts.pop() || 'audio.mp3'
  const result = await uploadAIAudio(buffer, 'callback', r2Path.replace(`/${filename}`, ''), filename, 'audio/mpeg')
  return result.url
}

/**
 * Generate a URL-safe slug from a title + UUID prefix for uniqueness.
 * Example: "Midnight Jazz Serenade" + "a7b3c4d5-..." → "midnight-jazz-serenade-a7b3"
 */
export function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
    .slice(0, 70)                    // limit length

  const suffix = id.replace(/-/g, '').slice(0, 4)
  return base ? `${base}-${suffix}` : suffix
}

/**
 * Format seconds to ISO 8601 duration (for Schema.org).
 * Example: 30 → "PT30S", 90 → "PT1M30S"
 */
export function formatIsoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `PT${s}S`
  if (s === 0) return `PT${m}M`
  return `PT${m}M${s}S`
}

/**
 * Format seconds to human-readable "M:SS".
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Generate a random integer seed.
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647)
}
