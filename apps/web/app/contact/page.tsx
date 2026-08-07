import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageSquare, Clock, Send } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Phonezoo - Free Ringtone Maker Support',
  description: 'Get in touch with Phonezoo team. We are here to help with any questions about our free ringtone maker, technical support, or business inquiries.',
  keywords: ['contact phonezoo', 'ringtone maker support', 'help', 'customer service', 'feedback'],
  openGraph: {
    title: 'Contact Phonezoo - Get Support',
    description: 'Have questions about our ringtone maker? Contact our support team for assistance.',
    type: 'website',
  },
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-lg text-brand-text max-w-2xl mx-auto">
            Have questions, feedback, or need assistance? We&apos;re here to help!
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-bg-panel border border-bg-border rounded-2xl p-8 hover:border-brand-orange/40 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">General Inquiries</h3>
                <p className="text-sm text-brand-muted">Questions & Feedback</p>
              </div>
            </div>
            <a 
              href="mailto:admin@phonezoo.com" 
              className="text-brand-orange hover:text-brand-orangeHover transition text-lg font-medium"
            >
              admin@phonezoo.com
            </a>
          </div>

          <div className="bg-bg-panel border border-bg-border rounded-2xl p-8 hover:border-brand-orange/40 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Send className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">DMCA & Legal</h3>
                <p className="text-sm text-brand-muted">Copyright Issues</p>
              </div>
            </div>
            <a 
              href="mailto:admin@phonezoo.com" 
              className="text-brand-orange hover:text-brand-orangeHover transition text-lg font-medium"
            >
              admin@phonezoo.com
            </a>
          </div>
        </div>

        {/* Response Time */}
        <section className="bg-gradient-to-r from-brand-orange/10 to-brand-orangeHover/10 border border-brand-orange/20 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-orange/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Response Time</h3>
              <p className="text-brand-text">
                We typically respond within <span className="text-brand-orange font-semibold">24-48 hours</span> during business days.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border-b border-bg-border pb-4">
              <h4 className="font-semibold text-white mb-2">How do I create an iPhone ringtone?</h4>
              <p className="text-sm">Upload your audio file, select the section you want (up to 30 seconds), choose M4R format, and download. Then sync with iTunes or use AirDrop.</p>
            </div>
            <div className="border-b border-bg-border pb-4">
              <h4 className="font-semibold text-white mb-2">Is Phonezoo really free?</h4>
              <p className="text-sm">Yes! Phonezoo is 100% free with no hidden charges, subscriptions, or premium features. All features are available to everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">What audio formats are supported?</h4>
              <p className="text-sm">We support MP3, WAV, M4A, OGG, and most common audio formats. You can export as MP3, M4R (iPhone), WAV, FLAC, AAC, or OGG.</p>
            </div>
          </div>
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
