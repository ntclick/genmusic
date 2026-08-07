import { NextRequest, NextResponse } from 'next/server'
import { updateMusicGeneration, deleteMusicGeneration } from '@/lib/music-storage'

/**
 * PATCH /api/music/tracks/[id] — update title, description, visibility
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const updates: { title?: string; description?: string; is_public?: boolean } = {}

    if (typeof body.title === 'string') updates.title = body.title.slice(0, 200)
    if (typeof body.description === 'string') updates.description = body.description.slice(0, 500)
    if (typeof body.is_public === 'boolean') updates.is_public = body.is_public

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await updateMusicGeneration(params.id, userId, updates)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/music/tracks/[id] — delete own track
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await deleteMusicGeneration(params.id, userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
