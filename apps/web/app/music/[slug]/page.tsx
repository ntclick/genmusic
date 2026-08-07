import type { Metadata } from 'next'
import { getPublicGenerationBySlug, getPublicGenerationById, getCreatorInfo } from '@/lib/music-storage'
import { getGenreContent } from '@/lib/music-genre-content'
import { formatIsoDuration } from '@/lib/music-utils'
import MusicTrackDetailClientWrapper from '@/components/MusicTrackDetailClientWrapper'
import type { MusicGeneration } from '@/types/music'

interface PageProps {
  params: { slug: string }
}

async function getTrack(slug: string): Promise<MusicGeneration | null> {
  const bySlug = await getPublicGenerationBySlug(slug).catch(() => null)
  if (bySlug) return bySlug

  const byId = await getPublicGenerationById(slug).catch(() => null)
  if (byId) return byId

  return null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const track = await getTrack(params.slug)
  if (!track) return { title: 'AI Generated Music Track' }

  const title = track.meta_title || track.title || 'AI Generated Music'
  const description = track.meta_description || track.description || `AI-generated ${track.genre} music track. Listen and download for free on Phonezoo.`
  const url = `https://phonezoo.com/music/${track.slug || track.id}`

  return {
    title,
    description,
    keywords: [`ai ${track.genre} music`, 'ai generated music', `${track.genre} beat`, 'ai composer', 'free music'],
    openGraph: {
      title,
      description,
      type: 'music.song',
      url,
      siteName: 'Phonezoo',
      ...(track.artwork_url ? { images: [{ url: track.artwork_url, width: 480, height: 480, alt: title }] } : {}),
      ...(track.audio_url ? { audio: [{ url: track.audio_url, type: 'audio/mpeg' }] } : {}),
    },
    twitter: {
      card: track.artwork_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(track.artwork_url ? { images: [track.artwork_url] } : {}),
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function MusicTrackPage({ params }: PageProps) {
  const track = await getTrack(params.slug)

  return (
    <MusicTrackDetailClientWrapper
      initialTrack={track}
      slug={params.slug}
    />
  )
}
