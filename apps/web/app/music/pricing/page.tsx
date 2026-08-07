import type { Metadata } from 'next'
import PricingClient from '@/components/MusicPricingClient'

export const metadata: Metadata = {
  title: 'AI Music Generator Pricing - Plans & Features',
  description: 'Choose the right plan for AI music generation. Free tier, Pro ($4.99/mo) for more generations, Premium ($29.99/mo) for music with lyrics.',
}

export default function PricingPage() {
  return <PricingClient />
}
