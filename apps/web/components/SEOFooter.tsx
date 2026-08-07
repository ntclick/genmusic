'use client'

import Link from 'next/link'

export default function SEOFooter() {
  return (
    <section className="py-16 container mx-auto px-4 border-t border-white/5">
      <article className="prose prose-invert prose-sm max-w-5xl mx-auto text-brand-muted">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">AI Music &amp; Free Ringtones — All in One Place</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-2">AI Music Generator</h3>
            <p className="mb-4">Create <strong>unique AI-generated music</strong> in seconds. Describe the vibe you want — genre, mood, tempo — and our AI composes an original track just for you. Download in MP3, WAV, or FLAC and use it anywhere.</p>
            <Link href="/music" className="text-brand-primary hover:text-white transition font-bold">
              Create AI Music →
            </Link>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Free Ringtones for Android</h3>
            <p className="mb-4">Why install heavy apps? Phonezoo lets you <strong>download free ringtones</strong> directly to your Android device in MP3 format. Simply browse, click download, and set your new sound in settings.</p>
            <Link href="/category/android" className="text-brand-primary hover:text-white transition font-bold">
              Browse Android Ringtones →
            </Link>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Free Ringtones for iPhone</h3>
            <p className="mb-4">Getting custom sounds on iOS can be tricky. We provide direct <strong>M4R ringtone downloads</strong> optimized for iPhone. No need for complex conversions — just download and sync.</p>
            <Link href="/category/iphone" className="text-brand-primary hover:text-white transition font-bold">
              Browse iPhone Ringtones →
            </Link>
          </div>
        </div>

        <p className="text-center mt-6">
          Our library is updated daily with <strong>AI-generated tracks</strong> and <strong>free ringtone downloads</strong> covering genres like Pop, Hip Hop, Country, Funny, and Sound Effects.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/music" className="bg-brand-primary hover:bg-brand-primaryHover text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-orange-500/20">
            Create AI Music
          </Link>
          <Link href="/maker" className="border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white px-8 py-3 rounded-full font-bold transition">
            Ringtone Maker
          </Link>
        </div>
      </article>
    </section>
  )
}
