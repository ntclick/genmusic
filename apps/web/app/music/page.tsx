import { Metadata } from 'next'
import UnifiedMusicStudio from '@/components/UnifiedMusicStudio'
import { ShieldCheck, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Music & Ringtone Studio | Phonezoo ShelbyNet',
  description: 'Generate custom AI music tracks and ringtones with Pexels cover artwork and permanent decentralized ShelbyNet storage on Aptos.',
}

export default function MusicPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-[#f8fafc] overflow-x-hidden pb-20 pt-6">
      <UnifiedMusicStudio />
    </main>
  )
}
