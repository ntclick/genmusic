'use client'

import Link from 'next/link'
import { useCookieConsent } from '@/contexts/CookieConsentContext'

export default function CookieConsentBanner() {
  const { consentStatus, acceptCookies, rejectCookies } = useCookieConsent()

  if (consentStatus !== 'undecided') return null

  return (
    <div className="fixed bottom-[90px] left-0 right-0 z-[150] px-4 pb-4 animate-in slide-in-from-bottom duration-300 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-bg-panel border border-bg-border rounded-2xl p-4 sm:p-5 shadow-2xl pointer-events-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-sm text-brand-text flex-1">
            We use cookies for analytics and to show relevant ads via Google AdSense.{' '}
            <Link href="/cookies" className="text-brand-orange hover:underline">
              Cookie Policy
            </Link>
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={rejectCookies}
              className="px-4 py-2 text-sm border border-bg-border text-brand-text rounded-lg hover:bg-white/5 transition"
            >
              Reject
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 text-sm bg-brand-orange hover:bg-brand-orangeHover text-white rounded-lg font-medium transition"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
