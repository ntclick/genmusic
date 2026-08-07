/**
 * Admin authentication helpers.
 * Admin: 1phut30giayvi@gmail.com (0xJun)
 *
 * DB schema: users.user_id (bigint PK), username (stores Firebase UID), email (unique), role (enum)
 */
import { getSupabaseAdminClient } from './supabase'

const ADMIN_EMAILS = ['1phut30giayvi@gmail.com']

export async function isAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (!userId) return false

  // Fast path: check hardcoded email directly
  if (email && ADMIN_EMAILS.includes(email)) return true

  const sb = getSupabaseAdminClient() as any

  // Try by username (= Firebase UID) or email
  const { data } = await sb
    .from('users')
    .select('role, email')
    .or(`username.eq.${userId},email.eq.${email || ''}`)
    .limit(1)
    .single()

  if (!data) {
    // User not in DB — only allow if email matches admin
    return !!email && ADMIN_EMAILS.includes(email)
  }

  if (data.role === 'admin') return true
  if (ADMIN_EMAILS.includes(data.email)) return true

  return false
}

export async function requireAdmin(
  userId: string | null,
  email?: string | null
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!userId) return { ok: false, status: 401, error: 'Not authenticated' }
  const admin = await isAdmin(userId, email)
  if (!admin) return { ok: false, status: 403, error: 'Access denied' }
  return { ok: true }
}
