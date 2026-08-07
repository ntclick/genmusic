import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllGenres, adminUpdateGenre, adminCreateGenre, adminDeleteGenre } from '@/lib/admin-storage'

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const data = await getAllGenres()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await req.json()
  await adminCreateGenre(body)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await adminUpdateGenre(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await adminDeleteGenre(id)
  return NextResponse.json({ ok: true })
}
