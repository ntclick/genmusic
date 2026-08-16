import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, ArrowLeft } from 'lucide-react'
import { AudioPlayer } from '@/components/ui/AudioPlayer'

export const metadata: Metadata = { title: 'Audio Preview | PhoneZoo' }

function isAllowedAudioUrl(url: string): boolean {
  if (!url.startsWith('https://')) return false
  // Shelby (shelbynet) is the only storage backend.
  return url.includes('.shelby.xyz')
}

export default function PreviewPage({
  searchParams,
}: {
  searchParams: { url?: string }
}) {
  const url = searchParams.url || ''

  if (!url || !isAllowedAudioUrl(url)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-brand-text text-sm">
          {url ? 'Invalid or disallowed audio URL.' : 'No audio URL provided.'}
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-brand-text hover:text-brand-white transition-colors"
        >
          <ArrowLeft size={15} />
          PhoneZoo
        </Link>

        {/* Card */}
        <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <p className="text-xs text-brand-text uppercase tracking-widest">AI Ringtone</p>
            <h1 className="text-brand-white font-semibold text-lg leading-snug">
              Your generated ringtone
            </h1>
          </div>

          {/* Player */}
          <AudioPlayer src={url} />

          {/* Storage badge */}
          <div className="flex items-center gap-1.5 text-xs text-brand-text">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-green-500" />
            Stored on ShelbyNet
          </div>

          {/* Download */}
          <a
            href={url}
            download="ringtone.mp3"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-semibold text-sm transition-colors"
          >
            <Download size={15} />
            Download MP3
          </a>
        </div>

        {/* Create your own CTA */}
        <p className="text-center text-xs text-brand-text">
          Want your own?{' '}
          <Link href="/generate" className="text-brand-orange hover:underline">
            Generate a ringtone →
          </Link>
        </p>
      </div>
    </main>
  )
}
