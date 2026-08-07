import { getSupabaseClient, getSupabaseAdminClient } from './supabase'
import { getPublicUrl } from './r2'
import type { Database } from '@/types/supabase'

export type Ringtone = Database['public']['Tables']['ringtones']['Row'] & {
  categories?: { category_name: string; category_slug: string }[];
  rank?: number;
  file_url_mp3: string | null;
  file_url_m4r: string | null;
  artwork_url: string | null;
  r2_original_key: string | null;
};

export type Category = Database['public']['Tables']['categories']['Row']

// Cache signed URLs (per request/serverless function)
const urlCache = new Map<string, { url: string; expires: number }>()

// In-memory cache for trending data
let trendingCache: {
  [key: string]: {
    data: any[];
    timestamp: number;
    expires: number;
  }
} = {};

// Get trending ringtones with advanced caching and time-based scoring
export async function getTrendingRingtones(limit = 20, timeRange: '24h' | 'week' | 'all' = 'all') {
  const cacheKey = `trending_${limit}_${timeRange}`;

  // Check in-memory cache first (server-side)
  const cached = trendingCache[cacheKey];
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  // Check client-side cache
  if (typeof window !== 'undefined') {
    const clientCache = localStorage.getItem(cacheKey);
    if (clientCache) {
      const { data, timestamp } = JSON.parse(clientCache);
      // Cache for 1 hour on client for better persistence
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return data;
      }
    }
  }

  try {
    let ringtones;

    if (timeRange === 'all') {
      // For "all time", use simple download count ordering
      const { data, error } = await getSupabaseClient()
        .from('ringtones')
        .select('*')
        .eq('is_active', true)
        .order('download_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      ringtones = data || [];
    } else {
      // For time-based trending, try to get recent records first, fallback to all records
      const daysBack = timeRange === '24h' ? 1 : 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // First try to get ringtones with recent activity
      let { data, error } = await getSupabaseClient()
        .from('ringtones')
        .select('*')
        .eq('is_active', true)
        .gte('updated_at', cutoffDate.toISOString())
        .order('download_count', { ascending: false })
        .limit(limit * 2); // Get more to calculate scores

      if (error) throw error;

      // If no recent records, get all records and calculate trending scores
      if (!data || data.length === 0) {
        const { data: allData, error: allError } = await getSupabaseClient()
          .from('ringtones')
          .select('*')
          .eq('is_active', true)
          .order('download_count', { ascending: false })
          .limit(limit * 2);

        if (allError) throw allError;
        data = allData;
      }

      // Calculate trending scores (higher = more trending)
      ringtones = (data || []).map(ringtone => {
        const daysSinceUpdate = Math.max(1, (Date.now() - new Date(ringtone.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        const recencyFactor = Math.max(0.1, 1 / Math.sqrt(daysSinceUpdate)); // Recent = higher score

        // Trending score = downloads * recency + plays * 0.5 + likes * 2
        const trendingScore =
          (ringtone.download_count || 0) * recencyFactor +
          (ringtone.play_count || 0) * 0.5 * recencyFactor +
          (ringtone.like_count || 0) * 2 * recencyFactor;

        return {
          ...ringtone,
          trending_score: trendingScore
        };
      })
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);
    }

    // ✅ FIXED: Always return real data, only fallback to mock if database is completely empty
    const result = ringtones.length > 0 ? ringtones : getMockTrendingRingtones(limit);

    // Cache results for 30 minutes
    const cacheExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
    trendingCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
      expires: cacheExpiry
    };

    // console.log(`💾 RAM cached ${result.length} trending ringtones for ${timeRange} (30min expiry)`);

    // Client-side cache
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    }

    // Preload audio URLs for top 10 ringtones
    if (result.length > 0) {
      setTimeout(() => {
        result.slice(0, 10).forEach(async (ringtone) => {
          try {
            await getAudioUrl(ringtone);
          } catch (error) {
            console.warn('Failed to preload audio for', ringtone.title);
          }
        });
      }, 1000);
    }

    // console.log(`✅ Fetched ${result.length} trending ringtones for ${timeRange}`);
    return result;

  } catch (err) {
    console.error('Error fetching trending ringtones:', err);
    return getMockTrendingRingtones(limit);
  }
}

// Get newest ringtones
export async function getNewRingtones(limit = 20) {
  const cacheKey = `new_ringtones_${limit}`;

  // Check in-memory cache first
  const cached = trendingCache[cacheKey];
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  // Check client-side cache
  if (typeof window !== 'undefined') {
    const clientCache = localStorage.getItem(cacheKey);
    if (clientCache) {
      const { data, timestamp } = JSON.parse(clientCache);
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return data;
      }
    }
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from('ringtones')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const ringtones = data || [];
    const result = ringtones.length > 0 ? ringtones : getMockTrendingRingtones(limit);

    // Cache results for 30 minutes
    const cacheExpiry = Date.now() + (30 * 60 * 1000);
    trendingCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
      expires: cacheExpiry
    };

    // Client-side cache
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    }

    return result;
  } catch (err) {
    console.error('Error fetching new ringtones:', err);
    return getMockTrendingRingtones(limit);
  }
}

// Get related ringtones by category
export async function getRelatedRingtones(
  categorySlug: string,
  currentRingtoneId: string | number,
  limit: number = 8
) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('ringtones')
      .select(`
        ringtone_id,
        title,
        artist,
        slug,
        download_count,
        categories!inner(category_slug)
      `)
      .eq('categories.category_slug', categorySlug)
      .neq('ringtone_id', typeof currentRingtoneId === 'string' ? parseInt(currentRingtoneId) : currentRingtoneId)
      .eq('is_active', true)
      .order('download_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (err) {
    console.error('Error fetching related ringtones:', err)
    return []
  }
}

// Get categories with caching
export async function getCategories() {
  // Try to get from cache first (client-side only)
  if (typeof window !== 'undefined') {
    const cacheKey = 'categories';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 10 minutes
      if (Date.now() - timestamp < 10 * 60 * 1000) {
        return data;
      }
    }
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return getMockCategories()
    }

    let result = data || [];

    // Calculate daily downloads for each category
    if (result.length > 0) {
      try {
        const downloadStats = await getCategoriesWithDownloadStats();

        result = result.map(category => ({
          ...category,
          dailyDownloads: downloadStats[category.category_id] || 0
        })) as any[];

        // Sort by daily downloads (descending) for popularity
        result.sort((a: any, b: any) => (b.dailyDownloads || 0) - (a.dailyDownloads || 0));
      } catch (statsError) {
        console.warn('Failed to get download stats, using default order:', statsError);
        // Fallback to display_order if stats fail
        result.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      }
    }

    // Cache result (client-side only)
    if (typeof window !== 'undefined') {
      const cacheKey = 'categories';
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    }

    return result;
  } catch (err) {
    console.error('Error fetching categories:', err)
    return getMockCategories()
  }
}

// Calculate daily downloads for categories (for future real data implementation)
export async function getCategoriesWithDownloadStats() {
  try {
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Query to get daily download stats per category
    const { data, error } = await getSupabaseClient()
      .from('ringtones')
      .select(`
        ringtone_id,
        category_id,
        download_count,
        created_at
      `)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      console.error('Error fetching download stats:', error);
      return {};
    }

    // Aggregate downloads by category
    const stats = (data || []).reduce((acc, ringtone: any) => {
      const categoryId = ringtone.category_id;
      if (categoryId !== null && categoryId !== undefined) {
        acc[categoryId] = (acc[categoryId] || 0) + (ringtone.download_count || 0);
      }
      return acc;
    }, {} as Record<number, number>);

    return stats;
  } catch (err) {
    console.error('Error calculating download stats:', err);
    return {};
  }
}


// Get ringtone by slug
export async function getRingtoneBySlug(slug: string) {
  const { data, error } = await getSupabaseClient()
    .from('ringtones')
    .select(`
      *,
      categories(*),
      reviews(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching ringtone:', error)
    return null
  }

  return data
}

// Search ringtones
export async function searchRingtones(query: string, limit = 20) {
  const { data, error } = await getSupabaseClient()
    .from('ringtones')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('download_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching ringtones:', error)
    return []
  }

  return data || []
}

// Increment download count (atomic via RPC — no race conditions)
export async function incrementDownloadCount(ringtoneId: string) {
  const { error } = await getSupabaseClient()
    .rpc('increment_download_count', { p_ringtone_id: ringtoneId })

  if (error) {
    console.error('Error incrementing download count:', error)
  }
}

// Add review
export async function addReview(ringtoneId: string, rating: number, comment?: string, author?: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('reviews')
      .insert({
        ringtone_id: parseInt(ringtoneId),
        rating,
        review_text: comment,
        username: author
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding review:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error adding review (fallback):', error)
    // Create a mock review object for fallback
    return {
      review_id: Date.now(),
      ringtone_id: parseInt(ringtoneId),
      rating,
      review_text: comment,
      username: author,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

// Get reviews for a ringtone
export async function getReviews(ringtoneId: string) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('reviews')
      .select('*')
      .eq('ringtone_id', parseInt(ringtoneId))
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      // Return empty array instead of throwing
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching reviews (fallback):', error)
    // Return empty array as fallback
    return []
  }
}

// Toggle like for a ringtone
export async function toggleLike(ringtoneId: string, increment: boolean) {
  try {
    // First get current like count
    const { data: currentData, error: fetchError } = await getSupabaseClient()
      .from('ringtones')
      .select('like_count')
      .eq('ringtone_id', parseInt(ringtoneId))
      .single()

    if (fetchError) {
      console.error('Error fetching current like count:', fetchError)
      // Return current count as fallback
      return 0
    }

    const currentCount = currentData.like_count || 0
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1)

    // Update the like count
    const { data, error } = await getSupabaseClient()
      .from('ringtones')
      .update({ like_count: newCount })
      .eq('ringtone_id', parseInt(ringtoneId))
      .select('like_count')
      .single()

    if (error) {
      console.error('Error updating like count:', error)
      return currentCount
    }

    return data.like_count
  } catch (error) {
    console.error('Error toggling like (fallback):', error)
    return 0
  }
}

// Get ringtones by category with caching
export async function getRingtonesByCategory(categoryType: string, limit = 50) {
  const cacheKey = `category_${categoryType}_${limit}`;

  // Check in-memory cache first (server-side)
  const cached = trendingCache[cacheKey];
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  // Check client-side cache
  if (typeof window !== 'undefined') {
    const clientCache = localStorage.getItem(cacheKey);
    if (clientCache) {
      const { data, timestamp } = JSON.parse(clientCache);
      // Cache for 30 minutes on client
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        return data;
      }
    }
  }

  try {
    let query = getSupabaseClient()
      .from('ringtones')
      .select('*')
      .eq('is_active', true);

    // Filter by category
    if (categoryType !== 'trending') {
      // Map category types to category IDs or names
      const categoryMapping: { [key: string]: string } = {
        iphone: 'iPhone',
        android: 'Android',
        sms: 'SMS',
        alarm: 'Alarm',
        funny: 'Funny',
        game: 'Gaming'
      };

      const categoryFilter = categoryMapping[categoryType];
      if (categoryFilter) {
        query = query.ilike('title', `%${categoryFilter}%`);
      }
    }

    const { data, error } = await query
      .order('download_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching category ringtones:', error);
      // Fallback to mock data
      return getMockTrendingRingtones(limit);
    }

    const ringtones = data || [];

    // Cache results for 30 minutes
    const cacheExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
    trendingCache[cacheKey] = {
      data: ringtones,
      timestamp: Date.now(),
      expires: cacheExpiry
    };

    // console.log(`💾 RAM cached ${ringtones.length} ringtones for category ${categoryType} (30min expiry)`);

    // Client-side cache
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: ringtones,
        timestamp: Date.now()
      }));
    }

    return ringtones;
  } catch (error) {
    console.error('Error fetching category ringtones (fallback):', error);
    // Fallback to mock data
    return getMockTrendingRingtones(limit);
  }
}

// Create ringtone with R2 storage info
export async function createRingtone(ringtoneData: {
  title: string
  artist?: string
  description?: string
  duration_seconds?: number
  category_id?: number
  upload_source?: string
  r2_original_key?: string
  r2_processed_keys?: Record<string, string>
  file_checksums?: Record<string, string>
  total_storage_kb?: number
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
}) {
  const baseSlug = generateSlug(ringtoneData.title)
  let slug = baseSlug
  let attempt = 0

  while (attempt < 5) {
    const { data, error } = await getSupabaseClient()
      .from('ringtones')
      .insert({
        ...ringtoneData,
        slug,
        is_active: true
      })
      .select()
      .single()

    if (!error) return data

    // If duplicate slug, retry with a suffix
    if (error.code === '23505' && error.message?.includes('slug')) {
      attempt++
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      continue
    }

    console.error('Error creating ringtone:', error)
    throw error
  }

  throw new Error(`Failed to create ringtone after ${attempt} attempts (slug conflict)`)
}

// Update ringtone with R2 processing results
export async function updateRingtoneProcessing(
  ringtoneId: string | number,
  processingData: {
    r2_processed_keys?: Record<string, string>
    file_checksums?: Record<string, string>
    total_storage_kb?: number
  }
) {
  const numericId = typeof ringtoneId === 'string' ? Number(ringtoneId) : ringtoneId

  if (!Number.isFinite(numericId)) {
    throw new Error(`Invalid ringtoneId provided to updateRingtoneProcessing: ${ringtoneId}`)
  }

  const { data, error } = await getSupabaseClient()
    .from('ringtones')
    .update({
      r2_processed_keys: processingData.r2_processed_keys ? JSON.stringify(processingData.r2_processed_keys) : undefined,
      file_checksums: processingData.file_checksums ? JSON.stringify(processingData.file_checksums) : undefined,
      total_storage_kb: processingData.total_storage_kb,
      updated_at: new Date().toISOString()
    })
    .eq('ringtone_id', numericId)
    .select()
    .single()

  if (error) {
    console.error('Error updating ringtone processing:', error)
    throw error
  }

  return data
}

// Get download URLs for a ringtone
export function getDownloadURLs(ringtone: any) {
  const processedKeys = ringtone.r2_processed_keys ? JSON.parse(ringtone.r2_processed_keys) : {}

  return {
    mp3: processedKeys.mp3_320 ? getPublicUrl(processedKeys.mp3_320) : null,
    mp3_preview: processedKeys.mp3_preview ? getPublicUrl(processedKeys.mp3_preview) : null,
    m4r: processedKeys.m4r ? getPublicUrl(processedKeys.m4r) : null,
    wav: processedKeys.wav ? getPublicUrl(processedKeys.wav) : null,
    flac: processedKeys.flac ? getPublicUrl(processedKeys.flac) : null,
    waveform: processedKeys.waveform ? getPublicUrl(processedKeys.waveform) : null,
  }
}

// Get audio URL for playback (direct public URL)
export async function getAudioUrl(ringtone: any, format: 'mp3' | 'mp3_preview' = 'mp3') {
  const ringtoneId = ringtone.ringtone_id || ringtone.id;
  if (!ringtoneId) {
    console.error("No ringtone ID found for track:", ringtone);
    return null
  }

  // NEVER return ringtone_id or any non-URL value
  if (typeof ringtoneId === 'string' && ringtoneId.match(/^\d+$/)) {
    // This is just a numeric ID, not a URL - don't return it
  }
  if (typeof ringtoneId === 'number') {
    // This is just a numeric ID, not a URL - don't return it
  }

  const cacheKey = `${ringtoneId}_${format}`

  // Check cache first
  const cached = urlCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.url
  }

  try {
    let finalUrl: string | null = null;

    // Priority 1: Check if track has file_url_mp3 stored directly
    if (ringtone.file_url_mp3 && typeof ringtone.file_url_mp3 === 'string' && ringtone.file_url_mp3.startsWith('http')) {
      finalUrl = ringtone.file_url_mp3;
    }
    // Priority 2: Build R2 public URL from r2_original_key
    else if (ringtone.r2_original_key) {
      let key = ringtone.r2_original_key;

      // Ensure key has full path - add if missing
      if (!key.startsWith('ringtones/')) {
        // Key is just filename, add the original path
        key = `ringtones/original/${key}`
      }

      // Build public R2 URL using hardcoded domain from r2.ts
      finalUrl = `https://pub-7cafaf04d6324dc1acc356106790287a.r2.dev/${key}`;
    }
    // Priority 3: No valid URL found
    else {
      console.error("No valid audio URL for track:", ringtone);
      return null;
    }

    // Validate the final URL
    if (!finalUrl || !finalUrl.startsWith("http")) {
      console.error("Invalid audio URL generated:", finalUrl);
      return null;
    }

    // Cache the URL (long expiry since public URLs don't expire)
    urlCache.set(cacheKey, {
      url: finalUrl,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })

    return finalUrl
  } catch (error) {
    // Don't log database/network errors - only log missing file errors
    // console.warn('Database error getting audio URL for ringtone', ringtoneId, ':', error instanceof Error ? error.message : String(error))

    // Return null (no audio) - never return ringtone_id or any non-URL
    return null
  }
}

// Get storage statistics
export async function getStorageStats() {
  const { data, error } = await getSupabaseClient()
    .from('ringtones')
    .select('total_storage_kb, r2_bucket_name')
    .eq('is_active', true)

  if (error) {
    console.error('Error getting storage stats:', error)
    return { totalStorageGb: 0, totalRingtones: 0, avgSizePerRingtoneKb: 0 }
  }

  const totalStorageKb = data.reduce((sum, ringtone) => sum + (ringtone.total_storage_kb || 0), 0)
  const totalStorageGb = totalStorageKb / (1024 * 1024)
  const avgSizePerRingtoneKb = data.length > 0 ? totalStorageKb / data.length : 0

  return {
    totalStorageGb: Math.round(totalStorageGb * 100) / 100,
    totalRingtones: data.length,
    avgSizePerRingtoneKb: Math.round(avgSizePerRingtoneKb)
  }
}

// Helper function to generate slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

// Mock data functions for build-time fallback
function getMockCategories() {
  return [
    {
      category_id: 1,
      category_name: 'iPhone Ringtones',
      category_slug: 'iphone',
      description: 'Ringtones for iPhone',
      icon_emoji: '📱',
      display_order: 1,
      is_active: true,
      parent_category_id: null,
      created_at: new Date().toISOString()
    },
    {
      category_id: 2,
      category_name: 'Android Ringtones',
      category_slug: 'android',
      description: 'Ringtones for Android',
      icon_emoji: '🤖',
      display_order: 2,
      is_active: true,
      parent_category_id: null,
      created_at: new Date().toISOString()
    },
    {
      category_id: 3,
      category_name: 'SMS & Message Tones',
      category_slug: 'sms',
      description: 'SMS and message tones',
      icon_emoji: '💬',
      display_order: 3,
      is_active: true,
      parent_category_id: null,
      created_at: new Date().toISOString()
    },
    {
      category_id: 4,
      category_name: 'Alarms',
      category_slug: 'alarm',
      description: 'Alarm sounds',
      icon_emoji: '⏰',
      display_order: 4,
      is_active: true,
      parent_category_id: null,
      created_at: new Date().toISOString()
    },
    {
      category_id: 5,
      category_name: 'Funny',
      category_slug: 'funny',
      description: 'Funny sounds',
      icon_emoji: '😂',
      display_order: 5,
      is_active: true,
      parent_category_id: null,
      created_at: new Date().toISOString()
    },
    {
      category_id: 6,
      category_name: 'Gaming FX',
      category_slug: 'gaming',
      description: 'Gaming sound effects',
      icon_emoji: '🎮',
      display_order: 6,
      is_active: true,
      parent_category_id: null,
      created_at: new Date().toISOString()
    }
  ]
}

export function getMockTrendingRingtones(limit = 20) {
  const baseRingtones = [
    {
      ringtone_id: 1,
      title: "iPhone 15 Trap Remix",
      slug: 'iphone-15-trap-remix',
      artist: "Phonezoo Original",
      description: "Latest iPhone 15 inspired trap beat perfect for ringtones",
      duration_seconds: 29,
      file_size_kb: 1024,
      download_count: 0,
      play_count: 250000,
      like_count: 8500,
      view_count: 500000,
      rating_avg: 4.8,
      rating_count: 1200,
      is_featured: true,
      category_id: 1,
      r2_original_key: 'ringtones/original/iphone-15-trap-remix.mp3'
    },
    {
      ringtone_id: 2,
      title: "Samsung Horizon",
      slug: 'samsung-horizon',
      artist: "Tech Sounds",
      description: "Smooth horizon sound perfect for Android notifications",
      duration_seconds: 4,
      file_size_kb: 256,
      download_count: 0,
      play_count: 180000,
      like_count: 6200,
      view_count: 360000,
      rating_avg: 4.6,
      rating_count: 950,
      is_featured: false,
      category_id: 2,
      r2_original_key: 'ringtones/original/samsung-horizon.mp3'
    },
    {
      ringtone_id: 3,
      title: "Notification Pop",
      slug: 'notification-pop',
      artist: "System Sounds",
      description: "Clean notification sound for messages and alerts",
      duration_seconds: 2,
      file_size_kb: 128,
      download_count: 0,
      play_count: 140000,
      like_count: 4800,
      view_count: 280000,
      rating_avg: 4.4,
      rating_count: 780,
      is_featured: false,
      category_id: 3,
      r2_original_key: 'ringtones/original/notification-pop.mp3'
    },
    {
      ringtone_id: 4,
      title: "Marimba Classic",
      slug: 'marimba-classic',
      artist: "Apple Original",
      description: "Classic marimba tone perfect for iPhone alerts",
      duration_seconds: 6,
      file_size_kb: 384,
      download_count: 0,
      play_count: 320000,
      like_count: 12400,
      view_count: 680000,
      rating_avg: 4.9,
      rating_count: 2100,
      is_featured: true,
      category_id: 1,
      r2_original_key: 'ringtones/original/marimba-classic.mp3'
    },
    {
      ringtone_id: 5,
      title: "Ocean Waves",
      slug: 'ocean-waves',
      artist: "Nature Sounds",
      description: "Relaxing ocean waves for meditation and sleep",
      duration_seconds: 45,
      file_size_kb: 2880,
      download_count: 0,
      play_count: 165000,
      like_count: 7200,
      view_count: 320000,
      rating_avg: 4.7,
      rating_count: 1100,
      is_featured: false,
      category_id: 4,
      r2_original_key: 'ringtones/original/ocean-waves.mp3'
    },
    {
      ringtone_id: 6,
      title: "Electric Pulse",
      slug: 'electric-pulse',
      artist: "Synth Masters",
      description: "Futuristic electric pulse for modern notifications",
      duration_seconds: 8,
      file_size_kb: 512,
      download_count: 0,
      play_count: 120000,
      like_count: 3800,
      view_count: 240000,
      rating_avg: 4.3,
      rating_count: 650,
      is_featured: false,
      category_id: 5,
      r2_original_key: 'ringtones/original/electric-pulse.mp3'
    },
    {
      ringtone_id: 7,
      title: "Jazz Piano",
      slug: 'jazz-piano',
      artist: "Smooth Jazz",
      description: "Smooth jazz piano melody for elegant notifications",
      duration_seconds: 22,
      file_size_kb: 1408,
      download_count: 0,
      play_count: 98000,
      like_count: 2900,
      view_count: 180000,
      rating_avg: 4.5,
      rating_count: 480,
      is_featured: false,
      category_id: 6,
      r2_original_key: 'ringtones/original/jazz-piano.mp3'
    },
    {
      ringtone_id: 8,
      title: "Game Over",
      slug: 'game-over',
      artist: "Retro Gaming",
      description: "Classic game over sound from 80s arcade games",
      duration_seconds: 3,
      file_size_kb: 192,
      download_count: 0,
      play_count: 170000,
      like_count: 5800,
      view_count: 340000,
      rating_avg: 4.2,
      rating_count: 890,
      is_featured: false,
      category_id: 7,
      r2_original_key: 'ringtones/original/game-over.mp3'
    },
    {
      ringtone_id: 9,
      title: "Birds Chirping",
      slug: 'birds-chirping',
      artist: "Morning Nature",
      description: "Beautiful morning birds chirping sound",
      duration_seconds: 38,
      file_size_kb: 2432,
      download_count: 0,
      play_count: 145000,
      like_count: 5100,
      view_count: 290000,
      rating_avg: 4.6,
      rating_count: 720,
      is_featured: false,
      category_id: 4,
      r2_original_key: 'ringtones/original/birds-chirping.mp3'
    },
    {
      ringtone_id: 10,
      title: "Digital Beep",
      slug: 'digital-beep',
      artist: "Tech Tones",
      description: "Clean digital beep for modern applications",
      duration_seconds: 1,
      file_size_kb: 64,
      download_count: 0,
      play_count: 280000,
      like_count: 9600,
      view_count: 560000,
      rating_avg: 4.1,
      rating_count: 1450,
      is_featured: true,
      category_id: 2,
      r2_original_key: 'ringtones/original/digital-beep.mp3'
    },
    {
      ringtone_id: 11,
      title: "Guitar Riff",
      slug: 'guitar-riff',
      artist: "Rock Legends",
      description: "Classic electric guitar riff for rock fans",
      duration_seconds: 15,
      file_size_kb: 960,
      download_count: 0,
      play_count: 115000,
      like_count: 3400,
      view_count: 220000,
      rating_avg: 4.4,
      rating_count: 580,
      is_featured: false,
      category_id: 8,
      r2_original_key: 'ringtones/original/guitar-riff.mp3'
    },
    {
      ringtone_id: 12,
      title: "Bells Chime",
      slug: 'bells-chime',
      artist: "Holiday Sounds",
      description: "Beautiful bells chiming for festive occasions",
      duration_seconds: 12,
      file_size_kb: 768,
      download_count: 0,
      play_count: 132000,
      like_count: 4200,
      view_count: 260000,
      rating_avg: 4.5,
      rating_count: 640,
      is_featured: false,
      category_id: 9,
      r2_original_key: 'ringtones/original/bells-chime.mp3'
    },
    {
      ringtone_id: 13,
      title: "Drum Roll",
      slug: 'drum-roll',
      artist: "Percussion Pro",
      description: "Dramatic drum roll for important notifications",
      duration_seconds: 5,
      file_size_kb: 320,
      download_count: 0,
      play_count: 108000,
      like_count: 3100,
      view_count: 200000,
      rating_avg: 4.3,
      rating_count: 520,
      is_featured: false,
      category_id: 10,
      r2_original_key: 'ringtones/original/drum-roll.mp3'
    },
    {
      ringtone_id: 14,
      title: "Wind Chimes",
      slug: 'wind-chimes',
      artist: "Zen Sounds",
      description: "Peaceful wind chimes for relaxation",
      duration_seconds: 28,
      file_size_kb: 1792,
      download_count: 0,
      play_count: 121000,
      like_count: 3900,
      view_count: 230000,
      rating_avg: 4.7,
      rating_count: 690,
      is_featured: false,
      category_id: 4,
      r2_original_key: 'ringtones/original/wind-chimes.mp3'
    },
    {
      ringtone_id: 15,
      title: "Laser Sound",
      slug: 'laser-sound',
      artist: "Sci-Fi FX",
      description: "Futuristic laser sound effect",
      duration_seconds: 2,
      file_size_kb: 128,
      download_count: 0,
      play_count: 155000,
      like_count: 5200,
      view_count: 310000,
      rating_avg: 4.2,
      rating_count: 780,
      is_featured: false,
      category_id: 11,
      r2_original_key: 'ringtones/original/laser-sound.mp3'
    },
    {
      ringtone_id: 16,
      title: "Piano Melody",
      slug: 'piano-melody',
      artist: "Classical Music",
      description: "Beautiful piano melody for elegant notifications",
      duration_seconds: 18,
      file_size_kb: 1152,
      download_count: 0,
      play_count: 91000,
      like_count: 2600,
      view_count: 170000,
      rating_avg: 4.6,
      rating_count: 430,
      is_featured: false,
      category_id: 12,
      r2_original_key: 'ringtones/original/piano-melody.mp3'
    },
    {
      ringtone_id: 17,
      title: "Thunder Clap",
      slug: 'thunder-clap',
      artist: "Weather FX",
      description: "Powerful thunder clap sound effect",
      duration_seconds: 3,
      file_size_kb: 192,
      download_count: 0,
      play_count: 142000,
      like_count: 4800,
      view_count: 280000,
      rating_avg: 4.4,
      rating_count: 610,
      is_featured: false,
      category_id: 13,
      r2_original_key: 'ringtones/original/thunder-clap.mp3'
    },
    {
      ringtone_id: 18,
      title: "Flute Tune",
      slug: 'flute-tune',
      artist: "World Music",
      description: "Traditional flute melody from Asian music",
      duration_seconds: 25,
      file_size_kb: 1600,
      download_count: 0,
      play_count: 78000,
      like_count: 2100,
      view_count: 140000,
      rating_avg: 4.5,
      rating_count: 360,
      is_featured: false,
      category_id: 14,
      r2_original_key: 'ringtones/original/flute-tune.mp3'
    },
    {
      ringtone_id: 19,
      title: "Robot Voice",
      slug: 'robot-voice',
      artist: "AI Sounds",
      description: "Computer generated robot voice effect",
      duration_seconds: 7,
      file_size_kb: 448,
      download_count: 0,
      play_count: 164000,
      like_count: 6100,
      view_count: 320000,
      rating_avg: 4.1,
      rating_count: 920,
      is_featured: false,
      category_id: 15,
      r2_original_key: 'ringtones/original/robot-voice.mp3'
    },
    {
      ringtone_id: 20,
      title: "Triumph Fanfare",
      slug: 'triumph-fanfare',
      artist: "Orchestral",
      description: "Victory fanfare for achievements and wins",
      duration_seconds: 9,
      file_size_kb: 576,
      download_count: 0,
      play_count: 178000,
      like_count: 7300,
      view_count: 350000,
      rating_avg: 4.8,
      rating_count: 1100,
      is_featured: true,
      category_id: 16,
      r2_original_key: 'ringtones/original/triumph-fanfare.mp3'
    }
  ];

  // If we need more items than available, repeat with different rankings
  const result = [];
  const baseLength = baseRingtones.length;

  for (let i = 0; i < limit; i++) {
    const baseIndex = i % baseLength;
    const baseItem = baseRingtones[baseIndex];

    // Create variation with different stats for repeated items
    const variation = {
      ...baseItem,
      ringtone_id: i + 1,
      download_count: Math.floor(baseItem.download_count * (0.5 + Math.random() * 0.5)),
      play_count: Math.floor(baseItem.play_count * (0.5 + Math.random() * 0.5)),
      like_count: Math.floor(baseItem.like_count * (0.5 + Math.random() * 0.5)),
      view_count: Math.floor(baseItem.view_count * (0.5 + Math.random() * 0.5)),
    };

    result.push(variation);
  }

  return result;
}
