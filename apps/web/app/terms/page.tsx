import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Phonezoo - Free Ringtone Maker',
  description: 'Read the Terms of Service for Phonezoo ringtone maker. Understand your rights and responsibilities when using our free online ringtone creation service.',
  keywords: ['terms of service', 'terms and conditions', 'phonezoo terms', 'user agreement', 'ringtone maker terms'],
  openGraph: {
    title: 'Terms of Service - Phonezoo',
    description: 'Terms and conditions for using Phonezoo free ringtone maker service.',
    type: 'website',
  },
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-lg text-brand-text">
            Last updated: December 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using Phonezoo (&quot;the Service&quot;), you accept and agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our service. We reserve 
              the right to modify these terms at any time, and your continued use of the Service constitutes 
              acceptance of any changes.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="leading-relaxed mb-4">
              Phonezoo runs in your browser. Your file is loaded directly into your device memory, processed locally (trim/convert), and downloaded back to you. We do not upload, store, or redistribute your content on our servers. Phonezoo provides a free online tool that allows users to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Upload audio files for personal ringtone creation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Edit and trim audio to create custom ringtones</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Convert audio to various formats (MP3, M4R, WAV, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Download created ringtones for personal use</span>
              </li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <p className="leading-relaxed mb-4">
              When using our Service, you agree to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
                <span>Only upload content you own or have rights to use</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
                <span>Use created ringtones for personal, non-commercial purposes only</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
                <span>Not distribute copyrighted content without authorization</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-brand-orange mt-0.5 shrink-0" />
                <span>Not use the Service for any illegal purposes</span>
              </li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
            <p className="leading-relaxed">
              You retain all rights to the content you upload. Phonezoo does not claim ownership of your 
              content. We do not store, copy, or access your files; all processing happens locally on your device. 
              However, you are solely responsible for ensuring you have the necessary rights to 
              use any audio content you upload. We respect intellectual property rights and comply with 
              the DMCA. See our <Link href="/dmca" className="text-brand-orange hover:underline">DMCA Policy</Link> for 
              more information.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Data Handling</h2>
            <p className="leading-relaxed">
              Audio files are processed locally on the user&apos;s device; we do not upload, store, cache, or retain your files. 
              No audio data is sent to our servers during editing or conversion.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Prohibited Uses</h2>
            <p className="leading-relaxed mb-4">
              You may NOT use the Service to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <span>Infringe on copyrights, trademarks, or other intellectual property</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <span>Upload malicious files or attempt to compromise our systems</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <span>Resell or commercially distribute ringtones created with our tool</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <span>Violate any applicable laws or regulations</span>
              </li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee 
              uninterrupted or error-free service. We are not responsible for any damages resulting from 
              your use of the Service or inability to use it.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Contact</h2>
            <p className="leading-relaxed">
              If you have questions about these Terms, please contact us at{' '}
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
