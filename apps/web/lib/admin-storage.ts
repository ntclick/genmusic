/**
 * Admin data layer — queries for admin dashboard.
 *
 * DB schema:
 *   users: user_id (bigint PK), username (Firebase UID), email, display_name, avatar_url, role, is_verified, last_login, created_at
 *   music_generations: user_id (text, stores Firebase UID) — matches users.username
 */
import { getSupabaseAdminClient } from './supabase'

function db() {
  return getSupabaseAdminClient() as any
}

// Normalize user from actual DB fields
function normalizeUser(u: any) {
  return {
    id: u.user_id,
    user_id: u.user_id,
    firebase_uid: u.username || '',
    email: u.email || '',
    name: u.display_name || u.username || u.email?.split('@')[0] || 'User',
    avatar_url: u.avatar_url || null,
    role: u.role || 'user',
    is_verified: u.is_verified || false,
    is_banned: u.is_banned || false,
    created_at: u.created_at || '',
    last_login: u.last_login || '',
  }
}

// Resolve music_generations.user_id (Firebase UID) → user info via users.username
async function buildUserMap(firebaseUids: string[]): Promise<Record<string, { name: string; email: string }>> {
  const uniqueUids = [...new Set(firebaseUids.filter(Boolean))]
  if (uniqueUids.length === 0) return {}

  const { data } = await db()
    .from('users')
    .select('username, display_name, email')
    .in('username', uniqueUids)

  const map: Record<string, { name: string; email: string }> = {}
  for (const u of (data || [])) {
    map[u.username] = {
      name: u.display_name || u.email?.split('@')[0] || 'User',
      email: u.email || '',
    }
  }
  return map
}

// ─── Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const today = new Date().toISOString().split('T')[0]

  const [tracks, users, subs, todayQuota] = await Promise.all([
    db().from('music_generations').select('id', { count: 'exact', head: true }),
    db().from('users').select('user_id', { count: 'exact', head: true }),
    db().from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db().from('generation_quotas').select('count').eq('date', today),
  ])

  const generationsToday = (todayQuota.data || []).reduce((sum: number, q: any) => sum + (q.count || 0), 0)

  return {
    totalTracks: tracks.count || 0,
    totalUsers: users.count || 0,
    activeSubscriptions: subs.count || 0,
    generationsToday,
  }
}

export async function getRecentTracks(limit = 5) {
  const { data } = await db()
    .from('music_generations')
    .select('id, title, genre, status, engine, is_public, created_at, user_id, prompt, duration_seconds, audio_url')
    .order('created_at', { ascending: false })
    .limit(limit)

  const tracks = data || []
  const userMap = await buildUserMap(tracks.map((t: any) => t.user_id))

  return tracks.map((t: any) => ({
    ...t,
    user_name: userMap[t.user_id]?.name || t.user_id || 'Anonymous',
    user_email: userMap[t.user_id]?.email || '',
  }))
}

export async function getRecentUsers(limit = 5) {
  const { data } = await db()
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []).map(normalizeUser)
}

// ─── Tracks ─────────────────────────────────────────────────────────────

export async function getAllTracks(options: {
  limit?: number
  offset?: number
  status?: string
  genre?: string
  search?: string
}) {
  const { limit = 20, offset = 0, status, genre, search } = options

  let query = db()
    .from('music_generations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (genre) query = query.eq('genre', genre)
  if (search) query = query.or(`title.ilike.%${search}%,prompt.ilike.%${search}%`)

  const { data, count } = await query
  const tracks = data || []

  const userMap = await buildUserMap(tracks.map((t: any) => t.user_id))

  const enriched = tracks.map((t: any) => ({
    ...t,
    user_name: userMap[t.user_id]?.name || t.user_id || 'Anonymous',
    user_email: userMap[t.user_id]?.email || '',
  }))

  return { data: enriched, count: count || 0 }
}

export async function adminUpdateTrack(id: string, updates: Record<string, any>) {
  updates.updated_at = new Date().toISOString()
  const { error } = await db().from('music_generations').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminDeleteTrack(id: string) {
  const { error } = await db().from('music_generations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Users ──────────────────────────────────────────────────────────────

export async function getAllUsers(options: { limit?: number; offset?: number; search?: string }) {
  const { limit = 20, offset = 0, search } = options

  let query = db()
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,username.ilike.%${search}%`)

  const { data, count, error } = await query
  if (error) {
    console.error('[admin-storage] getAllUsers error:', error.message)
    return { data: [], count: 0 }
  }

  const users = (data || []).map(normalizeUser)

  // Enrich with active subscription plan
  const firebaseUids = users.map((u: any) => u.firebase_uid).filter(Boolean)
  if (firebaseUids.length > 0) {
    const { data: subs } = await db()
      .from('user_subscriptions')
      .select('user_id, plan_id, status')
      .in('user_id', firebaseUids)
      .eq('status', 'active')

    const subMap: Record<string, string> = {}
    for (const s of (subs || [])) {
      subMap[s.user_id] = s.plan_id
    }

    for (const u of users) {
      (u as any).plan_id = subMap[(u as any).firebase_uid] || null
    }
  }

  return { data: users, count: count || 0 }
}

export async function adminUpdateUser(id: string | number, updates: { role?: string }) {
  const { error } = await db()
    .from('users')
    .update(updates)
    .eq('user_id', id)

  if (error) throw new Error(error.message)
}

// ─── Genres ─────────────────────────────────────────────────────────────

export async function getAllGenres() {
  const { data } = await db().from('music_genres').select('*').order('sort_order')
  return data || []
}

export async function adminUpdateGenre(id: string, updates: Record<string, any>) {
  const { error } = await db().from('music_genres').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function adminCreateGenre(genre: { id: string; name: string; prompt_template: string; icon?: string; description?: string; sort_order?: number }) {
  const { error } = await db().from('music_genres').insert(genre)
  if (error) throw new Error(error.message)
}

export async function adminDeleteGenre(id: string) {
  const { error } = await db().from('music_genres').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Plans ──────────────────────────────────────────────────────────────

export async function getAllPlans() {
  const { data } = await db().from('subscription_plans').select('*').order('price_usd')
  return data || []
}

export async function adminUpdatePlan(id: string, updates: Record<string, any>) {
  const { error } = await db().from('subscription_plans').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
}
