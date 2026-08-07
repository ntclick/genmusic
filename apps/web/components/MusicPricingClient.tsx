'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Music, Sparkles, Coffee } from 'lucide-react'

const PAYPAL_DONATE_URL = 'https://www.paypal.com/donate/?business=izuibloger%40gmail.com&currency_code=USD&item_name=Support+PhoneZoo'

export default function PricingClient() {
  return (
    <div className="min-h-screen text-white pb-20">
      {/* Background */}
      <div className="fixed top-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-rose-900/10 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <Link href="/music" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 text-sm">
          <ArrowLeft size={16} /> Back to Music Generator
        </Link>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Heart size={32} className="text-pink-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Support <span className="text-pink-400">PhoneZoo</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            We rely entirely on user donations to pay for expensive AI servers.
            If this tool is useful to you, please consider a small donation to help us maintain it for everyone!
          </p>
        </div>

        {/* Donate card */}
        <div className="bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-orange-500/10 border border-pink-500/20 rounded-3xl p-8 mb-10">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Buy us a coffee</h2>
            <p className="text-gray-400 text-sm mb-6">
              100% of donations go toward AI generation costs and hosting. Every contribution helps!
            </p>
            <a href={PAYPAL_DONATE_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition shadow-lg shadow-pink-500/20">
              <Heart size={18} /> Donate via PayPal
            </a>
            <p className="text-xs text-gray-500 mt-4">
              Sent securely to <span className="text-gray-300">izuibloger@gmail.com</span> via PayPal.
            </p>
          </div>
        </div>

        {/* What you still get for free */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Music, title: 'Free Generation', desc: 'Create AI music tracks every day at no cost.' },
            { icon: Sparkles, title: 'Vocals & Lyrics', desc: 'Generate music with AI lyrics and vocals.' },
            { icon: Coffee, title: 'No Subscription', desc: 'No recurring charges. Donate only if you want to.' },
          ].map((feat, idx) => (
            <div key={idx} className="bg-[#0f172a]/50 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition text-center">
              <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <feat.icon size={18} className="text-pink-400" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{feat.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-bold text-center mb-6">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'Why do you ask for donations?', a: 'AI music generation requires powerful servers that cost a lot to run. Your donations directly pay for these servers so we can keep the tool free.' },
              { q: 'Is donating required to use PhoneZoo?', a: 'Not at all. Donations are completely optional — they just help cover our AI and hosting costs so we can keep things free.' },
              { q: 'How do donations work?', a: 'Donations go through PayPal directly to izuibloger@gmail.com. No subscription, no recurring charges — donate any amount, one time.' },
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#0f172a]/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
