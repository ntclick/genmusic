import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllUsers, adminUpdateUser } from '@/lib/admin-storage'
import { createUserSubscription, cancelUserSubscription } from '@/lib/music-storage'
import { getSupabaseAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const url = new URL(req.url)
  const { data, count } = await getAllUsers({
    limit: parseInt(url.searchParams.get('limit') || '20'),
    offset: parseInt(url.searchParams.get('offset') || '0'),
    search: url.searchParams.get('search') || undefined,
  })

  return NextResponse.json({ data, count })
}

// Helper: get firebase_uid (username) from user_id (bigint PK)
async function getFirebaseUid(userId: string | number): Promise<string | null> {
  const sb = getSupabaseAdminClient() as any
  const { data } = await sb
    .from('users')
    .select('username')
    .eq('user_id', userId)
    .single()
  return data?.username || null
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await req.json()
  const { id, firebase_uid, action, role, plan_id } = body

  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

  if (action === 'change_role' && role) {
    // change_role uses user_id (bigint PK)
    await adminUpdateUser(id, { role })
    return NextResponse.json({ ok: true })
  }

  if (action === 'assign_plan' && plan_id) {
    // subscriptions use firebase_uid (text) as user_id
    const fbUid = firebase_uid || await getFirebaseUid(id)
    if (!fbUid) return NextResponse.json({ error: 'Could not resolve user' }, { status: 400 })
    await createUserSubscription({ user_id: fbUid, plan_id })
    return NextResponse.json({ ok: true })
  }

  if (action === 'cancel_plan') {
    const fbUid = firebase_uid || await getFirebaseUid(id)
    if (!fbUid) return NextResponse.json({ error: 'Could not resolve user' }, { status: 400 })
    await cancelUserSubscription(fbUid)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
