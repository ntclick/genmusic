import { Metadata } from 'next'
import CategoryPageClient from '@/components/CategoryPageClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { type: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const currentYear = new Date().getFullYear()
  const fallbackKey = 'trending' as const
  const categoryType = (params.type || fallbackKey).toLowerCase()

  const categoryTitles = {
    trending: `Trending Ringtones ${currentYear} - Download Free MP3 & M4R | Phonezoo`,
    iphone: `iPhone Ringtones ${currentYear} - Free M4R Downloads | Phonezoo`,
    android: `Android Ringtones ${currentYear} - Free MP3 Downloads | Phonezoo`,
    sms: `SMS Message Tones ${currentYear} - Free Notification Sounds | Phonezoo`,
    alarm: `Alarm Sounds ${currentYear} - Free Wake Up Tones | Phonezoo`,
    funny: `Funny Ringtones ${currentYear} - Hilarious Sound Effects | Phonezoo`,
    game: `Gaming Sound Effects ${currentYear} - Free Game Audio | Phonezoo`
  }

  const categoryDescriptions = {
    trending: `Browse the top trending free ringtones of ${currentYear}, iPhone remixes, and notification sounds. Download high-quality M4R and MP3 files for free. Updated daily with the latest hits.`,
    iphone: `Download premium iPhone ringtones in M4R format for ${currentYear}. Perfect for iOS devices with high-quality audio optimized for mobile playback.`,
    android: `Free Android ringtones in MP3 format for ${currentYear}. Compatible with all Android devices and easy to set as ringtone or notification.`,
    sms: `Custom SMS and message notification tones for ${currentYear}. Get unique sounds for your text messages and alerts.`,
    alarm: `Energizing alarm sounds to wake you up in ${currentYear}. Free downloads in multiple formats for all devices.`,
    funny: `Hilarious ringtones and sound effects for ${currentYear}. Make your phone stand out with funny audio clips.`,
    game: `Gaming sound effects and victory themes for ${currentYear}. Free downloads for gamers and mobile game enthusiasts.`
  }

  const categoryKeywords = {
    trending: `trending ringtones ${currentYear}, popular ringtones, viral sounds, top ringtones, best ringtones ${currentYear}`,
    iphone: `iphone ringtones ${currentYear}, m4r ringtones, ios ringtones, apple ringtones, iphone sounds`,
    android: `android ringtones ${currentYear}, mp3 ringtones, android sounds, samsung ringtones, google pixel tones`,
    sms: `sms tones ${currentYear}, notification sounds, text message tones, alert sounds, message ringtones`,
    alarm: `alarm sounds ${currentYear}, wake up tones, morning alarms, alarm ringtones, clock sounds`,
    funny: `funny ringtones ${currentYear}, comedy sounds, hilarious tones, meme ringtones, joke sounds`,
    game: `game sounds ${currentYear}, gaming ringtones, victory sounds, game audio, esports tones`
  }

  type CategoryKey = keyof typeof categoryTitles
  const isKnownCategory = (key: string): key is CategoryKey => key in categoryTitles
  const resolvedKey: CategoryKey = isKnownCategory(categoryType) ? categoryType : fallbackKey

  const title = categoryTitles[resolvedKey]
  const description = categoryDescriptions[resolvedKey]
  const specificKeywords = categoryKeywords[resolvedKey]
  const baseKeywords = `free ringtones, ${resolvedKey} ringtones, ringtone download, ${resolvedKey} sounds, phonezoo`
  const keywords = `${baseKeywords}, ${specificKeywords}`
  const canonicalUrl = `https://phonezoo.com/category/${resolvedKey}`

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default function CategoryPage({ params }: PageProps) {
  return <CategoryPageClient categoryType={params.type} />
}
