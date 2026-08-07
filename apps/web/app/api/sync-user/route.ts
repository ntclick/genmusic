import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

type UserPayload = {
  uid?: string | null
  email?: string | null
  displayName?: string | null
  photoURL?: string | null
}

export const runtime = 'nodejs'

/**
 * Sync Firebase user to Supabase public.users table.
 *
 * Schema: user_id (bigint auto PK), username (unique), email (unique),
 *         password_hash (NOT NULL), display_name, avatar_url,
 *         role (enum: user/admin/moderator), is_verified, last_login, created_at
 *
 * We store Firebase UID in username field for lookup (email is also unique).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UserPayload
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { uid, email, displayName, photoURL } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const admin = getSupabaseAdminClient() as any

    // Check if user already exists by email
    const { data: existing } = await admin
      .from('users')
      .select('user_id, email, role')
      .eq('email', email)
      .single()

    if (existing) {
      // Update last_login + display_name
      await admin
        .from('users')
        .update({
          display_name: displayName || existing.display_name,
          avatar_url: photoURL || null,
          last_login: now,
        })
        .eq('user_id', existing.user_id)

      return NextResponse.json({
        success: true,
        user: { ...existing, display_name: displayName },
      })
    }

    // Insert new user — username = Firebase UID (unique identifier for lookup)
    const username = uid || email.split('@')[0].slice(0, 50)

    const { data: newUser, error } = await admin
      .from('users')
      .insert({
        username,
        email,
        display_name: displayName || email.split('@')[0],
        avatar_url: photoURL || null,
        password_hash: 'firebase-oauth',
        role: 'user',
        is_verified: true,
        last_login: now,
      })
      .select('user_id, email, username, display_name, role')
      .single()

    if (error) {
      console.error('sync-user insert error:', error.message)
      // Username conflict — try with email prefix + random suffix
      const fallbackUsername = `${email.split('@')[0]}_${Date.now().toString(36)}`
      const { data: retryUser, error: retryErr } = await admin
        .from('users')
        .insert({
          username: fallbackUsername,
          email,
          display_name: displayName || email.split('@')[0],
          avatar_url: photoURL || null,
          password_hash: 'firebase-oauth',
          role: 'user',
          is_verified: true,
          last_login: now,
        })
        .select('user_id, email, username, display_name, role')
        .single()

      if (retryErr) {
        console.error('sync-user retry error:', retryErr.message)
        return NextResponse.json({ error: retryErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, user: retryUser })
    }

    return NextResponse.json({ success: true, user: newUser })
  } catch (error: any) {
    console.error('sync-user error:', error?.message)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
