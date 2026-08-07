'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/supabase'
import { X, Facebook, Twitter, Linkedin, MessageCircle, Music, Share2 } from 'lucide-react'
import { getAudioUrl, getNewRingtones, getMockTrendingRingtones } from '@/lib/database'
import { useAudio } from '@/contexts/AudioContext'
import { RingtoneListItem } from './RingtoneListItem'

type Ringtone = Database['public']['Tables']['ringtones']['Row']

interface Props {
  ringtones?: Ringtone[]
}

// Mock data fallback
const mockTracks: Ringtone[] = [
  {
    ringtone_id: 1,
    title: "iPhone 15 Trap Remix",
    slug: 'iphone-15-trap-remix',
    artist: "Phonezoo Original",
    description: "Latest iPhone 15 inspired trap beat",
    duration_seconds: 29,
    file_size_kb: 1024,
    file_url_mp3: null,
    file_url_m4r: null,
    file_url_wav: null,
    file_url_flac: null,
    artwork_url: null,
    waveform_data: null,
    category_id: 1,
    uploaded_by: null,
    upload_source: 'user_upload',
    play_count: 250000,
    download_count: 125000,
    like_count: 8500,
    view_count: 500000,
    rating_avg: 4.8,
    rating_count: 1200,
    is_featured: true,
    is_trending: true,
    is_active: true,
    moderation_status: 'approved',
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    published_at: null,
    r2_bucket_name: 'phonezoo',
    r2_original_key: 'ringtones/original/iphone-15-trap-remix.mp3',
    r2_processed_keys: null,
    file_checksums: null,
    total_storage_kb: 1024,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    ringtone_id: 2,
    title: "Samsung Horizon",
    slug: 'samsung-horizon',
    artist: "Tech Sounds",
    description: "Smooth horizon sound for Android",
    duration_seconds: 4,
    file_size_kb: 256,
    file_url_mp3: null,
    file_url_m4r: null,
    file_url_wav: null,
    file_url_flac: null,
    artwork_url: null,
    waveform_data: null,
    category_id: 2,
    uploaded_by: null,
    upload_source: 'user_upload',
    play_count: 180000,
    download_count: 98000,
    like_count: 6200,
    view_count: 360000,
    rating_avg: 4.6,
    rating_count: 950,
    is_featured: false,
    is_trending: true,
    is_active: true,
    moderation_status: 'approved',
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    published_at: null,
    r2_bucket_name: 'phonezoo',
    r2_original_key: 'ringtones/original/samsung-horizon.mp3',
    r2_processed_keys: null,
    file_checksums: null,
    total_storage_kb: 256,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    ringtone_id: 3,
    title: "Morning Birds Soft",
    slug: 'morning-birds-soft',
    artist: "Nature",
    description: "Relaxing morning birds sounds",
    duration_seconds: 45,
    file_size_kb: 512,
    file_url_mp3: null,
    file_url_m4r: null,
    file_url_wav: null,
    file_url_flac: null,
    artwork_url: null,
    waveform_data: null,
    category_id: 4,
    uploaded_by: null,
    upload_source: 'user_upload',
    play_count: 150000,
    download_count: 75000,
    like_count: 5200,
    view_count: 300000,
    rating_avg: 4.7,
    rating_count: 680,
    is_featured: false,
    is_trending: true,
    is_active: true,
    moderation_status: 'approved',
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    published_at: null,
    r2_bucket_name: 'phonezoo',
    r2_original_key: 'ringtones/original/morning-birds-soft.mp3',
    r2_processed_keys: null,
    file_checksums: null,
    total_storage_kb: 512,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Helper function to format download count
const formatDownloadCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else {
    return count.toString();
  }
};

export default function TrendingFeed({ ringtones }: Props) {
  // Optimized: Load only 10 items initially for speed
  const initialTracks = ringtones && ringtones.length > 0 ? ringtones : getMockTrendingRingtones(10);
  // console.log(`🎵 TrendingFeed initial tracks: ${initialTracks.length} items (optimized)`);

  const [tracks, setTracks] = useState<Ringtone[]>(initialTracks as Ringtone[])
  const [loading, setLoading] = useState(false)
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const [sharePopup, setSharePopup] = useState<{ isOpen: boolean; track: Ringtone | null }>({ isOpen: false, track: null })
  const [displayLimit, setDisplayLimit] = useState(10)
  const [tracksWithAudio, setTracksWithAudio] = useState<Set<number>>(new Set())

  // Clear old caches on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear localStorage cache for trending data to force fresh load
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('trending_'));
      cacheKeys.forEach(key => {
        // console.log('🧹 Clearing old cache:', key);
        localStorage.removeItem(key);
      });

      // Clear preload flag to force re-preloading
      localStorage.removeItem('trending_cache_preloaded');
    }
  }, []);

  // Preload new ringtones on mount
  useEffect(() => {
    const preloadData = async () => {
      await getNewRingtones(10);
    };
    preloadData();
  }, []);

  // Fetch new ringtones on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getNewRingtones(10);
        setTracks(data as Ringtone[]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        const fallbackData = getMockTrendingRingtones(10);
        setTracks(fallbackData as Ringtone[]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Listen for audio state changes (removed - using context now)

  // Check which tracks have audio files available - with early checks to prevent unnecessary getAudioUrl calls
  useEffect(() => {
    const checkAudioAvailability = async () => {
      if (tracks.length === 0) return;

      const tracksToCheck = tracks.slice(0, displayLimit); // Only check visible tracks
      const audioAvailable = new Set<number>();

      for (const track of tracksToCheck) {
        // Early check: if no potential audio source exists, skip getAudioUrl entirely
        const hasFileUrl = track.file_url_mp3 && typeof track.file_url_mp3 === 'string' && track.file_url_mp3.startsWith('http');
        const hasR2Key = track.r2_original_key && typeof track.r2_original_key === 'string';
        const hasProcessedKeys = track.r2_processed_keys && typeof track.r2_processed_keys === 'object';

        if (!hasFileUrl && !hasR2Key && !hasProcessedKeys) {
          // No audio source - skip this track without calling getAudioUrl
          continue;
        }

        try {
          const audioUrl = await getAudioUrl(track, 'mp3');
          const hasAudio = !!(audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http"));

          if (hasAudio) {
            audioAvailable.add(track.ringtone_id);
          }
        } catch (error) {
          // Silently skip tracks that fail - don't spam console
        }
      }

      setTracksWithAudio(audioAvailable);
    };

    checkAudioAvailability();
  }, [tracks, displayLimit]);

  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio()

  const togglePlayback = useCallback(async (trackId: string | number | null, title: string, artist: string, url_mp3: string | null, artwork_url: string | null) => {
    const id = trackId?.toString();
    if (!id) return;

    if (currentTrack?.id?.toString() === id) {
      togglePlay();
      return;
    }

    const trackToResolve = tracks.find(r => r.ringtone_id.toString() === id) as Ringtone | undefined;
    if (!trackToResolve) {
      console.error('Track not found:', id);
      return;
    }

    const audioUrl = await getAudioUrl(trackToResolve, "mp3");

    if (!audioUrl || typeof audioUrl !== "string" || !audioUrl.startsWith("http")) {
      console.error("No playable audio URL for track:", trackToResolve);
      return;
    }

    playTrack({
      id: trackId,
      title,
      artist,
      url_mp3: audioUrl,
      artwork_url
    });

    window.dispatchEvent(new CustomEvent('playerPlayRequest', { detail: { id, title } }));
  }, [tracks, playTrack, currentTrack, togglePlay]);

  const handleDownload = (trackId: string, title: string, track?: Ringtone) => {
    const event = new CustomEvent('downloadRequest', { detail: { trackId, title, track } });
    window.dispatchEvent(event);
  };

  const handleLike = (trackId: string) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const handleShare = (track: Ringtone) => {
    setSharePopup({ isOpen: true, track });
  };

  const closeSharePopup = () => {
    setSharePopup({ isOpen: false, track: null });
  };

  const handleSocialShare = (platform: string) => {
    if (!sharePopup.track) return;

    const identifier = sharePopup.track.slug || sharePopup.track.ringtone_id?.toString();
    if (!identifier) {
      alert('Unable to share this ringtone - missing identifier');
      return;
    }

    const shareUrl = `${window.location.origin}/ringtone/${identifier}`;
    const title = `Check out this ringtone: ${sharePopup.track.title}`;
    const text = `Listen to ${sharePopup.track.title} on Phonezoo!`;

    let shareLink = '';

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'threads':
        shareLink = `https://threads.net/intent/post?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert('Link copied to clipboard!');
        });
        closeSharePopup();
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      closeSharePopup();
    }
  };

  return (
    <section id="trending" className="py-8 bg-brand-card/50 border-y border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              🔥 Top Ringtones Download
            </h2>
            <p className="text-xs text-brand-muted">
              Latest ringtones uploaded to Phonezoo
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-brand-muted">Loading trending ringtones...</div>
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-brand-muted">No ringtones found for this time period</div>
            </div>
          ) : (
            tracks.slice(0, displayLimit).map((track, index) => (
              <RingtoneListItem
                key={track.ringtone_id.toString() || index}
                ringtone={track}
                rank={index + 1}
                isPlaying={currentTrack?.id?.toString() === track.ringtone_id.toString() && isPlaying}
                hasAudioFile={tracksWithAudio.has(track.ringtone_id)}
                onPlay={(trackId, title, artist, url_mp3, artwork_url) => togglePlayback(trackId, title, artist, url_mp3, artwork_url)}
                onDownload={(ringtoneId, title) => handleDownload(ringtoneId, title, track)}
                onLike={(ringtoneId) => handleLike(ringtoneId)}
              />
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/category/trending" 
            className="inline-block bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold py-3 px-10 rounded-full transition active:scale-95"
          >
            Load More →
          </Link>
          <Link 
            href="/category/trending" 
            className="inline-block bg-brand-card hover:bg-white/5 text-brand-muted hover:text-white text-xs font-bold py-3 px-10 rounded-full border border-white/10 transition active:scale-95"
          >
            Browse Top 100
          </Link>
        </div>
      </div>

      {/* Share Popup */}
      {sharePopup.isOpen && sharePopup.track && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Share Ringtone</h3>
              <button
                onClick={closeSharePopup}
                className="p-2 text-brand-muted hover:text-white rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-xl">
                <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm truncate">{sharePopup.track.title}</h4>
                  <p className="text-xs text-brand-muted truncate">{sharePopup.track.artist}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialShare('facebook')}
                className="flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition active:scale-95"
              >
                <Facebook className="w-5 h-5" />
                <span className="text-sm font-medium">Facebook</span>
              </button>

              <button
                onClick={() => handleSocialShare('twitter')}
                className="flex items-center gap-3 p-3 bg-blue-400 hover:bg-blue-500 text-white rounded-xl transition active:scale-95"
              >
                <Twitter className="w-5 h-5" />
                <span className="text-sm font-medium">Twitter</span>
              </button>

              <button
                onClick={() => handleSocialShare('threads')}
                className="flex items-center gap-3 p-3 bg-black hover:bg-gray-900 text-white rounded-xl transition active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Threads</span>
              </button>

              <button
                onClick={() => handleSocialShare('linkedin')}
                className="flex items-center gap-3 p-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition active:scale-95"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-sm font-medium">LinkedIn</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => handleSocialShare('copy')}
                className="w-full flex items-center justify-center gap-2 p-3 bg-brand-dark hover:bg-white/5 text-brand-muted hover:text-white rounded-xl transition active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
