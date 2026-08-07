import { Metadata } from 'next'
import { Suspense } from 'react'
import SearchPageClient from '@/components/SearchPageClient'

export const metadata: Metadata = {
  title: 'Search Ringtones | Phonezoo - Free Ringtone Maker',
  description: 'Search and find free ringtones for iPhone and Android. Browse thousands of high-quality ringtones, notification sounds, and alarm tones.',
  keywords: ['search ringtones', 'find ringtones', 'ringtone search', 'free ringtones', 'mp3 ringtones'],
  openGraph: {
    title: 'Search Ringtones - Phonezoo',
    description: 'Find the perfect ringtone for your phone. Search our collection of free ringtones.',
    type: 'website',
  },
  alternates: {
    canonical: '/search',
  },
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
      </div>
    }>
      <SearchPageClient />
    </Suspense>
  )
}
