import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'
import { getArtworkImage } from '@/lib/pexels'

/**
 * POST /api/music/backfill-artwork
 * Backfill artwork_url for existing tracks that don't have one.
 * Admin-only: requires ?secret=<WEBHOOK_SECRET>
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdminClient() as any
  const limit = Number(searchParams.get('limit') || '20')

  // Find tracks without artwork
  const { data: tracks, error } = await db
    .from('music_generations')
    .select('id, genre, prompt')
    .eq('status', 'completed')
    .eq('is_public', true)
    .is('artwork_url', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let updated = 0
  for (const track of tracks || []) {
    const artworkUrl = await getArtworkImage(track.genre, track.prompt?.slice(0, 50))
    if (artworkUrl) {
      await db
        .from('music_generations')
        .update({ artwork_url: artworkUrl, updated_at: new Date().toISOString() })
        .eq('id', track.id)
      updated++
    }
  }

  return NextResponse.json({
    total: (tracks || []).length,
    updated,
  })
}
