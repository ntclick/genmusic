'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { audioPlayer } from '@/lib/audio'

interface Track {
  id: string | number | null
  title: string
  artist: string
  url_mp3: string | null | undefined
  artwork_url?: string | null | undefined
}

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  playTrack: (track: Track) => void
  pauseTrack: () => void
  togglePlay: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

interface AudioProviderProps {
  children: ReactNode
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Listen to audioPlayer state changes
  useEffect(() => {
    const handlePlayStateChange = (state: { isPlaying: boolean; trackId: string | null }) => {
      setIsPlaying(state.isPlaying)
    }

    audioPlayer.on('playStateChange', handlePlayStateChange)

    return () => {
      audioPlayer.off('playStateChange', handlePlayStateChange)
    }
  }, [])

  const playTrack = useCallback((track: Track) => {
    const trackId = track.id?.toString() || ''
    if (track.url_mp3 && (track.url_mp3.startsWith('http') || track.url_mp3.startsWith('data:'))) {
      audioPlayer.play(trackId, track.url_mp3)
      setCurrentTrack(track)
    } else {
      // No valid URL - play demo tone
      audioPlayer.play(trackId, '') // Empty URL triggers demo tone
      setCurrentTrack(track)
    }
  }, [])

  const pauseTrack = useCallback(() => {
    audioPlayer.pause()
  }, [])

  const togglePlay = useCallback(() => {
    if (currentTrack) {
      if (isPlaying) {
        audioPlayer.pause()
      } else {
        audioPlayer.resume()
      }
    }
  }, [currentTrack, isPlaying])

  const value = {
    currentTrack,
    isPlaying,
    playTrack,
    pauseTrack,
    togglePlay
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}
