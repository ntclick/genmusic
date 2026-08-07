import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [], message: 'Query too short' })
  }

  // Separate try-catch for Supabase client initialization
  let supabase;
  try {
    supabase = getSupabaseClient()
  } catch (initError: any) {
    console.error('❌ Supabase client initialization failed:', initError.message)
    return NextResponse.json({ 
      results: [], 
      error: 'Database connection failed', 
      details: initError.message 
    }, { status: 500 })
  }

  try {
    if (!supabase) {
      console.error('❌ Supabase client is null')
      return NextResponse.json({ results: [], error: 'Database connection failed' }, { status: 500 })
    }
    
    // Search ringtones by title (case-insensitive) - using correct column names
    const { data, error } = await supabase
      .from('ringtones')
      .select('ringtone_id, title, slug, duration_seconds, play_count, like_count')
      .ilike('title', `%${query}%`)
      .order('play_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Supabase query error:', error)
      return NextResponse.json({ results: [], error: 'Search failed', details: error.message }, { status: 500 })
    }

    // Format results with correct field mapping
    const results = data?.map((ringtone: any) => ({
      id: ringtone.ringtone_id,
      title: ringtone.title,
      slug: ringtone.slug,
      duration: ringtone.duration_seconds,
      plays: ringtone.play_count,
      likes: ringtone.like_count,
      category: 'Ringtone'
    })) || []

    return NextResponse.json({ 
      results,
      query,
      count: results.length
    })
  } catch (error: any) {
    console.error('❌ Search API error:', error)
    return NextResponse.json({ 
      results: [], 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
