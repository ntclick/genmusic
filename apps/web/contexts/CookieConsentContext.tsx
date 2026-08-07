'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type ConsentStatus = 'undecided' | 'accepted' | 'rejected'

interface CookieConsentContextType {
  consentStatus: ConsentStatus
  hasConsent: boolean
  acceptCookies: () => void
  rejectCookies: () => void
}

const STORAGE_KEY = 'phonezoo_cookie_consent'

const CookieConsentContext = createContext<CookieConsentContextType>({
  consentStatus: 'undecided',
  hasConsent: false,
  acceptCookies: () => {},
  rejectCookies: () => {},
})

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('undecided')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.consent === 'accepted' || parsed.consent === 'rejected') {
          setConsentStatus(parsed.consent)
        }
      }
    } catch {}
  }, [])

  const acceptCookies = useCallback(() => {
    setConsentStatus('accepted')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ consent: 'accepted', timestamp: Date.now() }))
    } catch {}
  }, [])

  const rejectCookies = useCallback(() => {
    setConsentStatus('rejected')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ consent: 'rejected', timestamp: Date.now() }))
    } catch {}
  }, [])

  return (
    <CookieConsentContext.Provider value={{
      consentStatus,
      hasConsent: consentStatus === 'accepted',
      acceptCookies,
      rejectCookies,
    }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  return useContext(CookieConsentContext)
}
