import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllTracks, adminUpdateTrack, adminDeleteTrack } from '@/lib/admin-storage'

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const url = new URL(req.url)
  const { data, count } = await getAllTracks({
    limit: parseInt(url.searchParams.get('limit') || '20'),
    offset: parseInt(url.searchParams.get('offset') || '0'),
    status: url.searchParams.get('status') || undefined,
    genre: url.searchParams.get('genre') || undefined,
    search: url.searchParams.get('search') || undefined,
  })

  return NextResponse.json({ data, count })
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await adminUpdateTrack(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await adminDeleteTrack(id)
  return NextResponse.json({ ok: true })
}
