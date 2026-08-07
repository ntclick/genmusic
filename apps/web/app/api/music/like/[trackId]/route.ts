import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'

/**
 * POST /api/music/like/[trackId]
 * Body: { action: 'like' | 'dislike' | 'remove_like' | 'remove_dislike' }
 */
export async function POST(
  req: Request,
  { params }: { params: { trackId: string } }
) {
  const { trackId } = params

  let body: { action: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { action } = body
  if (!['like', 'dislike', 'remove_like', 'remove_dislike'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const db = getSupabaseAdminClient() as any

  // Get current counts
  const { data: track, error: fetchError } = await db
    .from('music_generations')
    .select('like_count, dislike_count')
    .eq('id', trackId)
    .single()

  if (fetchError || !track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 })
  }

  let likeCount = track.like_count || 0
  let dislikeCount = track.dislike_count || 0

  switch (action) {
    case 'like':
      likeCount++
      break
    case 'dislike':
      dislikeCount++
      break
    case 'remove_like':
      likeCount = Math.max(0, likeCount - 1)
      break
    case 'remove_dislike':
      dislikeCount = Math.max(0, dislikeCount - 1)
      break
  }

  const { error: updateError } = await db
    .from('music_generations')
    .update({ like_count: likeCount, dislike_count: dislikeCount })
    .eq('id', trackId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ like_count: likeCount, dislike_count: dislikeCount })
}
