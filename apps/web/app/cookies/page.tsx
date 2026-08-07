import { Metadata } from 'next'
import Link from 'next/link'
import { Cookie, Shield, Settings, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy | Phonezoo - Free Ringtone Maker',
  description: 'Learn about the cookies used on Phonezoo, including essential, analytics, and advertising cookies. Manage your cookie preferences.',
  alternates: {
    canonical: '/cookies',
  },
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cookie className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Cookie Policy</h1>
          <p className="text-lg text-brand-text">Last updated: March 2026</p>
        </div>

        <div className="space-y-8">
          {/* What Are Cookies */}
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
            <p className="leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help websites
              remember your preferences, understand how you use the site, and deliver relevant advertising.
              Cookies can be &quot;first-party&quot; (set by the website you visit) or &quot;third-party&quot; (set by external services
              like analytics or advertising providers).
            </p>
          </section>

          {/* Cookies We Use */}
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Cookies We Use</h2>
            </div>

            <div className="space-y-6">
              {/* Essential */}
              <div className="bg-bg-main border border-bg-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded">Required</span>
                  <h3 className="font-bold text-white">Essential Cookies</h3>
                </div>
                <p className="text-sm mb-3">
                  These cookies are necessary for the website to function. They cannot be disabled.
                </p>
                <div className="text-sm space-y-1 text-brand-muted">
                  <p><strong className="text-brand-text">phonezoo_cookie_consent</strong> &mdash; Stores your cookie preference (localStorage)</p>
                  <p><strong className="text-brand-text">Session cookies</strong> &mdash; Maintain site functionality during your visit</p>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-bg-main border border-bg-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">Analytics</span>
                  <h3 className="font-bold text-white">Analytics Cookies</h3>
                </div>
                <p className="text-sm mb-3">
                  Help us understand how visitors interact with our website. These cookies collect anonymous,
                  aggregated data and are only loaded after you accept cookies.
                </p>
                <div className="text-sm space-y-1 text-brand-muted">
                  <p><strong className="text-brand-text">_ga, _ga_*</strong> &mdash; Google Analytics: measures page views, sessions, and traffic sources</p>
                  <p><strong className="text-brand-text">_gid</strong> &mdash; Google Analytics: distinguishes users (expires after 24 hours)</p>
                  <p><strong className="text-brand-text">_gcl_*</strong> &mdash; Google Tag Manager: tag management and event tracking</p>
                </div>
              </div>

              {/* Advertising */}
              <div className="bg-bg-main border border-bg-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded">Advertising</span>
                  <h3 className="font-bold text-white">Advertising Cookies</h3>
                </div>
                <p className="text-sm mb-3">
                  Used by Google AdSense to display relevant advertisements. These cookies may track your
                  browsing activity across websites to build a profile of your interests. They are only
                  loaded after you accept cookies.
                </p>
                <div className="text-sm space-y-1 text-brand-muted">
                  <p><strong className="text-brand-text">__gads, __gpi</strong> &mdash; Google AdSense: ad personalization and frequency capping</p>
                  <p><strong className="text-brand-text">IDE, DSID</strong> &mdash; Google DoubleClick: ad serving and conversion tracking</p>
                  <p><strong className="text-brand-text">NID, CONSENT</strong> &mdash; Google: preferences and consent state</p>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
            <p className="leading-relaxed mb-4">
              The following third-party services may set cookies when you accept:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-brand-orange mt-1">&#8226;</span>
                <span><strong className="text-white">Google Analytics</strong> &mdash; Website traffic analysis.{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Privacy Policy</a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange mt-1">&#8226;</span>
                <span><strong className="text-white">Google Tag Manager</strong> &mdash; Tag management for analytics events.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-orange mt-1">&#8226;</span>
                <span><strong className="text-white">Google AdSense</strong> &mdash; Advertising display.{' '}
                  <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">How Google uses cookies in advertising</a>
                </span>
              </li>
            </ul>
          </section>

          {/* Managing Preferences */}
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Managing Your Preferences</h2>
            </div>
            <div className="space-y-4">
              <p className="leading-relaxed">
                When you first visit Phonezoo, a cookie consent banner appears at the bottom of the page.
                You can choose to accept or reject non-essential cookies.
              </p>
              <div className="bg-bg-main border border-bg-border rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">To reset your cookie preferences:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Open your browser&apos;s Developer Tools (F12)</li>
                  <li>Go to Application &gt; Local Storage</li>
                  <li>Delete the <code className="bg-bg-border px-1.5 py-0.5 rounded text-xs">phonezoo_cookie_consent</code> entry</li>
                  <li>Refresh the page &mdash; the consent banner will reappear</li>
                </ol>
              </div>
              <p className="text-sm text-brand-muted">
                You can also control cookies through your browser settings. Note that disabling all cookies
                may affect website functionality.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-bg-panel border border-bg-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-white">Contact Us</h2>
            </div>
            <p className="leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="mailto:admin@phonezoo.com" className="text-brand-orange hover:underline">
                admin@phonezoo.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-brand-orange hover:text-brand-orangeHover transition">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
