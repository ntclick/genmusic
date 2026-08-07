import { MetadataRoute } from 'next'
import { getPublicGenerationSlugs } from '@/lib/music-storage'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://phonezoo.com'

  const blogPosts = [
    { slug: 'how-to-set-custom-ringtone-iphone', date: '2025-01-15' },
    { slug: 'how-to-set-ringtone-android', date: '2025-01-28' },
    { slug: 'ringtone-formats-explained-mp3-m4r-wav-flac', date: '2025-02-10' },
    { slug: 'best-free-ringtones-2025', date: '2025-02-25' },
    { slug: 'how-to-make-ringtone-from-any-song', date: '2025-03-08' },
  ]

  const categories = ['trending', 'iphone', 'android', 'sms', 'alarm', 'funny', 'game']

  // Fetch dynamic music track slugs
  let musicTracks: Array<{ slug: string; updated_at: string }> = []
  try {
    musicTracks = await getPublicGenerationSlugs()
  } catch (err) {
    console.error('[sitemap] Failed to fetch music tracks:', err)
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/maker`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Music pages
    {
      url: `${baseUrl}/music`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/music/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/music/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...blogPosts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...categories.map(cat => ({
      url: `${baseUrl}/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // Dynamic music tracks
    ...musicTracks.map(track => ({
      url: `${baseUrl}/music/${track.slug}`,
      lastModified: new Date(track.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]
}
