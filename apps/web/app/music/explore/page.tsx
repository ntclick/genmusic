import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicGenerations } from '@/lib/music-storage'
import { getGenreContent, GENRE_CONTENT } from '@/lib/music-genre-content'
import MusicTrackCard from '@/components/MusicTrackCard'

export const metadata: Metadata = {
  title: 'AI Generated Music Library - Browse Free Instrumental & Vocal Tracks',
  description: 'Explore our library of AI-generated music tracks. Browse by genre — Pop, Rock, EDM, Hip Hop, Lo-Fi, Jazz, and more. Listen free, download, or create your own.',
  keywords: ['ai music library', 'free ai music', 'ai generated tracks', 'instrumental beats', 'ai composer', 'free music download'],
  openGraph: {
    title: 'AI Music Library | Phonezoo',
    description: 'Browse AI-generated music tracks by genre. Listen, download, or create your own.',
    url: 'https://phonezoo.com/music/explore',
  },
  alternates: {
    canonical: 'https://phonezoo.com/music/explore',
  },
}

export const revalidate = 300 // 5 minutes

const GENRES = [
  { id: 'all', name: 'All Genres', icon: '🎶' },
  ...Object.entries(GENRE_CONTENT).map(([id, g]) => ({ id, name: g.name, icon: g.icon })),
]

interface PageProps {
  searchParams: { genre?: string; page?: string }
}

export default async function MusicExplorePage({ searchParams }: PageProps) {
  const selectedGenre = searchParams.genre && searchParams.genre !== 'all' ? searchParams.genre : undefined
  const page = Math.max(1, parseInt(searchParams.page || '1'))
  const limit = 24
  const offset = (page - 1) * limit

  const { data: tracks, count } = await getPublicGenerations({ genre: selectedGenre, limit, offset })
  const totalPages = Math.ceil(count / limit)
  const genreContent = selectedGenre ? getGenreContent(selectedGenre) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Generated Music Library',
    description: 'Browse and download AI-generated music tracks across multiple genres.',
    url: 'https://phonezoo.com/music/explore',
    isPartOf: { '@type': 'WebSite', name: 'Phonezoo', url: 'https://phonezoo.com' },
    ...(tracks.length > 0 ? {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: count,
        itemListElement: tracks.slice(0, 10).map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'MusicRecording',
            name: t.title || 'AI Track',
            url: `https://phonezoo.com/music/${t.slug || t.id}`,
            genre: t.genre,
          },
        })),
      },
    } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen text-white pb-20">
        <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none" />

        <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black mb-4">
              AI Music <span className="text-brand-orange">Library</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Explore tracks created by our AI music generator. Every track is unique, royalty-context-aware, and available to listen or download.
              Browse by genre or discover something new.
            </p>
          </div>

          {/* Genre filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {GENRES.map(g => {
              const isActive = (g.id === 'all' && !selectedGenre) || g.id === selectedGenre
              return (
                <Link key={g.id}
                  href={g.id === 'all' ? '/music/explore' : `/music/explore?genre=${g.id}`}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition border ${
                    isActive
                      ? 'bg-brand-orange border-brand-orange text-white'
                      : 'bg-[#0f172a] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}>
                  <span>{g.icon}</span> {g.name}
                </Link>
              )
            })}
          </div>

          {/* Genre description (when filtered) */}
          {genreContent && (
            <div className="bg-[#0f172a]/60 border border-gray-800 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-bold mb-2">{genreContent.icon} {genreContent.name} Music</h2>
              <p className="text-gray-300 leading-relaxed text-sm">{genreContent.description}</p>
              <p className="text-gray-400 text-sm mt-2">{genreContent.useCases}</p>
            </div>
          )}

          {/* Track grid */}
          {tracks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {tracks.map(track => (
                <MusicTrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-4">No tracks found{selectedGenre ? ` in ${genreContent?.name || selectedGenre}` : ''}.</p>
              <Link href="/music" className="text-brand-orange hover:underline">Create the first one!</Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mb-12">
              {page > 1 && (
                <Link href={`/music/explore?${selectedGenre ? `genre=${selectedGenre}&` : ''}page=${page - 1}`}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition">Previous</Link>
              )}
              <span className="px-4 py-2 text-sm text-gray-400">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/music/explore?${selectedGenre ? `genre=${selectedGenre}&` : ''}page=${page + 1}`}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition">Next</Link>
              )}
            </div>
          )}

          {/* Educational content — substantial text for AdSense compliance */}
          <div className="space-y-10 mt-12">
            <section>
              <h2 className="text-2xl font-bold mb-4">How AI Music Generation Works</h2>
              <div className="text-gray-300 leading-relaxed space-y-3">
                <p>
                  AI music generation uses deep learning models trained on millions of musical patterns to compose original audio from text descriptions.
                  When you provide a prompt like &ldquo;chill lo-fi beat with rain sounds&rdquo; or &ldquo;epic orchestral battle theme,&rdquo; the AI analyzes the musical concepts
                  described and generates audio waveforms that match those characteristics — creating entirely new compositions that have never existed before.
                </p>
                <p>
                  The technology behind our generator uses neural audio synthesis, where a transformer-based model predicts audio tokens in sequence,
                  similar to how large language models generate text. Each token represents a small segment of audio, and the model has learned the patterns
                  of rhythm, melody, harmony, and timbre from its training data. The result is music that sounds natural and professionally produced.
                </p>
                <p>
                  For tracks with vocals, an additional AI model generates singing voices that match the lyrics, melody, and genre — creating complete songs
                  with harmonized vocals, backing instruments, and professional mixing. The vocal AI understands phrasing, breathing, and emotional expression
                  to deliver performances that sound genuinely human.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Why Use AI-Generated Music?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Content Creators', desc: 'YouTube videos, TikToks, and Instagram Reels need unique background music. AI-generated tracks are original and avoid copyright strikes.' },
                  { title: 'Podcasters', desc: 'Create custom intro music, transitions, and background beats that perfectly match your podcast\'s tone and brand.' },
                  { title: 'Game Developers', desc: 'Generate ambient music, battle themes, and menu music for games without licensing costs or composer fees.' },
                  { title: 'Personal Use', desc: 'Set unique ringtones, notification sounds, or alarm tones that nobody else has. Express your personality through custom audio.' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0f172a]/50 border border-gray-800 rounded-xl p-5">
                    <h3 className="font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  { q: 'Are AI-generated tracks copyright-free?', a: 'Tracks generated with free and Pro plans are for personal use. Premium subscribers receive a commercial license for all their generated tracks, suitable for monetized content.' },
                  { q: 'Can I edit or remix the tracks?', a: 'Yes! You can download any track and edit it with your preferred audio software. You can also send tracks to our built-in Ringtone Maker to trim them into ringtones.' },
                  { q: 'What audio quality are the tracks?', a: 'All tracks are generated in high quality and available as MP3 files. Pro and Premium users can also download in WAV and FLAC formats for professional use.' },
                  { q: 'How many tracks can I generate?', a: 'Free users get 1 track per day. Registered accounts get 10. Pro ($4.99/mo) gets 50, and Premium ($29.99/mo) gets 200 daily generations plus music with lyrics.' },
                ].map((faq, idx) => (
                  <div key={idx} className="bg-[#0f172a]/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
                    <h3 className="font-semibold text-white mb-1">{faq.q}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="text-center mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-bold mb-3">Ready to Create Your Own?</h2>
            <p className="text-gray-400 mb-6">Describe the music you want and let AI compose it in seconds.</p>
            <Link href="/music"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange hover:bg-brand-orangeHover text-white rounded-xl font-bold text-lg transition shadow-lg shadow-orange-500/20">
              Start Creating Music
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}
