'use client'

import { useState, useEffect } from 'react'
import { DownloadCloud, X, Apple, Smartphone, ChevronRight, Info, Heart } from 'lucide-react'
import { getAudioUrl } from '@/lib/database'
import Link from 'next/link'

const R2_PUBLIC = 'https://pub-7cafaf04d6324dc1acc356106790287a.r2.dev'

interface DownloadRequest {
  trackId: string;
  title: string;
  track?: any;
}

export default function DownloadModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDownload, setCurrentDownload] = useState<DownloadRequest | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const handleDownloadRequest = (e: CustomEvent<DownloadRequest>) => {
      setCurrentDownload(e.detail)
      setIsOpen(true)
    }
    window.addEventListener('downloadRequest' as any, handleDownloadRequest)
    return () => {
      window.removeEventListener('downloadRequest' as any, handleDownloadRequest)
    }
  }, [])

  const closeModal = () => {
    setIsOpen(false)
    setCurrentDownload(null)
    setDownloading(false)
  }

  const getM4rUrl = (track: any): string | null => {
    try {
      const keys = typeof track.r2_processed_keys === 'string'
        ? JSON.parse(track.r2_processed_keys)
        : track.r2_processed_keys
      if (!keys?.m4r) return null
      const m4rKey = keys.m4r
      // If key already has full path, use it; otherwise it's just a filename
      return m4rKey.startsWith('http') ? m4rKey : `${R2_PUBLIC}/${m4rKey}`
    } catch {
      return null
    }
  }

  const triggerDownload = async (url: string, filename: string) => {
    // Use fetch+blob for reliable cross-platform downloads (especially iOS Safari)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch {
      // Fallback: open URL directly
      window.open(url, '_blank')
    }
  }

  const handleDownload = async (platform: 'iphone' | 'android') => {
    if (!currentDownload?.track || downloading) return
    setDownloading(true)

    try {
      if (platform === 'iphone') {
        // Try real M4R first, fall back to MP3
        const m4rUrl = getM4rUrl(currentDownload.track)
        if (m4rUrl) {
          await triggerDownload(m4rUrl, `${currentDownload.title}.m4r`)
        } else {
          // No M4R available — download MP3 as fallback
          const mp3Url = await getAudioUrl(currentDownload.track, 'mp3')
          if (!mp3Url) { alert('Download not available.'); setDownloading(false); return }
          await triggerDownload(mp3Url, `${currentDownload.title}.mp3`)
        }
      } else {
        // Android: always MP3
        const mp3Url = await getAudioUrl(currentDownload.track, 'mp3')
        if (!mp3Url) { alert('Download not available.'); setDownloading(false); return }
        await triggerDownload(mp3Url, `${currentDownload.title}.mp3`)
      }

      // Track download count
      try {
        await fetch(`/api/downloads/${currentDownload.track.ringtone_id || currentDownload.track.id}`, {
          method: 'POST'
        })
      } catch {}

      closeModal()
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
      setDownloading(false)
    }
  }

  if (!isOpen || !currentDownload) return null

  return (
    <div id="download-modal" className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal}></div>

      <div className="relative bg-brand-card border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <button className="absolute top-4 right-4 text-brand-muted hover:text-white transition p-2 active:scale-95" onClick={closeModal}>
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-primary/20">
            <DownloadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Download Ringtone</h3>
          <p className="text-xs text-brand-muted">{currentDownload.title}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleDownload('iphone')}
            disabled={downloading}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-brand-dark border border-white/5 hover:border-brand-primary/50 hover:bg-white/5 transition group disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
                <Apple className="w-5 h-5 fill-black" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-white group-hover:text-brand-primary transition">
                  {downloading ? 'Downloading...' : 'iPhone (iOS)'}
                </span>
                <span className="block text-[10px] text-brand-muted">Format: .M4R</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition" />
          </button>

          <button
            onClick={() => handleDownload('android')}
            disabled={downloading}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-brand-dark border border-white/5 hover:border-brand-primary/50 hover:bg-white/5 transition group disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-white group-hover:text-brand-primary transition">
                  {downloading ? 'Downloading...' : 'Android'}
                </span>
                <span className="block text-[10px] text-brand-muted">Format: .MP3</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition" />
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
          <Info className="w-4 h-4 text-brand-orange mt-0.5 shrink-0" />
          <p className="text-[10px] text-brand-muted leading-relaxed">
            <strong className="text-white">iPhone:</strong> Save file, open in GarageBand, export as ringtone. <strong className="text-white">Android:</strong> File saves to Downloads &mdash; set via Settings &gt; Sound.
          </p>
        </div>

        <div className="mt-4 text-center border-t border-white/5 pt-3">
          <Link href="/music/pricing" onClick={closeModal} className="inline-flex items-center justify-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-bold transition group">
            <Heart className="w-3.5 h-3.5 fill-pink-500/20 group-hover:scale-110 transition duration-300 animate-pulse" />
            <span>Support PhoneZoo to keep it free!</span>
          </Link>
          <p className="text-[9px] text-brand-muted mt-2 opacity-55">100% Free &amp; Secure Download</p>
        </div>
      </div>
    </div>
  )
}
