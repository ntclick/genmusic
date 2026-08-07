import type { Metadata } from 'next'
import { getSupabaseAdminClient } from '@/lib/supabase'
import { getRecentRingtones } from '@/lib/storage'
import { GenerateForm } from '@/components/GenerateForm'
import { RingtoneCard } from '@/components/RingtoneCard'
import { Lightbulb, Clock, Cpu, Music2 } from 'lucide-react'
import type { Genre } from '@/types'

export const metadata: Metadata = {
  title: 'Generate AI Ringtone',
  description: 'Create a custom AI ringtone in seconds. Choose your genre, describe your sound, and download a unique MP3.',
}

async function getGenres(): Promise<Genre[]> {
  try {
    const supabase = getSupabaseAdminClient()
    const { data } = await supabase.from('genres' as any).select('*').order('sort_order')
    return (data as unknown as Genre[]) || []
  } catch {
    return []
  }
}

interface GeneratePageProps {
  searchParams: { genre?: string; prompt?: string }
}

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const [genres, recentRingtones] = await Promise.all([
    getGenres(),
    getRecentRingtones(8),
  ])

  const defaultGenre = searchParams.genre && genres.some(g => g.id === searchParams.genre)
    ? searchParams.genre
    : 'pop'
  const defaultPrompt = searchParams.prompt || ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-brand-white">Generate Ringtone</h1>
        <p className="text-brand-text mt-2">
          Describe the sound you want — AI will compose a unique ringtone in about 60 seconds.
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">

        {/* ── Left: Form + Status ── */}
        <div className="min-w-0">
          <GenerateForm
            genres={genres}
            defaultGenre={defaultGenre}
            defaultPrompt={defaultPrompt}
          />
        </div>

        {/* ── Right: Tips + Info (sticky) ── */}
        <aside className="space-y-4 lg:sticky lg:top-24">

          {/* Tips card */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-brand-white">
              <Lightbulb size={15} className="text-brand-orange flex-shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider">Tips for better results</p>
            </div>
            <ul className="space-y-2">
              {[
                'Be specific: "upbeat summer pop with piano and acoustic guitar"',
                'Mention tempo: "fast 128 BPM" or "slow and mellow"',
                'Add mood: "happy", "mysterious", "epic", "relaxing"',
                'Combine instruments: "violin + electronic bass + drums"',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-brand-text">
                  <span className="text-brand-orange mt-0.5 flex-shrink-0">›</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* How it works */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-white">How it works</p>
            <div className="space-y-3">
              {[
                { icon: Music2, label: 'Describe', desc: 'Pick a genre and describe the vibe' },
                { icon: Cpu, label: 'AI generates', desc: 'MusicGen AI runs on GPU (~60s)' },
                { icon: Clock, label: 'Download', desc: 'Get your MP3 and set as ringtone' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={13} className="text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-white">{label}</p>
                    <p className="text-xs text-brand-text">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage info */}
          <div className="bg-bg-panel border border-bg-border rounded-xl p-4">
            <p className="text-xs text-brand-text leading-relaxed">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5 align-middle" />
              Files stored on <span className="text-brand-white font-medium">Shelby testnet</span>{' '}
              — decentralized storage on the Aptos blockchain.
            </p>
          </div>
        </aside>
      </div>

      {/* Recently created — full width below */}
      {recentRingtones.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-semibold text-brand-white mb-5">Recently Created</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentRingtones.map(ringtone => (
              <RingtoneCard key={ringtone.id} ringtone={ringtone as any} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
