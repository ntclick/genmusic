import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const offset = (page - 1) * limit

    const supabase = getSupabaseClient()

    // Get ringtones with pagination
    const { data: ringtones, error, count } = await supabase
      .from('ringtones')
      .select(`
        ringtone_id,
        title,
        slug,
        artist,
        description,
        duration_seconds,
        file_size_kb,
        file_url_mp3,
        file_url_m4r,
        artwork_url,
        category_id,
        upload_source,
        play_count,
        download_count,
        like_count,
        view_count,
        rating_avg,
        is_featured,
        is_trending,
        created_at,
        categories (
          category_id,
          category_name,
          category_slug
        )
      `, { count: 'exact' })
      .eq('category_id', parseInt(params.categoryId))
      .eq('is_active', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch ringtones' }, { status: 500 })
    }

    // Check if there are more results
    const totalCount = count || 0
    const hasMore = offset + limit < totalCount

    return NextResponse.json({
      ringtones: ringtones || [],
      hasMore,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
