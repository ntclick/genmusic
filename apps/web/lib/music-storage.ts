/**
 * Data access layer for music generation feature.
 * All DB operations go through Supabase.
 *
 * Uses untyped client since new tables are not yet in generated Database types.
 */
import { getSupabaseAdminClient } from './supabase'
import { generateTitleAndDescription } from './music-title-generator'
import { generateSlug } from './music-utils'
import { getArtworkImage } from './pexels'
import type { MusicGenre, MusicGeneration, SubscriptionPlan, UserSubscription, QuotaResponse } from '@/types/music'

// Untyped admin client for tables not in generated types
function db() {
  return getSupabaseAdminClient() as any
}

// ─── Genres ──────────────────────────────────────────────────────────────

export async function getAllMusicGenres(): Promise<MusicGenre[]> {
  const { data } = await db().from('music_genres').select('*').order('sort_order')
  return (data as MusicGenre[]) || []
}

export async function getGenreTemplate(genreId: string): Promise<string | null> {
  const { data } = await db().from('music_genres').select('prompt_template').eq('id', genreId).single()
  return (data as { prompt_template: string } | null)?.prompt_template ?? null
}

// ─── Generations ─────────────────────────────────────────────────────────

export async function createMusicGeneration(input: {
  prompt: string
  lyrics: string
  genre: string
  duration_seconds: number
  seed: number
  title?: string | null
  user_id?: string | null
  has_vocals: boolean
  engine: 'musicgen' | 'suno'
}): Promise<string> {
  const { data, error } = await db()
    .from('music_generations')
    .insert({
      prompt: input.prompt,
      lyrics: input.lyrics,
      genre: input.genre,
      duration_seconds: input.duration_seconds,
      seed: input.seed,
      title: input.title ?? null,
      user_id: input.user_id ?? null,
      has_vocals: input.has_vocals,
      engine: input.engine,
      status: 'processing',
      is_public: true,
      source: 'user',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to create generation')
  return (data as { id: string }).id
}

export async function getGenerationStatus(jobId: string) {
  const { data } = await db()
    .from('music_generations')
    .select('id, status, audio_url, generation_time_ms, created_at, title, slug')
    .eq('id', jobId)
    .single()
  return data as { id: string; status: string; audio_url: string | null; generation_time_ms: number | null; created_at: string; title: string | null; slug: string | null } | null
}

export async function completeGeneration(
  jobId: string,
  result: { audio_url: string; audio_size_kb?: number; generation_time_ms?: number }
) {
  const { error } = await db()
    .from('music_generations')
    .update({
      status: 'completed',
      audio_url: result.audio_url,
      audio_size_kb: result.audio_size_kb ?? null,
      generation_time_ms: result.generation_time_ms ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  if (error) throw new Error(`completeGeneration failed: ${error.message}`)
}

export async function markGenerationFailed(jobId: string) {
  await db()
    .from('music_generations')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', jobId)
}

export async function updateMusicGenerationStatus(
  jobId: string,
  status: string,
  extra?: Record<string, any>
) {
  const updates: Record<string, any> = { status, updated_at: new Date().toISOString(), ...extra }
  await db()
    .from('music_generations')
    .update(updates)
    .eq('id', jobId)
}

/** Find our jobId by Suno taskId stored in engine field as "suno:{taskId}" */
export async function findJobBySunoTaskId(sunoTaskId: string): Promise<string | null> {
  const { data } = await db()
    .from('music_generations')
    .select('id')
    .eq('engine', `suno:${sunoTaskId}`)
    .limit(1)
    .single()
  return (data as { id: string } | null)?.id || null
}

export async function getUserGenerations(userId: string, limit = 25): Promise<MusicGeneration[]> {
  const { data } = await db()
    .from('music_generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as MusicGeneration[]) || []
}

export async function getRecentPublicGenerations(limit = 12): Promise<MusicGeneration[]> {
  const { data } = await db()
    .from('music_generations')
    .select('*')
    .eq('status', 'completed')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as MusicGeneration[]) || []
}

// ─── Subscriptions ───────────────────────────────────────────────────────

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await db()
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_usd')
  return (data as SubscriptionPlan[]) || []
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const { data } = await db()
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return data as UserSubscription | null
}

export async function createUserSubscription(input: {
  user_id: string
  plan_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  current_period_start?: string
  current_period_end?: string
}): Promise<string> {
  // Deactivate any existing active subscription
  await db()
    .from('user_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('user_id', input.user_id)
    .eq('status', 'active')

  const { data, error } = await db()
    .from('user_subscriptions')
    .insert({
      user_id: input.user_id,
      plan_id: input.plan_id,
      stripe_customer_id: input.stripe_customer_id ?? null,
      stripe_subscription_id: input.stripe_subscription_id ?? null,
      status: 'active',
      current_period_start: input.current_period_start ?? new Date().toISOString(),
      current_period_end: input.current_period_end ?? null,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to create subscription')
  return (data as { id: string }).id
}

export async function cancelUserSubscription(userId: string) {
  await db()
    .from('user_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active')
}

// ─── Quota ───────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['1phut30giayvi@gmail.com']

export async function getUserQuota(userId: string | null, quotaIdentifier?: string): Promise<QuotaResponse> {
  // Check if admin — unlimited everything
  if (userId) {
    // music_generations stores Firebase UID as user_id, which maps to users.username
    const { data: userRow } = await db()
      .from('users')
      .select('role, email')
      .or(`username.eq.${userId},email.eq.${userId}`)
      .limit(1)
      .single()

    if (userRow) {
      const isAdmin = userRow.role === 'admin' || ADMIN_EMAILS.includes(userRow.email)
      if (isAdmin) {
        return { plan: 'admin', used: 0, limit: 9999, remaining: 9999, can_generate: true, has_vocals: true, vocal_limit: 9999, vocal_used: 0, vocal_remaining: 9999, max_duration: 60 }
      }
    }
  }

  // Determine plan
  let plan: SubscriptionPlan | null = null
  if (userId) {
    const sub = await getUserSubscription(userId)
    if (sub) {
      const { data } = await db()
        .from('subscription_plans')
        .select('*')
        .eq('id', sub.plan_id)
        .single()
      plan = data as SubscriptionPlan | null
    }
  }

  // Default to 'free' for anonymous, 'starter' for logged-in without subscription
  if (!plan) {
    const planId = userId ? 'starter' : 'free'
    const { data } = await db()
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()
    plan = data as SubscriptionPlan | null
  }

  if (!plan) {
    return { plan: 'free', used: 0, limit: 1, remaining: 1, can_generate: true, has_vocals: true, vocal_limit: 1, vocal_used: 0, vocal_remaining: 1, max_duration: 15 }
  }

  // Vocal limits per plan: free=0 (no vocals), starter=1, pro=5, premium=50
  const VOCAL_LIMITS: Record<string, number> = { free: 0, starter: 1, pro: 5, premium: 50 }
  const vocalLimit = VOCAL_LIMITS[plan.id] ?? 1

  // Get today's usage — use same identifier as incrementQuota
  let used = 0
  const identifier = quotaIdentifier || userId || 'anonymous'
  const today = new Date().toISOString().split('T')[0]
  const { data: quota } = await db()
    .from('generation_quotas')
    .select('count')
    .eq('user_id', identifier)
    .eq('date', today)
    .single()

  if (quota) {
    used = (quota as { count: number }).count
  }

  // Count today's vocal generations (music_generations.user_id = Firebase UID or null)
  let vocalUsed = 0
  if (userId) {
    const { count: vocalCount } = await db()
      .from('music_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('has_vocals', true)
      .gte('created_at', `${today}T00:00:00`)
    vocalUsed = vocalCount || 0
  }

  const remaining = Math.max(0, plan.generations_per_day - used)
  const vocalRemaining = Math.max(0, vocalLimit - vocalUsed)
  return {
    plan: plan.id,
    used,
    limit: plan.generations_per_day,
    remaining,
    can_generate: remaining > 0,
    has_vocals: true,
    vocal_limit: vocalLimit,
    vocal_used: vocalUsed,
    vocal_remaining: vocalRemaining,
    max_duration: plan.max_duration_seconds,
  }
}

export async function incrementQuota(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  // Try to increment existing row first
  const { data: existing } = await db()
    .from('generation_quotas')
    .select('id, count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    const newCount = (existing as { id: string; count: number }).count + 1
    await db()
      .from('generation_quotas')
      .update({ count: newCount })
      .eq('id', (existing as { id: string }).id)
    return newCount
  }

  // No row yet — insert new
  const { error } = await db()
    .from('generation_quotas')
    .insert({ user_id: userId, date: today, count: 1 })

  if (error) {
    console.error('[quota] insert error:', error.message)
  }
  return 1
}

// ─── Complete with AI metadata ───────────────────────────────────────────

/**
 * Complete a generation AND generate AI title/description/slug.
 * Wraps completeGeneration() + async metadata enrichment.
 */
export async function completeGenerationWithMetadata(
  jobId: string,
  result: { audio_url: string; audio_size_kb?: number; generation_time_ms?: number }
) {
  // 1. Save audio immediately (user can listen right away)
  await completeGeneration(jobId, result)

  // 2. Async: generate title + description (non-blocking)
  try {
    const { data: record } = await db()
      .from('music_generations')
      .select('id, prompt, genre, lyrics, has_vocals')
      .eq('id', jobId)
      .single()

    if (!record) return

    const { title, description } = await generateTitleAndDescription(
      record.prompt,
      record.genre,
      record.lyrics || '',
      record.has_vocals || false
    )

    const slug = generateSlug(title, record.id)

    // Fetch artwork image from Pexels/Pixabay based on genre + prompt
    const artworkUrl = await getArtworkImage(record.genre, record.prompt?.slice(0, 50))

    await db()
      .from('music_generations')
      .update({
        title,
        description,
        slug,
        artwork_url: artworkUrl,
        meta_title: `${title} - AI ${record.genre.charAt(0).toUpperCase() + record.genre.slice(1)} Music`,
        meta_description: description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  } catch (err) {
    console.error(`[music-storage] Failed to generate metadata for ${jobId}:`, (err as Error).message)
  }
}

// ─── User track management ──────────────────────────────────────────────

export async function updateMusicGeneration(
  jobId: string,
  userId: string,
  updates: { title?: string; description?: string; is_public?: boolean }
) {
  // Build update object + regenerate slug if title changed
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

  if (updates.title !== undefined) {
    updateData.title = updates.title
    updateData.slug = generateSlug(updates.title, jobId)
    updateData.meta_title = `${updates.title} - AI Music`
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description
    updateData.meta_description = updates.description
  }
  if (updates.is_public !== undefined) {
    updateData.is_public = updates.is_public
  }

  const { error } = await db()
    .from('music_generations')
    .update(updateData)
    .eq('id', jobId)
    .eq('user_id', userId)

  if (error) throw new Error(`Update failed: ${error.message}`)
}

export async function deleteMusicGeneration(jobId: string, userId: string) {
  const { error } = await db()
    .from('music_generations')
    .delete()
    .eq('id', jobId)
    .eq('user_id', userId)

  if (error) throw new Error(`Delete failed: ${error.message}`)
}

// ─── Creator info ────────────────────────────────────────────────────

export async function getCreatorInfo(firebaseUid: string | null): Promise<{ name: string; avatar_url: string | null; uid: string } | null> {
  if (!firebaseUid) return null
  const { data } = await db()
    .from('users')
    .select('display_name, email, avatar_url, username')
    .eq('username', firebaseUid)
    .single()
  if (!data) return null
  return {
    name: data.display_name || data.email?.split('@')[0] || 'User',
    avatar_url: data.avatar_url || null,
    uid: data.username,
  }
}

// ─── Public queries (detail page, explore, sitemap) ──────────────────────

export async function getPublicGenerationBySlug(slug: string): Promise<MusicGeneration | null> {
  const { data } = await db()
    .from('music_generations')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'completed')
    .eq('is_public', true)
    .single()
  return data as MusicGeneration | null
}

export async function getPublicGenerationById(id: string): Promise<MusicGeneration | null> {
  const { data } = await db()
    .from('music_generations')
    .select('*')
    .eq('id', id)
    .eq('status', 'completed')
    .eq('is_public', true)
    .single()
  return data as MusicGeneration | null
}

export async function getRelatedGenerations(genre: string, excludeId: string, limit = 6): Promise<MusicGeneration[]> {
  const { data } = await db()
    .from('music_generations')
    .select('*')
    .eq('genre', genre)
    .eq('status', 'completed')
    .eq('is_public', true)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as MusicGeneration[]) || []
}

export async function getPublicGenerations(options: {
  genre?: string
  limit?: number
  offset?: number
}): Promise<{ data: MusicGeneration[]; count: number }> {
  const { genre, limit = 24, offset = 0 } = options

  let query = db()
    .from('music_generations')
    .select('*', { count: 'exact' })
    .eq('status', 'completed')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (genre) query = query.eq('genre', genre)

  const { data, count } = await query
  return { data: (data as MusicGeneration[]) || [], count: count || 0 }
}

// ─── Public profile queries ──────────────────────────────────────────────

export async function getUserPublicProfile(
  uid: string
): Promise<{ name: string; avatar_url: string | null; uid: string; email: string | null } | null> {
  const { data } = await db()
    .from('users')
    .select('display_name, email, avatar_url, username')
    .eq('username', uid)
    .single()
  if (!data) return null
  return {
    name: data.display_name || data.email?.split('@')[0] || 'User',
    avatar_url: data.avatar_url || null,
    uid: data.username,
    email: null, // never expose email publicly
  }
}

export async function getUserPublicTracks(
  uid: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ data: MusicGeneration[]; count: number }> {
  const { limit = 24, offset = 0 } = options
  const { data, count } = await db()
    .from('music_generations')
    .select('*', { count: 'exact' })
    .eq('user_id', uid)
    .eq('status', 'completed')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return { data: (data as MusicGeneration[]) || [], count: count || 0 }
}

export async function getPublicGenerationSlugs(): Promise<Array<{ slug: string; updated_at: string }>> {
  const { data } = await db()
    .from('music_generations')
    .select('slug, updated_at')
    .eq('status', 'completed')
    .eq('is_public', true)
    .not('slug', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5000)
  return (data as Array<{ slug: string; updated_at: string }>) || []
}
