'use client'

import { useState, useEffect } from 'react'
import { X, Facebook, Twitter, Linkedin, MessageCircle, Share2, Music, Link2 } from 'lucide-react'

interface ShareTrack {
  slug: string
  title: string
  artist?: string
}

export default function ShareModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [track, setTrack] = useState<ShareTrack | null>(null)
  const [copied, setCopied] = useState(false)

  // Listen for shareRequest events
  useEffect(() => {
    const handleShareRequest = (e: CustomEvent<{ track: ShareTrack }>) => {
      if (e.detail?.track) {
        setTrack(e.detail.track)
        setIsOpen(true)
        setCopied(false)
      }
    }

    window.addEventListener('shareRequest' as any, handleShareRequest)
    return () => window.removeEventListener('shareRequest' as any, handleShareRequest)
  }, [])

  const closeModal = () => {
    setIsOpen(false)
    setTrack(null)
    setCopied(false)
  }

  const getShareUrl = () => {
    if (!track?.slug) return ''
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/ringtone/${track.slug}`
  }

  const handleSocialShare = (platform: string) => {
    if (!track) return

    const shareUrl = getShareUrl()
    const title = `Check out this ringtone: ${track.title}`
    const text = `Listen to ${track.title} on Phonezoo!`

    let shareLink = ''

    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case 'threads':
        shareLink = `https://threads.net/intent/post?text=${encodeURIComponent(text + ' ' + shareUrl)}`
        break
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        return
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400')
      closeModal()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (!isOpen || !track) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div className="bg-brand-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Share Ringtone</h3>
          <button
            onClick={closeModal}
            className="p-2 text-brand-muted hover:text-white rounded-full hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Info */}
        <div className="mb-4">
          <div className="flex items-center gap-3 p-3 bg-brand-dark rounded-xl">
            <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">{track.title}</h4>
              {track.artist && (
                <p className="text-xs text-brand-muted truncate">{track.artist}</p>
              )}
            </div>
          </div>
        </div>

        {/* Social Share Buttons */}
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
            className="flex items-center gap-3 p-3 bg-black hover:bg-gray-900 text-white rounded-xl transition active:scale-95 border border-white/10"
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

        {/* Copy Link */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => handleSocialShare('copy')}
            className="w-full flex items-center justify-center gap-2 p-3 bg-brand-dark hover:bg-white/5 text-brand-muted hover:text-white rounded-xl transition active:scale-95"
          >
            {copied ? (
              <>
                <Link2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
