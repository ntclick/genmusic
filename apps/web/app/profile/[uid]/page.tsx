import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getUserPublicProfile, getUserPublicTracks } from '@/lib/music-storage'
import MusicTrackCard from '@/components/MusicTrackCard'
import { Music2 } from 'lucide-react'

interface PageProps {
  params: { uid: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const profile = await getUserPublicProfile(params.uid)
  if (!profile) return { title: 'User Not Found' }

  return {
    title: `${profile.name} — AI Music on Phonezoo`,
    description: `Listen to AI-generated music tracks created by ${profile.name} on Phonezoo.`,
    openGraph: {
      title: `${profile.name} on Phonezoo`,
      description: `AI-generated music by ${profile.name}.`,
      ...(profile.avatar_url ? { images: [{ url: profile.avatar_url, width: 256, height: 256 }] } : {}),
    },
    alternates: {
      canonical: `https://phonezoo.com/profile/${params.uid}`,
    },
  }
}

export const revalidate = 60

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const profile = await getUserPublicProfile(params.uid)
  if (!profile) notFound()

  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const limit = 24
  const offset = (page - 1) * limit

  const { data: tracks, count } = await getUserPublicTracks(params.uid, { limit, offset })
  const totalPages = Math.ceil(count / limit)

  const avatarSrc = profile.avatar_url
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.uid)}`

  return (
    <div className="min-h-screen text-white pb-20">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-16">

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-10">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-gray-800 flex-shrink-0 bg-gray-800">
            <Image
              src={avatarSrc}
              alt={profile.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{profile.name}</h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
              <Music2 size={14} className="text-brand-orange" />
              {count} public track{count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Track grid */}
        {tracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {tracks.map(track => (
              <MusicTrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <Music2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No public tracks yet.</p>
            <Link href="/music" className="mt-4 inline-block text-brand-orange hover:underline text-sm">
              Create music
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <Link href={`/profile/${params.uid}?page=${page - 1}`}
                className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition">
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-gray-400">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={`/profile/${params.uid}?page=${page + 1}`}
                className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition">
                Next
              </Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center border-t border-gray-800 pt-8">
          <p className="text-gray-400 text-sm mb-3">Want to create your own AI music?</p>
          <Link href="/music"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-brand-orangeHover text-white rounded-xl font-semibold transition shadow-lg shadow-orange-500/20 text-sm">
            Start Creating
          </Link>
        </div>
      </main>
    </div>
  )
}
