import { Metadata } from 'next'
import Link from 'next/link'
import { Lock, Eye, Database, Cookie, Shield, UserCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Phonezoo - Free Ringtone Maker',
  description: 'Read the Privacy Policy for Phonezoo. Learn how we protect your data and privacy when using our free online ringtone maker. No data collection, 100% secure.',
  keywords: ['privacy policy', 'data protection', 'phonezoo privacy', 'secure ringtone maker', 'no data collection'],
  openGraph: {
    title: 'Privacy Policy - Phonezoo',
    description: 'Your privacy matters. Learn how Phonezoo protects your data with local browser processing.',
    type: 'website',
  },
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-lg text-brand-text">
            Last updated: March 2026
          </p>
        </div>

        {/* Privacy Highlight */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Privacy First</h3>
              <p className="text-brand-text">
                Your audio files are processed <span className="text-green-500 font-semibold">100% locally</span> in your browser. 
                We never upload, store, cache, or access your files on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
            </div>
            <p className="leading-relaxed mb-4">
              Phonezoo is designed with privacy as a core principle. Here&apos;s what we collect:
            </p>
            <div className="space-y-4">
              <div className="bg-bg-main border border-bg-border rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">Audio Files</h4>
                <p className="text-sm">
                  <span className="text-green-500 font-semibold">NOT collected.</span> All audio processing happens 
                  entirely in your browser using Web Audio API. Your files never leave your device and are not uploaded to our servers.
                </p>
              </div>
              <div className="bg-bg-main border border-bg-border rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">Personal Information</h4>
                <p className="text-sm">
                  <span className="text-green-500 font-semibold">NOT collected.</span> We don&apos;t require registration, 
                  login, or any personal information to use our service.
                </p>
              </div>
              <div className="bg-bg-main border border-bg-border rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">Usage Analytics</h4>
                <p className="text-sm">
                  We may collect anonymous, aggregated usage statistics to improve our service. 
                  This includes page views and general usage patterns, but never personal data.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">How We Process Your Data</h2>
            </div>
            <p className="leading-relaxed mb-4">
              When you use Phonezoo to create a ringtone:
            </p>
            <ol className="space-y-3 list-decimal list-inside">
              <li>Your audio file is loaded directly into your browser&apos;s memory</li>
              <li>Audio processing (trimming, format conversion) happens locally using Web Audio API</li>
              <li>The processed file is downloaded directly to your device</li>
              <li>No data is ever sent to our servers</li>
            </ol>
            <p className="mt-4 text-sm text-brand-muted">
              This means we cannot access your audio files - they exist only on your device during editing and are not retained.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Cookies</h2>
            </div>
            <p className="leading-relaxed">
              We use cookies for functionality, analytics, and advertising:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong>Essential cookies:</strong> Required for the website to function properly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong>Analytics cookies:</strong> Google Analytics helps us understand how visitors use our site</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong>Advertising cookies:</strong> Google AdSense uses cookies to display relevant ads. These may track browsing activity across websites</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-brand-muted">
              Analytics and advertising cookies are only loaded after you accept via the cookie consent banner.
              We do not sell any data to third parties. For full details, see our{' '}
              <Link href="/cookies" className="text-brand-orange hover:underline">Cookie Policy</Link>.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Your Rights</h2>
            </div>
            <p className="leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Use our service without providing any personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Disable cookies in your browser settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Request information about any data we may have</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Contact us with any privacy concerns</span>
              </li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <p className="leading-relaxed mb-4">
              We use the following third-party services, each with their own privacy policies:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong className="text-white">Google Analytics</strong> &mdash; Anonymous website traffic analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong className="text-white">Google Tag Manager</strong> &mdash; Tag management for analytics events</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong className="text-white">Google AdSense</strong> &mdash; Advertising display (loaded only with consent)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong className="text-white">Supabase</strong> &mdash; Database and backend services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong className="text-white">Shelby (ShelbyNet)</strong> &mdash; Decentralized audio file storage and delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange">•</span>
                <span><strong className="text-white">Ezoic</strong> &mdash; Personalization and advertising platform</span>
              </li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Ad Disclosure & Cookie Consent (Ezoic)</h2>
            <p className="leading-relaxed mb-4">
              We partner with Ezoic to manage ads and personalization on our website. Ezoic and its partners use cookies and process personal data to personalize ads, analyze traffic, and improve performance.
            </p>
            <div className="bg-bg-main border border-bg-border rounded-xl p-4 overflow-auto max-h-[500px]">
              <span id="ezoic-privacy-policy-embed"></span>
            </div>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:admin@phonezoo.com" className="text-brand-orange hover:underline">
                admin@phonezoo.com
              </a>
            </p>
          </section>
        </div>

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
