import { NextRequest, NextResponse } from 'next/server'
import {
  getUserGenerations,
  updateMusicGeneration,
  deleteMusicGeneration,
} from '@/lib/music-storage'

/**
 * GET /api/music/tracks — get current user's tracks with pagination
 * Query params: ?limit=20&offset=0
 * Returns: { data: MusicGeneration[], count: number }
 */
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

  try {
    // getUserGenerations returns ordered-by-date results with a limit cap.
    // Fetch enough to cover offset + limit, then slice for the page.
    const fetchSize = offset + limit
    const all = await getUserGenerations(userId, fetchSize)
    const data = all.slice(offset, offset + limit)

    // For total count: if we got fewer than fetchSize, total = all.length.
    // Otherwise there may be more — fetch a high-limit count.
    let count = all.length
    if (all.length >= fetchSize) {
      const fullList = await getUserGenerations(userId, 10000)
      count = fullList.length
    }

    return NextResponse.json({ data, count })
  } catch (err) {
    console.error('[tracks GET]', err)
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 })
  }
}

/**
 * PATCH /api/music/tracks — update track title/description/visibility
 * Body: { id: string, title?: string, description?: string, is_public?: boolean }
 */
export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, title, description, is_public } = body as {
      id?: string
      title?: string
      description?: string
      is_public?: boolean
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
    }

    if (title === undefined && description === undefined && is_public === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // updateMusicGeneration enforces user_id match internally
    await updateMusicGeneration(id, userId, { title, description, is_public })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[tracks PATCH]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update track' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/music/tracks — delete user's own track
 * Body: { id: string }
 */
export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id } = body as { id?: string }

    if (!id) {
      return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
    }

    // deleteMusicGeneration enforces user_id match internally
    await deleteMusicGeneration(id, userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[tracks DELETE]', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to delete track' },
      { status: 500 }
    )
  }
}
