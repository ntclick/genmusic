import { Metadata } from 'next'
import HeroSection from '@/components/HeroSection'
import RecentGeneratedMusic from '@/components/RecentGeneratedMusic'
import { getRecentPublicGenerations } from '@/lib/music-storage'
import { ShieldCheck, HelpCircle, Sparkles } from 'lucide-react'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'GenMusic AI - AI Music Studio | ShelbyNet',
  description: 'Create unique AI songs instantly. Powered by AI with Pexels cover artwork and permanent decentralized ShelbyNet storage on Aptos.',
}

const faqs = [
  {
    question: 'Do I need an account or login to generate music?',
    answer: 'No! You can freely describe your sound and generate AI music instantly without signing in or creating an account.',
  },
  {
    question: 'Where is my generated audio stored?',
    answer: 'Every track is registered directly on Aptos Move smart contracts and stored on ShelbyNet — Shelby Protocol\'s high-performance decentralized blob storage network.',
  },
  {
    question: 'What is ShelbyNet Protocol?',
    answer: 'ShelbyNet is a decentralized storage network running on Aptos validator nodes. It provides low-latency blob storage with erasure coding and verifiable on-chain Move smart contract transactions.',
  },
]

export default async function HomePage() {
  const aiMusicTracks = await getRecentPublicGenerations(8).catch(() => [])

  return (
    <main className="min-h-screen bg-[#020617] text-[#f8fafc] overflow-x-hidden pb-20">
      {/* Hero Section */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24 mt-12">
        {/* Recent AI Music Tracks (Shows newest generated tracks first) */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Latest Generated AI Tracks
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Featured AI Music Tracks
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Newest AI music tracks generated and stored on ShelbyNet
              </p>
            </div>
          </div>

          <RecentGeneratedMusic initialTracks={aiMusicTracks} />
        </section>

        {/* ShelbyNet Storage Banner */}
        <section className="bg-gradient-to-br from-[#0d1527] via-[#0f172a] to-[#16122c] border border-emerald-500/20 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4" /> ShelbyNet Move Protocol
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Decentralized Blob Storage on Aptos Blockchain
            </h2>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-3xl">
              Every audio track generated on GenMusic is committed directly via Move smart contracts to the <strong className="text-emerald-400">ShelbyNet devnet</strong>. Your audio assets are erasure-coded and served via high-speed public RPC endpoints.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-mono text-gray-300">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p className="text-emerald-400 font-bold mb-0.5">Shelby RPC</p>
                <p className="text-[11px] text-gray-400 truncate">https://api.shelbynet.shelby.xyz/shelby</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p className="text-emerald-400 font-bold mb-0.5">Aptos Full Node</p>
                <p className="text-[11px] text-gray-400 truncate">https://api.shelbynet.shelby.xyz/v1</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <p className="text-emerald-400 font-bold mb-0.5">Location Preference</p>
                <p className="text-[11px] text-gray-400 truncate">shelbynet-1</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-[#0f172a]/80 border border-white/10 rounded-2xl transition-all">
                <summary className="px-6 py-4 cursor-pointer text-white font-bold text-sm sm:text-base flex items-center justify-between hover:text-orange-400 transition-colors list-none">
                  <span>{faq.question}</span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-6 pb-5 text-gray-300 text-xs sm:text-sm leading-relaxed border-t border-white/5 pt-3">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
