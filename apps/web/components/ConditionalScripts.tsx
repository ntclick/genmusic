'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useCookieConsent } from '@/contexts/CookieConsentContext'

export default function ConditionalScripts() {
  const { hasConsent } = useCookieConsent()
  const pathname = usePathname()

  // Dynamic Content: Refresh Ezoic ads on client-side route transitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const ez = window.ezstandalone;
      if (ez && typeof ez.destroyAll === 'function' && typeof ez.showAds === 'function') {
        try {
          ez.cmd.push(function () {
            ez.destroyAll();
            ez.showAds();
          });
        } catch (err) {
          console.warn('[Ezoic] Failed to refresh ads on transition:', err);
        }
      }
    }
  }, [pathname])

  if (!hasConsent) return null

  return (
    <>
      {/* Google Analytics (gtag.js) */}
      <Script
        id="ga-script"
        src="https://www.googletagmanager.com/gtag/js?id=G-C4C96X9H55"
        strategy="afterInteractive"
      />
      <Script id="ga-inline" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-C4C96X9H55');
        `}
      </Script>

      {/* Google Tag Manager */}
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-MR5RX5TF');`}
      </Script>

      {/* AdSense - loaded only after cookie consent.
          lazyOnload rather than afterInteractive: afterInteractive makes Next
          emit a <link rel="preload"> without crossorigin, which does not match
          this tag's crossOrigin="anonymous", so the preload is discarded and the
          browser warns. Ads should not compete with interaction anyway. */}
      <Script
        id="adsense-init"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5132863470187102"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
    </>
  )
}

