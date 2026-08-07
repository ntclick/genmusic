'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Pause, Music, Download, Heart, Share2, Scissors, ArrowLeft, ChevronRight, Star, DownloadCloud, MessageSquare, User, Zap } from 'lucide-react'
import { audioPlayer } from '@/lib/audio'
import { getAudioUrl, getRelatedRingtones, getTrendingRingtones } from '@/lib/database'
import { useAudio } from '@/contexts/AudioContext'
import { formatCount } from '@/lib/formatNumber'

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

interface Ringtone {
  id: string;
  ringtone_id?: string | number;
  title: string;
  artist: string;
  duration: string;
  downloads: string;
  rating: number;
  description: string;
  tags: string[];
  reviews: Review[];
  slug?: string;
  file_url_mp3?: string | null;
  r2_original_key?: string | null;
  r2_processed_keys?: Record<string, string> | null;
  like_count?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface Props {
  ringtone: Ringtone
}

export default function RingtoneDetailClient({ ringtone }: Props) {
;
  const [userRating, setUserRating] = useState(0)
  const [liked, setLiked] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [reviewAuthor, setReviewAuthor] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviews, setReviews] = useState(ringtone.reviews || [])
  const [isRatingSelected, setIsRatingSelected] = useState(false)
  const [hasAudioFile, setHasAudioFile] = useState<boolean>(true)
  const [availableFormats, setAvailableFormats] = useState<{
    mp3: boolean;
    m4r: boolean;
  }>({ mp3: false, m4r: false })
  const [recommendedTracks, setRecommendedTracks] = useState<any[]>([])
  const [relatedRingtones, setRelatedRingtones] = useState<any[]>([])

  useEffect(() => {
  const handleAudioStateChange = (e: CustomEvent<{ isPlaying: boolean; trackId: string | null }>) => {
    // Audio state is now managed by context
  };

  window.addEventListener('audioStateChange' as any, handleAudioStateChange);
    return () => window.removeEventListener('audioStateChange' as any, handleAudioStateChange);
  }, []);

  // Check if track has audio file available - do early check before calling getAudioUrl
  useEffect(() => {
    const checkAudioAvailability = async () => {
      // Early check: if no potential audio source exists, skip getAudioUrl entirely
      const hasFileUrl = ringtone.file_url_mp3 && typeof ringtone.file_url_mp3 === 'string' && ringtone.file_url_mp3.startsWith('http');
      const hasR2Key = ringtone.r2_original_key && typeof ringtone.r2_original_key === 'string';
      const hasProcessedKeys = ringtone.r2_processed_keys && Object.keys(ringtone.r2_processed_keys).length > 0;

      if (!hasFileUrl && !hasR2Key && !hasProcessedKeys) {
        // No audio source available - don't call getAudioUrl
        setHasAudioFile(false);
        console.warn("Track has no audio source (file_url_mp3, r2_original_key, or r2_processed_keys):", ringtone.title);
        return;
      }

      try {
        const audioUrl = await getAudioUrl(ringtone, 'mp3');
        const hasAudio = !!(audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("http"));
        setHasAudioFile(hasAudio);

        if (!hasAudio) {
          console.warn("Track loaded but getAudioUrl returned no valid URL:", ringtone.title);
        }
      } catch (error) {
        console.error("Error checking audio availability:", error);
        setHasAudioFile(false);
      }
    };

    checkAudioAvailability();
  }, [ringtone]);

  // Check available download formats
  useEffect(() => {
    const checkFormats = () => {
      let hasMp3 = false;
      let hasM4r = false;

      // Check if has MP3 (from file_url_mp3 or r2_original_key)
      if (ringtone.file_url_mp3 && typeof ringtone.file_url_mp3 === 'string' && ringtone.file_url_mp3.startsWith('http')) {
        hasMp3 = true;
      } else if (ringtone.r2_original_key && typeof ringtone.r2_original_key === 'string') {
        hasMp3 = true;
      }

      // Check if has M4R (from r2_processed_keys)
      if (ringtone.r2_processed_keys) {
        try {
          const processedKeys = typeof ringtone.r2_processed_keys === 'string' 
            ? JSON.parse(ringtone.r2_processed_keys) 
            : ringtone.r2_processed_keys;
          
          if (processedKeys.m4r) {
            hasM4r = true;
          }
        } catch (error) {
          console.error('Error parsing r2_processed_keys:', error);
        }
      }

      setAvailableFormats({ mp3: hasMp3, m4r: hasM4r });
    };

    checkFormats();
  }, [ringtone]);

  // Load real data from database
  useEffect(() => {
    const loadRealData = async () => {
      const ringtoneId = (ringtone.ringtone_id || ringtone.id).toString();

      try {
        // Load reviews
        const reviewsResponse = await fetch(`/api/reviews/${ringtoneId}`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
          // console.log(`✅ Loaded ${reviewsData.reviews?.length || 0} reviews for ringtone ${ringtoneId}`);
        } else {
          // console.log(`ℹ️ No reviews found for ringtone ${ringtoneId}`);
          setReviews([]);
        }

        // Check if user has liked this (from localStorage for now)
        const likedTracks = JSON.parse(localStorage.getItem('likedTracks') || '[]');
        setLiked(likedTracks.includes(ringtoneId));
      } catch (error) {
        console.error('Error loading real data:', error);
        // Keep existing data or empty arrays
        setReviews(ringtone.reviews || []);
      }
    };

    loadRealData();
  }, [ringtone]);

  // Load recommended tracks
  useEffect(() => {
    const loadRecommended = async () => {
      try {
        const ringtones = await getTrendingRingtones(3, 'week');
        setRecommendedTracks(ringtones || []);
      } catch (error) {
        console.error('Error loading recommended tracks:', error);
      }
    };
    loadRecommended();
  }, []);

  // Load related ringtones
  useEffect(() => {
    const loadRelated = async () => {
      if (!ringtone.category?.slug) return;
      
      try {
        const ringtoneId = ringtone.ringtone_id || ringtone.id;
        const related = await getRelatedRingtones(ringtone.category.slug, ringtoneId, 8);
        setRelatedRingtones(related);
      } catch (error) {
        console.error('Error loading related ringtones:', error);
      }
    };
    loadRelated();
  }, [ringtone]);

  // Star rating is now handled by React state - no DOM manipulation needed

  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio()

  const handlePlayToggle = async () => {
    // Don't attempt to play if we know there's no audio file
    if (!hasAudioFile) {
      console.warn("Cannot play track - no audio file available:", ringtone.title);
      return;
    }

    // Early check: verify audio source exists before calling getAudioUrl
    const hasFileUrl = ringtone.file_url_mp3 && typeof ringtone.file_url_mp3 === 'string' && ringtone.file_url_mp3.startsWith('http');
    const hasR2Key = ringtone.r2_original_key && typeof ringtone.r2_original_key === 'string';
    const hasProcessedKeys = ringtone.r2_processed_keys && Object.keys(ringtone.r2_processed_keys).length > 0;

    if (!hasFileUrl && !hasR2Key && !hasProcessedKeys) {
      console.warn("Cannot play track - no audio source exists:", ringtone.title);
      setHasAudioFile(false);
      return;
    }

    const trackId = (ringtone.ringtone_id || ringtone.id).toString();

    // If this track is currently playing, just toggle play/pause
    if (currentTrack?.id?.toString() === trackId) {
      togglePlay();
      return;
    }

    // Get audio URL with proper validation
    const audioUrl = await getAudioUrl(ringtone, 'mp3');

    // Validate URL before playing
    if (!audioUrl || typeof audioUrl !== "string" || !audioUrl.startsWith("http")) {
      console.error("No playable audio URL for track:", ringtone.title);
      setHasAudioFile(false); // Mark as having no audio
      return;
    }

    // Play the track
    playTrack({
      id: ringtone.ringtone_id || ringtone.id,
      title: ringtone.title,
      artist: ringtone.artist,
      url_mp3: audioUrl,
      artwork_url: null
    });

    const event = new CustomEvent('playerPlayRequest', { detail: { track: { ringtone_id: trackId, title: ringtone.title, artist: ringtone.artist, slug: ringtone.slug, file_url_mp3: audioUrl } } });
    window.dispatchEvent(event);
  }

  const handleDownloadMP3 = () => {
    const trackId = (ringtone.ringtone_id || ringtone.id).toString();
    const event = new CustomEvent('downloadRequest', {
      detail: {
        trackId,
        title: ringtone.title,
        format: 'mp3_320',
        track: ringtone
      }
    });
    window.dispatchEvent(event);
  };

  const handleDownloadM4R = () => {
    const trackId = (ringtone.ringtone_id || ringtone.id).toString();
    const event = new CustomEvent('downloadRequest', {
      detail: {
        trackId,
        title: ringtone.title,
        format: 'm4r',
        track: ringtone
      }
    });
    window.dispatchEvent(event);
  };

  const handleStarHover = (rating: number) => {
    // Only update on hover if no rating has been selected yet
    if (!isRatingSelected) {
      setUserRating(rating)
    }
  }

  const handleStarLeave = () => {
    // Only reset to default (no stars filled) if no rating has been selected
    if (!isRatingSelected) {
      setUserRating(0) // Reset to show no stars filled
    }
    // If rating was selected, keep the selected rating
  }

  const handleStarClick = (rating: number) => {
    setUserRating(rating)
    setIsRatingSelected(true)
  }

  const handleSubmitReview = async () => {
    if (!reviewAuthor.trim() || !reviewComment.trim() || !isRatingSelected) {
      alert('Please fill in your name, select a rating, and comment');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const ringtoneId = (ringtone.ringtone_id || ringtone.id).toString();

      const response = await fetch(`/api/reviews/${ringtoneId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: userRating,
          comment: reviewComment.trim(),
          author: reviewAuthor.trim()
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Add the new review to the local state
        const newReview = {
          id: result.review.id.toString(),
          author: result.review.author || reviewAuthor,
          rating: result.review.rating || userRating,
          comment: result.review.comment || reviewComment,
          date: new Date(result.review.created_at || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        };

        setReviews(prevReviews => [newReview, ...prevReviews]);

        // Reset form
        setReviewAuthor('');
        setReviewComment('');
        setUserRating(0);
        setIsRatingSelected(false);
      } else {
        // Even if API fails, add review locally for better UX
        const fallbackReview = {
          id: Date.now().toString(),
          author: reviewAuthor,
          rating: userRating,
          comment: reviewComment,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        };

        setReviews(prevReviews => [fallbackReview, ...prevReviews]);

        // Reset form
        setReviewAuthor('');
        setReviewComment('');
        setUserRating(0);
        setIsRatingSelected(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to post review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  }

  const toggleLike = async () => {
    const ringtoneId = (ringtone.ringtone_id || ringtone.id).toString();

    try {
      const response = await fetch(`/api/likes/${ringtoneId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          increment: !liked
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update ringtone like count in UI (optimistic update)
        ringtone.like_count = result.likeCount;
      } else {
      }

      // Always update local state and storage regardless of API success
      setLiked(!liked);

      // Update localStorage
      const likedTracks = JSON.parse(localStorage.getItem('likedTracks') || '[]');
      let newLikedTracks;
      if (!liked) {
        // Adding to liked
        newLikedTracks = [...likedTracks, ringtoneId];
      } else {
        // Removing from liked
        newLikedTracks = likedTracks.filter((id: string) => id !== ringtoneId);
      }
      localStorage.setItem('likedTracks', JSON.stringify(newLikedTracks));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  const handleShare = () => {
    // Use slug if available, otherwise use ringtone_id
    const identifier = ringtone.slug || ringtone.ringtone_id?.toString() || ringtone.id;
    if (!identifier) {
      console.error('No slug or ID available for sharing:', ringtone);
      alert('Unable to share this ringtone - missing identifier');
      return;
    }

    const event = new CustomEvent('shareRequest', {
      detail: {
        track: {
          slug: identifier,
          title: ringtone.title,
          artist: ringtone.artist
        }
      }
    });
    window.dispatchEvent(event);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "MusicRecording",
              "name": ringtone.title,
              "url": `${typeof window !== 'undefined' ? window.location.origin : ''}/ringtone/${ringtone.slug || ringtone.ringtone_id || ringtone.id}`,
              "duration": `PT${Math.floor(parseInt(ringtone.duration.split(':')[0]) || 0)}M${parseInt(ringtone.duration.split(':')[1]) || 29}S`,
              "byArtist": {
                "@type": "MusicGroup",
                "name": ringtone.artist
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": ringtone.rating,
                "reviewCount": ringtone.reviews.length,
                "bestRating": 5
              }
            }
          ])
        }}
      />
      {/* HEADER */}
      <header className="h-14 border-b border-bg-border bg-bg-panel flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-0 md:px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-brand-muted hover:text-white transition active:scale-95">
            <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Back to Feed</span>
          </Link>
          <span className="font-bold text-lg">Phone<span className="text-brand-primary">Zoo</span></span>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 flex-grow">

        {/* Breadcrumb */}
        <nav className="text-xs text-brand-muted mb-6 flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <Link href={`/category/${ringtone.category?.slug || 'unknown'}`} className="hover:text-white transition">{ringtone.category?.name || 'Unknown Category'}</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-brand-primary font-bold truncate">{ringtone.title}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-8 mb-8">

          {/* LEFT COLUMN: Player & Actions */}
          <div className="lg:col-span-8">
            {/* Hero Player Card */}
            <div className="bg-brand-card rounded-2xl border border-white/5 p-5 md:p-8 shadow-2xl relative overflow-hidden">

              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
                {/* Artwork */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                  <div className="relative w-full h-full rounded-full border-4 border-brand-card shadow-2xl bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center z-10">
                    <Music className="w-16 h-16 text-white opacity-80" />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-brand-primary text-white p-2 rounded-full z-20 shadow-lg border-2 border-brand-card">
                    <Music className="w-4 h-4" />
                  </div>
                </div>

                {/* Track Info & Player */}
                <div className="flex-grow w-full text-center md:text-left">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2 leading-tight">{ringtone.title}</h1>

                  {/* Stats & Rating */}
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-6">
                    <div className="flex items-center gap-1 text-xs font-bold text-white bg-white/5 px-2 py-1 rounded-full">
                      <User className="w-3 h-3 text-brand-primary" /> {ringtone.artist}
                    </div>
                    {ringtone.downloads && ringtone.downloads !== '0' && (
                      <div className="flex items-center gap-1 text-xs text-brand-muted">
                        <Download className="w-3 h-3" /> {ringtone.downloads} Downloads
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-yellow-400 font-bold">
                      <Star className="w-3 h-3 fill-current" /> {ringtone.rating}
                    </div>
                  </div>

                  {/* Interactive Visualizer */}
                  <div className="bg-brand-dark/50 rounded-lg p-2 md:p-3 border border-white/5 mb-4">
                    <div className="h-10 md:h-12 flex items-center justify-center gap-[2px] md:gap-1" id="main-waveform" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Waveform bars */}
                      {Array.from({ length: 50 }, (_, i) => {
                        // Random heights like the HTML version
                        const height = Math.max(20, Math.floor(Math.random() * 100));
                        return (
                          <div
                            key={i}
                            className="w-1 bg-slate-700 rounded-full transition-all duration-150"
                            style={{ height: `${height}%` }}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Play/Like CTAs */}
                  <div className="flex flex-col gap-3 justify-center md:justify-start">
                    <button
                      onClick={handlePlayToggle}
                      disabled={hasAudioFile === false}
                      className={`flex-grow md:flex-grow-0 py-3 px-8 rounded-full font-bold transition shadow-lg flex items-center justify-center gap-2 ${
                        !hasAudioFile
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : currentTrack?.id?.toString() === (ringtone.ringtone_id || ringtone.id)?.toString() && isPlaying
                          ? 'bg-brand-primary text-white shadow-orange-500/50 hover:scale-105 active:scale-95'
                          : 'bg-white text-black hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                      {isPlaying ? 'Playing' : !hasAudioFile ? 'No Audio Available' : 'Play Preview'}
                    </button>

                    {!hasAudioFile && (
                      <p className="text-sm text-amber-400 text-center md:text-left">
                        This ringtone has no audio file available.
                      </p>
                    )}
                    
                    <div className="flex gap-3 justify-center md:justify-start">
                      <button
                        onClick={toggleLike}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition ${
                          liked ? 'text-red-400 border-red-400/50' : 'text-brand-muted border-white/10 hover:text-brand-primary'
                        }`}
                        title="Add to Favorites"
                      >
                        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 active:bg-white/10 text-brand-muted hover:text-white transition"
                        title="Share"
                        onClick={handleShare}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Actions (Download Buttons) */}
              <div className="mt-8 pt-8 border-t border-white/5 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(availableFormats.mp3 || availableFormats.m4r) && (
                  <button
                    className="bg-brand-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-500 active:scale-95 transition flex items-center justify-center gap-2"
                    onClick={handleDownloadMP3}
                  >
                    <Download className="w-5 h-5" /> Download Ringtone
                  </button>
                )}
                
                <Link 
                  href={`/maker?source=${ringtone.slug || ringtone.ringtone_id || ringtone.id}`} 
                  className={`bg-white/5 text-white font-bold py-3.5 rounded-xl border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2 active:scale-95 ${
                    !availableFormats.mp3 && !availableFormats.m4r ? 'sm:col-span-2' : ''
                  }`}
                >
                  <Scissors className="w-5 h-5 text-brand-muted" /> Cut / Make Ringtone
                </Link>
              </div>
            </div>

            {/* DESCRIPTION / ABOUT (High SEO Value) */}
            <article className="mt-8 prose prose-invert prose-sm max-w-none text-brand-muted">
              <h2 className="text-white font-bold text-xl mb-4">About this Sound</h2>
              <p className="leading-relaxed">{ringtone.description}</p>

              {ringtone.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {ringtone.tags.map((tag, index) => (
                    <span key={index} className="bg-brand-card hover:bg-brand-primary hover:text-white border border-white/10 px-3 py-1 rounded-full text-xs transition">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Download Guide Section */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-white font-bold text-lg mb-3">How to Download &amp; Set This Ringtone</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-bg-panel border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🍎</span>
                      <h4 className="text-white font-semibold text-sm">iPhone / iOS</h4>
                    </div>
                    <ol className="text-xs space-y-1 list-decimal list-inside">
                      <li>Tap <strong className="text-white">Download Ringtone</strong> and select M4R format</li>
                      <li>Open the file with GarageBand</li>
                      <li>Tap Share &gt; Ringtone &gt; Export</li>
                      <li>Set in Settings &gt; Sounds &amp; Haptics</li>
                    </ol>
                  </div>
                  <div className="bg-bg-panel border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <h4 className="text-white font-semibold text-sm">Android</h4>
                    </div>
                    <ol className="text-xs space-y-1 list-decimal list-inside">
                      <li>Tap <strong className="text-white">Download Ringtone</strong> (MP3 format)</li>
                      <li>Go to Settings &gt; Sound &amp; Vibration</li>
                      <li>Tap Phone Ringtone &gt; Add Ringtone</li>
                      <li>Select the downloaded file</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <h3 className="text-white font-bold text-lg mb-3">Ringtone Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-bg-panel border border-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-brand-muted mb-1">Duration</p>
                    <p className="text-white font-bold text-sm">{ringtone.duration}</p>
                  </div>
                  {ringtone.downloads && ringtone.downloads !== '0' && (
                    <div className="bg-bg-panel border border-white/5 rounded-lg p-3 text-center">
                      <p className="text-xs text-brand-muted mb-1">Downloads</p>
                      <p className="text-white font-bold text-sm">{ringtone.downloads}</p>
                    </div>
                  )}
                  <div className="bg-bg-panel border border-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-brand-muted mb-1">Rating</p>
                    <p className="text-white font-bold text-sm">{ringtone.rating} / 5</p>
                  </div>
                  <div className="bg-bg-panel border border-white/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-brand-muted mb-1">Category</p>
                    <p className="text-white font-bold text-sm">{ringtone.category?.name || 'General'}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed">
                  This ringtone is available for free download in multiple formats. For the best quality on iPhone,
                  download the M4R version. For Android devices, the MP3 format works with all manufacturers including
                  Samsung, Google Pixel, OnePlus, and Xiaomi. You can also use our{' '}
                  <Link href="/maker" className="text-brand-primary hover:underline">Ringtone Maker</Link>{' '}
                  to customize the length and create a perfectly trimmed clip from this sound.
                </p>
              </div>
            </article>
          </div>

          {/* RIGHT COLUMN: Recommended & Reviews */}
          <div className="lg:col-span-4">

            {/* Recommended Section */}
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 pt-4 lg:pt-0">
              <Zap className="w-4 h-4 text-brand-primary" /> Recommended for You
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll mb-8">
              {/* Recommended tracks */}
              {recommendedTracks.length > 0 ? (
                recommendedTracks.map((track) => (
                  <Link key={track.slug || track.ringtone_id} href={`/ringtone/${track.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-brand-card border border-white/5 hover:border-brand-primary/50 hover:bg-white/5 active:scale-95 transition group">
                    <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center text-brand-primary group-hover:text-white group-hover:bg-brand-primary transition shadow-inner">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-brand-primary transition">{track.title}</h4>
                      <p className="text-xs text-brand-muted">{track.artist}{track.download_count > 0 ? ` • ${formatCount(track.download_count)} DLs` : ''}</p>
                    </div>
                    <button className="p-2 text-brand-muted hover:text-white">
                      <Play className="w-5 h-5" />
                    </button>
                  </Link>
                ))
              ) : (
                <div className="text-center py-4 text-brand-muted text-sm">Loading recommendations...</div>
              )}

              <Link href="/category" className="block mt-4 text-center text-xs font-bold text-brand-primary hover:text-white transition py-3 border border-brand-primary/30 rounded-lg hover:bg-brand-primary/10 active:scale-95">
                View More Ringtones
              </Link>
            </div>

            {/* WRITE REVIEW SECTION */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <h3 className="font-bold text-white mb-4">Write a Review</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReview();
                }}
                className="bg-brand-card p-4 rounded-xl border border-white/5 shadow-lg md:sticky md:top-24"
              >
                {/* Name Input */}
                <input
                  type="text"
                  placeholder="Your name..."
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white mb-3 focus:border-brand-primary focus:outline-none transition"
                  required
                />

                {/* Star Rating */}
                <div className="flex gap-1 mb-3 text-yellow-400 text-2xl cursor-pointer star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 hover:text-yellow-400 transition cursor-pointer ${
                        star <= userRating ? 'fill-current text-yellow-400' : 'opacity-70 text-yellow-400'
                      }`}
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={handleStarLeave}
                      onClick={() => handleStarClick(star)}
                    />
                  ))}
                </div>

                {/* Comment Textarea */}
                <textarea
                  placeholder="Your review..."
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => {
                    setReviewComment(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    // Allow Ctrl+Enter or Cmd+Enter to submit
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitReview();
                    }
                  }}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white mb-3 focus:border-brand-primary focus:outline-none resize-none transition"
                  required
                ></textarea>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-gray-500 active:scale-95 text-white text-xs font-bold py-3 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* COMMUNITY REVIEWS (Moved to Bottom) */}
        <section className="mt-16 pt-8 border-t border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-primary" />
              Community Reviews <span className="text-xs text-brand-muted font-normal">({reviews.length})</span>
            </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {(showAllReviews ? reviews : reviews.slice(0, 2)).map((review) => (
              <div key={review.id} className="bg-brand-card p-4 rounded-xl border border-white/5" itemProp="review" itemScope itemType="https://schema.org/Review">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                      {review.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block" itemProp="author">{review.author}</span>
                      <div className="flex text-yellow-400 text-[10px]" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                        <meta itemProp="ratingValue" content={review.rating.toString()} />
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-brand-muted">{review.date}</span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed" itemProp="reviewBody">{review.comment}</p>
              </div>
            ))}
          </div>

          {reviews.length > 2 && !showAllReviews && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllReviews(true)}
                className="inline-block bg-brand-card hover:bg-white/5 text-brand-muted hover:text-white text-sm font-bold py-3 px-8 rounded-xl border border-white/10 transition active:scale-95"
              >
                View All Reviews ({reviews.length})
              </button>
            </div>
          )}
        </section>

        {/* RELATED RINGTONES SECTION */}
        {relatedRingtones.length > 0 && (
          <section className="mt-16 pt-8 border-t border-white/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Music className="w-5 h-5 text-brand-primary" />
              Related Ringtones
              {ringtone.category?.name && (
                <span className="text-xs text-brand-muted font-normal ml-2">
                  from {ringtone.category.name}
                </span>
              )}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedRingtones.map((track) => (
                <Link 
                  key={track.ringtone_id} 
                  href={`/ringtone/${track.slug}`}
                  className="group"
                >
                  <div className="bg-brand-card rounded-xl border border-white/5 hover:border-brand-primary/50 p-4 transition hover:bg-white/5 active:scale-95">
                    {/* Icon/Artwork */}
                    <div className="w-full aspect-square bg-gradient-to-br from-brand-primary/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-3 group-hover:from-brand-primary/30 group-hover:to-purple-600/30 transition">
                      <Music className="w-8 h-8 text-brand-primary" />
                    </div>
                    
                    {/* Info */}
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-brand-primary transition">
                      {track.title}
                    </h3>
                    <p className="text-xs text-brand-muted truncate">{track.artist}</p>
                    
                    {/* Stats - hide when no data */}
                    {track.download_count > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-brand-muted">
                        <Download className="w-3 h-3" />
                        <span>{formatCount(track.download_count)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* View More Button */}
            {ringtone.category?.slug && (
              <div className="text-center mt-6">
                <Link 
                  href={`/category/${ringtone.category.slug}`}
                  className="inline-block bg-brand-card hover:bg-white/5 text-brand-primary hover:text-white text-sm font-bold py-3 px-8 rounded-xl border border-brand-primary/30 transition active:scale-95"
                >
                  View All in {ringtone.category.name}
                </Link>
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  )
}
