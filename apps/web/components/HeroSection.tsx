'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Wand2, ArrowRight, ShieldCheck, Zap, Disc } from 'lucide-react'

const PROMPT_PRESETS = [
  { label: '🔥 Upbeat Cyberpunk Synthwave', prompt: 'Cyberpunk synthwave upbeat energetic synth bass 128 BPM' },
  { label: '☕ Chill Lo-Fi Study Beat', prompt: 'Relaxing lo-fi hip hop beat with warm piano and crackle' },
  { label: '🎻 Epic Cinematic Trailer', prompt: 'Epic cinematic orchestral trailer music with heavy brass and drums' },
  { label: '🔔 Futuristic iPhone Ringtone', prompt: 'Futuristic chime glass synth ringtone high pitch clear 30s' },
]

export default function HeroSection() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')

  const handleOpenStudio = () => {
    const q = prompt.trim() ? `?prompt=${encodeURIComponent(prompt.trim())}` : ''
    router.push(`/music${q}`)
  }

  return (
    <section className="relative py-16 lg:py-24 text-center overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0a0f1d] via-[#020617] to-[#020617]">
      {/* Background glowing lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-orange-500/15 via-purple-500/20 to-pink-500/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Network & Protocol Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-gray-300">
            Powered by <strong className="text-white font-bold">ShelbyNet</strong> on Aptos Blockchain
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
          Compose <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">AI Music</span> & <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">AI Ringtones</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
          Create complete AI songs with lyrics or custom ringtones in seconds. Permanently stored & served on the decentralized <strong className="text-white">ShelbyNet devnet</strong>.
        </p>

        {/* Interactive Prompt Builder — SINGLE BUTTON */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-[#0f172a]/90 border border-white/15 p-2 rounded-2xl shadow-2xl backdrop-blur-xl focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <div className="flex items-center px-3 py-2">
              <Wand2 className="w-5 h-5 text-orange-400 flex-shrink-0 mr-3 animate-pulse" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenStudio()}
                placeholder="Describe your sound (e.g., Upbeat summer pop with acoustic guitar)..."
                className="w-full bg-transparent text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none"
              />
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={handleOpenStudio}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-black text-base shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>Open AI Studio & Create Audio</span>
              </button>
            </div>
          </div>

          {/* Quick Prompt Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
              <Zap className="w-3 h-3 text-amber-400" /> Try a prompt:
            </span>
            {PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setPrompt(preset.prompt)
                  router.push(`/music?prompt=${encodeURIComponent(preset.prompt)}`)
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-orange-500/40 transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Single Studio CTA Card */}
        <div className="max-w-2xl mx-auto text-center">
          <Link
            href="/music"
            className="group relative inline-flex items-center gap-3 bg-[#0f172a]/90 border border-orange-500/30 hover:border-orange-500/60 px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/15 hover:-translate-y-0.5 overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Music & Ringtone Studio</span>
                <ArrowRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-gray-400">
                100% Free • No Login Required • ShelbyNet On-Chain Storage
              </p>
            </div>
          </Link>
        </div>

      </div>
    </section>
  )
}
