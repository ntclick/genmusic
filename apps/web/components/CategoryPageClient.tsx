'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { audioPlayer } from '@/lib/audio'
import { getAudioUrl, getCategories, Ringtone, Category } from '@/lib/database'
import { useAudio } from '@/contexts/AudioContext'

import { RingtoneListItem } from './RingtoneListItem'
import { Filter, Play, Pause, Download } from 'lucide-react' // ✅ NEW: Import Lucide React components

// Removed local Ringtone interface

interface PaginatedApiResponse {
  ringtones: Ringtone[];
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// SEO-rich category descriptions for Google AdSense quality
const categoryContent: Record<string, { heading: string; description: string; tips: string }> = {
  trending: {
    heading: 'Trending Ringtones',
    description: 'Discover the most popular ringtones right now. Our trending collection is updated daily based on download counts, user ratings, and community favorites. From viral sounds to chart-topping hits remixed as ringtones, this is where you find what everyone is listening to.',
    tips: 'Tip: Trending ringtones change frequently. Bookmark this page and check back often for new additions. You can preview any ringtone before downloading by clicking the play button.',
  },
  iphone: {
    heading: 'iPhone Ringtones (M4R)',
    description: 'Premium ringtones optimized for Apple devices. Every tone in this collection is available in M4R format — the native ringtone format for iPhone and iPad. Download directly and set your new ringtone through Settings > Sounds & Haptics, or use GarageBand to import custom tones.',
    tips: 'Tip: To set an M4R ringtone on iPhone, download the file, open it with GarageBand, tap Share, and select "Ringtone." On Mac, drag the M4R file into the Tones section in Finder while your iPhone is connected.',
  },
  android: {
    heading: 'Android Ringtones (MP3)',
    description: 'Free ringtones compatible with all Android devices including Samsung Galaxy, Google Pixel, OnePlus, Xiaomi, and more. Every ringtone is available in high-quality MP3 format that works with any Android phone. Simply download and set through your phone settings.',
    tips: 'Tip: After downloading, go to Settings > Sound & Vibration > Phone Ringtone > Add Ringtone on most Android phones. Alternatively, move the MP3 file to the Ringtones folder using a file manager app.',
  },
  sms: {
    heading: 'SMS & Notification Tones',
    description: 'Short, distinctive notification sounds perfect for text messages, app alerts, and email notifications. These tones are carefully curated to be attention-grabbing without being disruptive — ideal for everyday use in work and social settings.',
    tips: 'Tip: Notification tones work best when they are short (1-3 seconds) and have a clear, distinct sound. On Android, set them through Settings > Notifications. On iPhone, assign custom text tones per contact in Contacts > Edit > Text Tone.',
  },
  alarm: {
    heading: 'Alarm & Wake-Up Tones',
    description: 'Energizing alarm sounds designed to help you start your day. Choose from gentle morning melodies that ease you awake, to powerful alarm tones that make sure you never oversleep. All tones are tested for clarity and volume to work reliably as wake-up alarms.',
    tips: 'Tip: Choose an alarm tone that gradually increases in volume for a less jarring wake-up experience. On both iPhone and Android, you can set downloaded tones as alarm sounds through the Clock app.',
  },
  funny: {
    heading: 'Funny Ringtones & Sound Effects',
    description: 'Make your phone stand out with hilarious ringtones and comic sound effects. From classic comedy clips and meme-inspired sounds to animal noises and cartoon effects — these tones are guaranteed to get a reaction every time your phone rings.',
    tips: 'Tip: Funny ringtones are great conversation starters. Set different funny tones for different contacts so you know who is calling before you even look at your phone.',
  },
  game: {
    heading: 'Gaming Sound Effects',
    description: 'Level up your phone with ringtones inspired by video games. This collection features victory fanfares, power-up sounds, 8-bit melodies, and epic gaming themes. Perfect for gamers who want their phone to match their passion.',
    tips: 'Tip: Gaming ringtones work especially well as notification sounds for gaming apps and Discord. Mix and match different game-style tones for different apps to create a fully themed phone experience.',
  },
}

const defaultCategoryContent = {
  heading: 'Ringtones',
  description: 'Browse our collection of high-quality ringtones. Every tone is available for free download in multiple formats including MP3 for Android and M4R for iPhone. Preview any ringtone before downloading.',
  tips: 'Tip: Use the category sidebar to filter ringtones by type. Click play to preview, then download in your preferred format.',
}

interface CategoryPageClientProps {
  categoryType?: string
}

export default function CategoryPageClient({ categoryType = 'trending' }: CategoryPageClientProps) {
  const [ringtones, setRingtones] = useState<Ringtone[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  const [categories, setCategories] = useState<Category[]>([])
  const [tracksWithAudio, setTracksWithAudio] = useState<Set<string>>(new Set()) // Track IDs that have audio

  const categoryIdMap: Record<string, number> = {
    trending: 0, iphone: 1, android: 2, sms: 3, alarm: 4, funny: 5, game: 6, ai: 7, marimba: 8, notifications: 9,
  }
  const categoryId = categoryIdMap[categoryType] ?? 0

  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio()

  const togglePlayback = useCallback(async (trackId: string | number | null, title: string, artist: string, url_mp3: string | null, artwork_url: string | null) => {
    const id = trackId?.toString();
    if (!id) return;

    // If this track is currently playing, just toggle play/pause
    if (currentTrack?.id?.toString() === id) {
      togglePlay();
      return;
    }

    // Get the track to resolve audio URL for
    const trackToResolve = ringtones.find(r => r.ringtone_id.toString() === id) as Ringtone | undefined;
    if (!trackToResolve) {
      console.error('Track not found:', id);
      return;
    }

    // Get audio URL with proper validation
    const audioUrl = await getAudioUrl(trackToResolve, "mp3");

    // Validate URL before playing
    if (!audioUrl || typeof audioUrl !== "string" || !audioUrl.startsWith("http")) {
      console.error("No playable audio URL for track:", trackToResolve);
      return;
    }

    // Play the new track using context
    playTrack({
      id: trackId,
      title,
      artist,
      url_mp3: audioUrl,
      artwork_url
    });

    window.dispatchEvent(new CustomEvent('playerPlayRequest', { detail: { id, title } }));
  }, [ringtones, playTrack, currentTrack, togglePlay]);

  // Check which tracks have audio files available
  useEffect(() => {
    const checkAudioAvailability = async () => {
      if (ringtones.length === 0) return;

      const audioAvailable = new Set<string>();

      // Check a reasonable number of tracks to avoid too many requests
      const tracksToCheck = ringtones.slice(0, Math.min(20, ringtones.length));

      for (const track of tracksToCheck) {
        try {
          const audioUrl = await getAudioUrl(track, 'mp3');
          const hasAudio = audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http");

          if (hasAudio) {
            audioAvailable.add(track.ringtone_id.toString());
          } else {
            console.warn("Track loaded but missing audio file:", track);
          }
        } catch (error) {
          console.error("Error checking audio availability for track:", track, error);
        }
      }

      setTracksWithAudio(audioAvailable);
    };

    checkAudioAvailability();
  }, [ringtones]);

  const fetchRingtones = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/category-ringtones/${categoryId}?page=${pageNum}&limit=10`)
      if (!response.ok) throw new Error('Failed to load ringtones')
      const data: PaginatedApiResponse = await response.json()
      return data
    } catch (err) {
      console.error('Error loading ringtones:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      return { ringtones: [], hasMore: false, totalCount: 0, currentPage: pageNum, totalPages: 0 }
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  const loadRingtones = useCallback(async (pageNum: number, append: boolean = false) => {
    const data = await fetchRingtones(pageNum)
    if (append) setRingtones(prev => [...prev, ...data.ringtones])
    else setRingtones(data.ringtones)
    setHasMore(data.hasMore)
    setPage(pageNum)
  }, [fetchRingtones])

  useEffect(() => { loadRingtones(1, false) }, [categoryId, loadRingtones])

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (error) {
        console.error('Failed to load categories:', error)
        // Categories will remain empty, sidebar will show only trending
      }
    }
    loadCategories()
  }, [])

  // Removed useEffect for lucide.createIcons() as we are now using lucide-react components

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button onClick={() => loadRingtones(1, false)}>Try Again</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-20 bg-bg-panel p-4 rounded-xl border border-white/10">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-primary" /> {/* Replaced i data-lucide="filter" */}
              Filter By
            </h2>
            <div className="space-y-1">
              {/* Dynamic categories */}
              {categories.map((category) => (
                <Link
                  key={category.category_id}
                  href={`/category/${category.category_slug}`}
                  className={`block px-4 py-2 rounded-lg text-sm transition hover:bg-white/5 ${
                    categoryType === category.category_slug
                      ? 'bg-brand-primary/10 border border-brand-primary/20 font-bold text-white'
                      : 'text-brand-text hover:text-white'
                  }`}
                >
                  {category.icon_emoji} {category.category_name}
                  {(category as any).dailyDownloads > 0 && (
                    <span className="ml-2 text-xs bg-brand-primary/20 text-brand-primary px-1 py-0.5 rounded">
                      {(category as any).dailyDownloads}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {/* Category header with SEO-rich description */}
          {(() => {
            const content = categoryContent[categoryType] || defaultCategoryContent
            return (
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">{content.heading}</h1>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">{content.description}</p>
                <p className="text-xs text-brand-muted/70 italic">{content.tips}</p>
              </div>
            )
          })()}

          <div className="flex flex-col gap-3" id="track-list-container">
            {ringtones.map((ringtone, index) => (
              <RingtoneListItem
                key={ringtone.ringtone_id.toString() || index}
                ringtone={ringtone}
                rank={index + 1}
                isPlaying={currentTrack?.id?.toString() === ringtone.ringtone_id.toString() && isPlaying}
                hasAudioFile={tracksWithAudio.has(ringtone.ringtone_id.toString())}
                onPlay={(trackId, title, artist, url_mp3, artwork_url) => togglePlayback(trackId, title, artist, url_mp3, artwork_url)}
                onDownload={() => {}}
                onLike={() => {}}
              />
            ))}
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex items-center space-x-4 p-4 bg-bg-panel border border-bg-border rounded-xl animate-pulse">
                <div className="w-10 h-10 flex-shrink-0 bg-gray-700 rounded-full"></div>
                <div className="flex-grow space-y-2"><div className="h-4 bg-gray-700 rounded w-3/4"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></div>
                <div className="h-3 w-10 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>

          {hasMore && !loading && <div className="mt-8 flex justify-center"><button onClick={() => loadRingtones(page + 1, true)} id="load-more-btn" className="px-6 py-3 rounded-xl bg-brand-card border border-white/10 text-brand-muted hover:text-white text-sm font-bold transition">Load More</button></div>}
        </main>
      </div>

    </div>
  )
}
