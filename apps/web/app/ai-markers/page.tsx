'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function AIMarkersRedirectPage() {
  useEffect(() => {
    redirect('/maker#ai-markers')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main text-white">
      <p className="text-sm text-gray-300">Redirecting to AI Markers...</p>
    </div>
  )
}
