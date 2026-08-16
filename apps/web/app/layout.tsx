/* eslint-disable @next/next/no-sync-scripts */
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";
import DownloadModal from '@/components/DownloadModal';
import ShareModal from '@/components/ShareModal';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { AudioProvider } from '@/contexts/AudioContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import StickyPlayer from '@/components/StickyPlayer';
import ConditionalScripts from '@/components/ConditionalScripts';
import Link from 'next/link';
import { Coffee } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://phonezoo.com'),
  title: {
    default: 'Phonezoo - Free Ringtone Maker & Download | iPhone & Android',
    template: '%s | Phonezoo',
  },
  description: 'Create custom ringtones for iPhone and Android for free. Best online ringtone maker - trim MP3, convert to M4R, download instantly. No software needed.',
  keywords: ['free ringtone maker', 'iphone ringtone', 'android ringtone', 'mp3 to m4r converter', 'ringtone download', 'custom ringtones', 'ringtone creator', 'ringtone cutter'],
  authors: [{ name: 'Phonezoo' }],
  creator: 'Phonezoo',
  publisher: 'Phonezoo',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://phonezoo.com',
    siteName: 'Phonezoo',
    title: 'Phonezoo - Free Ringtone Maker for iPhone & Android',
    description: 'Create custom ringtones from any song. Free online ringtone maker with AI auto-cut. No downloads required.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Phonezoo - Free Ringtone Maker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phonezoo - Free Ringtone Maker',
    description: 'Create custom ringtones for iPhone & Android. Free, fast, no software needed.',
    images: ['/og-image.png'],
  },
  verification: {
    google: '',
  },
  alternates: {
    canonical: 'https://phonezoo.com',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: true,
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enableVercelAnalytics = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true'

  return (
    <html lang="en" className={`scroll-smooth ${inter.className}`}>
      <head>
        {/* Ezoic Privacy Consent Scripts */}
        <script data-cfasync="false" src="https://cmp.gatekeeperconsent.com/min.js" />
        <script data-cfasync="false" src="https://the.gatekeeperconsent.com/cmp.min.js" />

        {/* Ezoic Header Script */}
        <script async src="//www.ezojs.com/ezoic/sa.min.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ezstandalone = window.ezstandalone || {};
              ezstandalone.cmd = ezstandalone.cmd || [];
            `,
          }}
        />
        <script src="//ezoicanalytics.com/analytics.js" />

        {/* AdSense verification (not tracking) */}
        <meta name="google-adsense-account" content="ca-pub-5132863470187102" />

        {/* DNS prefetch for faster external resource loading */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="//api.shelbynet.shelby.xyz" />
        <link rel="dns-prefetch" href="//www.ezojs.com" />
        <link rel="dns-prefetch" href="//ezoicanalytics.com" />
        <link rel="dns-prefetch" href="//cmp.gatekeeperconsent.com" />
        <link rel="dns-prefetch" href="//the.gatekeeperconsent.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
      </head>
      <body className={`antialiased font-sans min-h-screen flex flex-col bg-[#020617] text-[#f8fafc]`} style={{ paddingBottom: '90px' }}>
        <CookieConsentProvider>
          <AudioProvider>
            <ConditionalScripts />
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <DownloadModal />
            <ShareModal />
            <StickyPlayer />
            <CookieConsentBanner />
            {/* Global Floating Donation Widget */}
            <Link href="/music/pricing"
              className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold transition-all shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 text-xs ring-4 ring-pink-500/20"
              aria-label="Support PhoneZoo"
            >
              <Coffee className="w-4 h-4 fill-white/10" />
              <span>Support Us ☕️</span>
            </Link>
          </AudioProvider>
        </CookieConsentProvider>
        {enableVercelAnalytics && <Analytics />}
      </body>
    </html>
  );
}
