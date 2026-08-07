import { Metadata } from 'next'
import CategoryPageClient from '@/components/CategoryPageClient'

interface PageProps {
  params: { type: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categoryType = params.type || 'trending'

  const categoryTitles = {
    trending: 'Trending Ringtones 2025 - Download Free MP3 & M4R | Phonezoo',
    iphone: 'iPhone Ringtones 2025 - Free M4R Downloads | Phonezoo',
    android: 'Android Ringtones 2025 - Free MP3 Downloads | Phonezoo',
    sms: 'SMS Message Tones 2025 - Free Notification Sounds | Phonezoo',
    alarm: 'Alarm Sounds 2025 - Free Wake Up Tones | Phonezoo',
    funny: 'Funny Ringtones 2025 - Hilarious Sound Effects | Phonezoo',
    game: 'Gaming Sound Effects 2025 - Free Game Audio | Phonezoo'
  }

  const categoryDescriptions = {
    trending: 'Browse the top trending free ringtones of 2025, iPhone remixes, and notification sounds. Download high-quality M4R and MP3 files for free. Updated daily with the latest hits.',
    iphone: 'Download premium iPhone ringtones in M4R format for 2025. Perfect for iOS 18 devices with high-quality audio optimized for mobile playback.',
    android: 'Free Android ringtones in MP3 format for 2025. Compatible with all Android 15 devices and easy to set as ringtone or notification.',
    sms: 'Custom SMS and message notification tones for 2025. Get unique sounds for your text messages and alerts.',
    alarm: 'Energizing alarm sounds to wake you up in 2025. Free downloads in multiple formats for all devices.',
    funny: 'Hilarious ringtones and sound effects for 2025. Make your phone stand out with funny audio clips.',
    game: 'Gaming sound effects and victory themes for 2025. Free downloads for gamers and mobile game enthusiasts.'
  }

  const categoryKeywords = {
    trending: 'trending ringtones 2025, popular ringtones, viral sounds, top ringtones, best ringtones 2025',
    iphone: 'iphone ringtones 2025, m4r ringtones, ios 18 ringtones, apple ringtones, iphone sounds',
    android: 'android ringtones 2025, mp3 ringtones, android 15 sounds, samsung ringtones, google pixel tones',
    sms: 'sms tones 2025, notification sounds, text message tones, alert sounds, message ringtones',
    alarm: 'alarm sounds 2025, wake up tones, morning alarms, alarm ringtones, clock sounds',
    funny: 'funny ringtones 2025, comedy sounds, hilarious tones, meme ringtones, joke sounds',
    game: 'game sounds 2025, gaming ringtones, victory sounds, game audio, esports tones'
  }

  return {
    title: categoryTitles[categoryType as keyof typeof categoryTitles] || categoryTitles.trending,
    description: categoryDescriptions[categoryType as keyof typeof categoryDescriptions] || categoryDescriptions.trending,
    keywords: categoryKeywords[categoryType as keyof typeof categoryKeywords] || categoryKeywords.trending,
    openGraph: {
      title: categoryTitles[categoryType as keyof typeof categoryTitles] || categoryTitles.trending,
      description: categoryDescriptions[categoryType as keyof typeof categoryDescriptions] || categoryDescriptions.trending,
      type: 'website',
      url: `https://phonezoo.com/category/${categoryType}`,
    },
    alternates: {
      canonical: `https://phonezoo.com/category/${categoryType}`,
    },
  }
}

export default function CategoryPage({ params }: PageProps) {
  return <CategoryPageClient categoryType={params.type} />
}
