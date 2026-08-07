import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRingtoneBySlug } from '@/lib/database'
import RingtoneDetailClient from '@/components/RingtoneDetailClient'

interface PageProps {
  params: { slug: string }
}

async function getRingtone(slug: string) {
  const data = await getRingtoneBySlug(slug)
  if (!data) return null

  return {
    raw: data,
    transformed: {
      id: data.ringtone_id?.toString() || '',
      ringtone_id: data.ringtone_id,
      title: data.title,
      artist: data.artist,
      duration: `${Math.floor(data.duration_seconds / 60)}:${(data.duration_seconds % 60).toString().padStart(2, '0')}`,
      downloads: data.download_count?.toString() || '0',
      rating: 4.5,
      description: data.description || 'No description available.',
      tags: [],
      reviews: data.reviews || [],
      slug: data.slug,
      file_url_mp3: data.file_url_mp3,
      r2_original_key: data.r2_original_key,
      r2_processed_keys: data.r2_processed_keys,
      like_count: data.like_count || 0,
      category: data.categories ? {
        name: data.categories.category_name,
        slug: data.categories.category_slug
      } : undefined
    }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getRingtone(params.slug)
  if (!result) return { title: 'Ringtone Not Found | Phonezoo' }

  const { raw } = result
  const title = `${raw.title}${raw.artist ? ` - ${raw.artist}` : ''} | Free Ringtone Download | Phonezoo`
  const description = raw.description
    || `Download "${raw.title}"${raw.artist ? ` by ${raw.artist}` : ''} as a free ringtone for iPhone (M4R) and Android (MP3). No app install needed.`
  const url = `https://phonezoo.com/ringtone/${raw.slug}`

  return {
    title,
    description,
    keywords: [
      raw.title,
      raw.artist,
      'free ringtone',
      'ringtone download',
      'iphone ringtone',
      'android ringtone',
    ].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      type: 'music.song',
      url,
      siteName: 'Phonezoo',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function RingtoneDetailPage({ params }: PageProps) {
  const result = await getRingtone(params.slug)
  if (!result) notFound()

  const { raw, transformed } = result

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: raw.title,
    ...(raw.artist ? { byArtist: { '@type': 'Person', name: raw.artist } } : {}),
    description: raw.description || `Free ringtone: ${raw.title}`,
    duration: `PT${Math.floor(raw.duration_seconds / 60)}M${raw.duration_seconds % 60}S`,
    url: `https://phonezoo.com/ringtone/${raw.slug}`,
    encodingFormat: 'audio/mpeg',
    isAccessibleForFree: true,
    inLanguage: 'en',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RingtoneDetailClient ringtone={transformed as any} />
    </>
  )
}
