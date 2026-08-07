import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Mail, FileWarning, Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: 'DMCA Takedown Policy | Phonezoo - Free Ringtone Maker',
  description: 'DMCA Digital Millennium Copyright Act policy and takedown procedures for Phonezoo. Learn how to submit copyright infringement claims and our response process.',
  keywords: ['DMCA', 'copyright', 'takedown', 'phonezoo', 'ringtone maker', 'copyright policy'],
  openGraph: {
    title: 'DMCA Takedown Policy - Phonezoo',
    description: 'Learn about our DMCA copyright policy and how to submit takedown requests for copyrighted content.',
    type: 'website',
  },
  alternates: {
    canonical: '/dmca',
  },
}

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">DMCA Takedown Policy</h1>
          <p className="text-lg text-brand-text">
            Digital Millennium Copyright Act Compliance
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Our Commitment</h2>
            </div>
            <p className="leading-relaxed">
              Phonezoo respects the intellectual property rights of others and expects users to do the same. 
              We comply with the Digital Millennium Copyright Act (DMCA) and will respond promptly to claims 
              of copyright infringement committed using our service.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <FileWarning className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Nature of Our Service</h2>
            </div>
            <p className="leading-relaxed">
              Phonezoo is a browser-based audio editing, trimming, and conversion tool. We do not store,
              cache, or redistribute any content uploaded by users. All audio processing occurs locally
              in the user&apos;s browser or temporarily on our servers solely to return the processed file
              to the same user. All original content remains the property of the user, and users are
              responsible for ensuring they have the rights to any audio they upload or edit.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <FileWarning className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Filing a DMCA Notice</h2>
            </div>
            <p className="leading-relaxed mb-4">
              If you believe that your copyrighted work has been copied in a way that constitutes 
              copyright infringement, please provide our DMCA Agent with the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A physical or electronic signature of the copyright owner or authorized agent</li>
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the material that is claimed to be infringing</li>
              <li>Your contact information (address, telephone number, email)</li>
              <li>A statement that you have a good faith belief that the use is not authorized</li>
              <li>A statement that the information is accurate, under penalty of perjury</li>
            </ul>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Contact Information</h2>
            </div>
            <p className="leading-relaxed mb-4">
              Send your DMCA notices to our designated agent:
            </p>
            <div className="bg-bg-main border border-bg-border rounded-xl p-6">
              <p className="font-semibold text-white mb-2">DMCA Agent</p>
              <p>Email: <a href="mailto:admin@phonezoo.com" className="text-brand-orange hover:underline">admin@phonezoo.com</a></p>
              <p className="mt-4 text-sm text-brand-muted">
                We will respond to all valid DMCA notices within 48-72 hours.
              </p>
            </div>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Counter-Notification</h2>
            <p className="leading-relaxed">
              If you believe your content was removed in error, you may file a counter-notification 
              containing: your signature, identification of the removed material, a statement under 
              penalty of perjury that you believe the removal was a mistake, and your consent to 
              jurisdiction. Counter-notifications should be sent to the same email address above.
            </p>
          </section>

          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Repeat Infringers</h2>
            <p className="leading-relaxed">
              In accordance with the DMCA, we will terminate the accounts of users who are determined 
              to be repeat infringers in appropriate circumstances.
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
