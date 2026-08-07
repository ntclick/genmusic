import { Metadata } from 'next'
import MakerPageClient from '@/components/MakerPageClient'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Free Ringtone Maker - Best iPhone Ringtone Creator & Android Converter',
  description: 'Welcome to the ultimate free ringtone maker. Phonezoo offers a powerful, web-based ringtone creator that lets you turn any song into a custom ringtone for iPhone or Android. No app install needed.',
  keywords: 'ringtone maker, free ringtone maker, iphone ringtone maker, ringtone creator, ringtone cutter, ringtone converter, create iphone ringtone',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Free Ringtone Maker - Create Custom Ringtones',
    description: 'Create custom ringtones for iPhone and Android. Free online tool, no software needed.',
    type: 'website',
    url: 'https://phonezoo.com/maker',
    siteName: 'Phonezoo',
    locale: 'en_US',
  },
  alternates: {
    canonical: 'https://phonezoo.com/maker',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#020617',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Phonezoo Ringtone Maker',
  url: 'https://phonezoo.com/maker',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Free online ringtone maker. Create custom M4R and MP3 ringtones for iPhone and Android.',
}

export default function MakerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full" role="status" aria-label="Loading ringtone maker" />
        </div>
      }>
        <MakerPageClient />
      </Suspense>
    </>
  )
}
