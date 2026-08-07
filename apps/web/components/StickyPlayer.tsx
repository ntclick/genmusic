'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { audioPlayer } from '@/lib/audio' // ✅ NEW: Import audioPlayer
import { Play, Pause, Music } from 'lucide-react' // ✅ NEW: Import Lucide React components
import { useAudio } from '@/contexts/AudioContext'

export default function StickyPlayer() {
    const { currentTrack, isPlaying, togglePlay } = useAudio()
    const progressRef = useRef<HTMLDivElement>(null)
    const [currentProgress, setCurrentProgress] = useState(0) // ✅ NEW: State for progress

    // Listen to audioPlayer time updates
    useEffect(() => {
        const handleTimeUpdate = (time: number, duration: number) => {
            if (duration > 0) {
                setCurrentProgress((time / duration) * 100);
            }
        };

        audioPlayer.on('timeUpdate', handleTimeUpdate);

        return () => {
            audioPlayer.off('timeUpdate', handleTimeUpdate);
        };
    }, []);

    // Handle progress bar click to seek
    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (audioPlayer.getPlayingTrackId() && progressRef.current) {
            const progressBar = progressRef.current.parentElement;
            if (progressBar) {
                const clickX = e.clientX - progressBar.getBoundingClientRect().left;
                const width = progressBar.offsetWidth;
                const duration = audioPlayer.getDuration();
                if (duration > 0) {
                    const newTime = (clickX / width) * duration;
                    audioPlayer.seek(newTime);
                }
            }
        }
    }, []);

    // Hide player if no track is selected
    if (!currentTrack?.id) {
        return null // Don't render if no track is selected
    }

    return (
        <div id="sticky-player" className={`fixed bottom-0 left-0 w-full bg-[#0f172a]/95 backdrop-blur-md border-t border-white/10 transition-transform duration-300 shadow-2xl z-[100] ${currentTrack?.id ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="w-full h-1 bg-slate-800 cursor-pointer group" onClick={handleProgressClick}>
                <div className="h-full bg-brand-primary w-0 transition-all duration-100" style={{ width: `${currentProgress}%` }} ref={progressRef}></div>
            </div>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 w-1/3">
                    <div className="w-10 h-10 bg-brand-card rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                        {currentTrack?.artwork_url ? (
                            <Image src={currentTrack.artwork_url} alt="Artwork" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-brand-primary/20 flex items-center justify-center"><Music className="w-5 h-5 text-brand-primary" /></div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 id="player-title" className="text-white font-bold text-sm truncate">{currentTrack?.title || "Select a song"}</h4>
                        <p id="player-artist" className="text-xs text-brand-muted truncate">{currentTrack?.artist || "Phonezoo"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        id="sticky-play-btn"
                        onClick={togglePlay}
                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg active:scale-95"
                        aria-label={isPlaying ? `Pause ${currentTrack?.title || "song"}` : `Play ${currentTrack?.title || "song"}`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
                    </button>
                </div>
                <div className="flex items-center justify-end gap-3 w-1/3">
                    <Link href={`/ringtone/${currentTrack?.title ? currentTrack.title.toLowerCase().replace(/\s+/g, '-') : ''}`} className="bg-brand-primary/20 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-primary hover:text-white transition hidden sm:block active:scale-95">
                        Details
                    </Link>
                </div>
            </div>
        </div>
    )
}
