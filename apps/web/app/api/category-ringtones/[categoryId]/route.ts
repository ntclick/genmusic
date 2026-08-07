import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase'; // ✅ NEW: Import Supabase Client

// Removed MockRingtone interface as we will use the actual Database types
// Removed MOCK_DB and CATEGORY_MAP as we will fetch from Supabase

export async function GET(request: Request, { params }: { params: { categoryId: string } }) {
    const { searchParams } = new URL(request.url);
    const categoryId = params.categoryId;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5'); // Default to 5 items per page
    const sortBy = searchParams.get('sortBy') || 'created_at'; // Default sort
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Default order

    // console.log('API Request:', { categoryId, page, limit, sortBy, sortOrder }); // Disabled logging to reduce spam

    const supabase = getSupabaseClient(); // Initialize Supabase client

    let query = supabase
        .from('ringtones')
        .select(`
            ringtone_id,
            title,
            slug,
            artist,
            description,
            duration_seconds,
            r2_original_key,
            file_url_mp3,
            file_url_m4r,
            artwork_url,
            play_count,
            download_count,
            like_count,
            created_at,
            categories!inner(
                category_id,
                category_name,
                category_slug
            )
        `, { count: 'exact' });

    // Apply category filter
    if (categoryId !== '0' && categoryId !== 'trending') {
        // Filter by category using junction table relationship
        query = query.eq('categories.category_id', parseInt(categoryId));
    }

    // Apply sorting
    if (sortBy === 'play_count' || sortBy === 'download_count' || sortBy === 'like_count') {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else { // Default to created_at
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    query = query.range(startIndex, endIndex);

    try {
        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase query error:', error);
            return NextResponse.json({ error: error.message || 'Database query failed' }, { status: 500 });
        }

        const ringtones = (data || []).map(ringtone => ({
            ...ringtone,
            file_url_mp3: ringtone.file_url_mp3 || '/demo-song.mp3', // ✅ NEW: Fallback for null file_url_mp3
            artwork_url: ringtone.artwork_url || '/file.svg', // ✅ NEW: Fallback for null artwork_url
            categories: ringtone.categories ? [ringtone.categories] : [{ category_name: 'Unknown', category_slug: 'unknown' }], // ✅ Ensure categories is an array with default
        }));

        const totalCount = count || 0;
        const hasMore = endIndex + 1 < totalCount;
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            ringtones,
            hasMore,
            totalCount,
            currentPage: page,
            totalPages,
        });

    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
