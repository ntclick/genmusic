import { Metadata } from 'next'
import Link from 'next/link'
import { Music, Zap, Shield, Globe, Heart, Smartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Phonezoo - Free Online Ringtone Maker',
  description: 'Learn about Phonezoo, the best free online ringtone maker. Create custom ringtones for iPhone and Android from any song. No software installation required.',
  keywords: ['about phonezoo', 'ringtone maker', 'free ringtone creator', 'online ringtone editor', 'mp3 to m4r converter'],
  openGraph: {
    title: 'About Phonezoo - Free Ringtone Maker',
    description: 'Discover how Phonezoo helps millions create custom ringtones for free. No downloads, no registration required.',
    type: 'website',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Music className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">About Phonezoo</h1>
          <p className="text-lg text-brand-text max-w-2xl mx-auto">
            The easiest way to create custom ringtones for your iPhone or Android device. 
            Free, fast, and no software installation required.
          </p>
        </div>

        {/* Mission */}
        <section className="bg-bg-panel border border-bg-border rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="leading-relaxed text-lg">
            We believe everyone deserves a unique ringtone that reflects their personality. 
            Phonezoo was created to make ringtone creation accessible to everyone, without 
            complicated software or expensive apps. Simply upload your favorite song, select 
            the perfect section, and download your custom ringtone in seconds.
          </p>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Choose Phonezoo?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 hover:border-brand-orange/40 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-orange" />
                </div>
                <h3 className="text-lg font-bold text-white">Lightning Fast</h3>
              </div>
              <p className="text-sm">Create ringtones in seconds. No waiting, no processing queues. Everything happens instantly in your browser.</p>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 hover:border-brand-orange/40 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-white">100% Secure</h3>
              </div>
              <p className="text-sm">Your files never leave your device. All processing happens locally in your browser for maximum privacy.</p>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 hover:border-brand-orange/40 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Works Everywhere</h3>
              </div>
              <p className="text-sm">No downloads or installations. Works on any device with a modern web browser - desktop, tablet, or mobile.</p>
            </div>

            <div className="bg-bg-panel border border-bg-border rounded-2xl p-6 hover:border-brand-orange/40 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-white">All Formats</h3>
              </div>
              <p className="text-sm">Export as M4R for iPhone, MP3 for Android, or WAV for high quality. We support all major formats.</p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gradient-to-r from-brand-orange/10 to-brand-orangeHover/10 border border-brand-orange/20 rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-orange">1M+</p>
              <p className="text-sm text-brand-text">Ringtones Created</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-orange">50+</p>
              <p className="text-sm text-brand-text">Countries</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-orange">100%</p>
              <p className="text-sm text-brand-text">Free Forever</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <p className="text-white font-semibold">Made with love for music lovers</p>
          </div>
          <Link 
            href="/maker" 
            className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orangeHover text-white font-bold py-3 px-8 rounded-xl transition"
          >
            Start Creating Ringtones
          </Link>
        </section>

        {/* Back Link */}
        <div className="mt-12 text-center">
          <Link href="/" className="text-brand-orange hover:text-brand-orangeHover transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
