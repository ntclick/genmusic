'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Crown,
  Rocket,
  Star,
  Gift,
  Check,
  X,
  Zap,
  Clock,
  Music,
  Shield,
  Info,
} from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'

type Plan = {
  id: string
  name: string
  price_usd: number
  stripe_price_id: string | null
  generations_per_day: number
  max_duration_seconds: number
  has_vocals: boolean
  has_priority: boolean
  features: string[]
  is_active: boolean
}

// Static plan data matching the database seed values.
// Plans should be modified directly in the Supabase Dashboard for safety.
const STATIC_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price_usd: 0,
    stripe_price_id: null,
    generations_per_day: 1,
    max_duration_seconds: 15,
    has_vocals: false,
    has_priority: false,
    features: [
      '1 generation per day',
      '15s max duration',
      'Instrumental only',
      'Standard quality',
    ],
    is_active: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    price_usd: 0,
    stripe_price_id: null,
    generations_per_day: 10,
    max_duration_seconds: 30,
    has_vocals: false,
    has_priority: false,
    features: [
      '10 generations per day',
      '30s max duration',
      'Instrumental only',
      'Standard quality',
      'Generation history',
    ],
    is_active: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price_usd: 4.99,
    stripe_price_id: null,
    generations_per_day: 50,
    max_duration_seconds: 30,
    has_vocals: false,
    has_priority: true,
    features: [
      '50 generations per day',
      '30s max duration',
      'Priority generation',
      'High quality audio',
      'Download in multiple formats',
    ],
    is_active: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price_usd: 29.99,
    stripe_price_id: null,
    generations_per_day: 200,
    max_duration_seconds: 60,
    has_vocals: true,
    has_priority: true,
    features: [
      '200 generations per day',
      '60s max duration',
      'Music with lyrics',
      'Priority generation',
      'Highest quality audio',
      'Commercial license',
    ],
    is_active: true,
  },
]

const PLAN_ICONS: Record<string, typeof CreditCard> = {
  free: Gift,
  starter: Rocket,
  pro: Star,
  premium: Crown,
}

const PLAN_COLORS: Record<string, { border: string; icon: string; badge: string }> = {
  free: {
    border: 'border-gray-700',
    icon: 'text-gray-400 bg-gray-500/15',
    badge: 'bg-gray-500/15 text-gray-400',
  },
  starter: {
    border: 'border-blue-800',
    icon: 'text-blue-400 bg-blue-500/15',
    badge: 'bg-blue-500/15 text-blue-400',
  },
  pro: {
    border: 'border-orange-800',
    icon: 'text-orange-400 bg-orange-500/15',
    badge: 'bg-orange-500/15 text-orange-400',
  },
  premium: {
    border: 'border-purple-800',
    icon: 'text-purple-400 bg-purple-500/15',
    badge: 'bg-purple-500/15 text-purple-400',
  },
}

export default function AdminPlansPage() {
  const [uid, setUid] = useState('')
  const [plans] = useState<Plan[]>(STATIC_PLANS)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (u) setUid(u.uid)
    })
    return () => unsub()
  }, [])

  if (!uid) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-sm text-gray-500 mt-1">
            View plan configurations. Edit plans directly in the Supabase Dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-600/30 rounded-lg">
          <Info size={14} className="text-yellow-400 shrink-0" />
          <span className="text-xs text-yellow-400">Read-only view</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || CreditCard
          const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.free

          return (
            <div
              key={plan.id}
              className={`bg-[#0f172a] border ${colors.border} rounded-xl p-5 flex flex-col`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">{plan.name}</h2>
                    <span className="text-xs text-gray-500 font-mono">{plan.id}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    plan.is_active
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Price */}
              <div className="mb-5">
                <span className="text-3xl font-black text-white">
                  {plan.price_usd === 0 ? 'Free' : `$${plan.price_usd}`}
                </span>
                {plan.price_usd > 0 && (
                  <span className="text-sm text-gray-500 ml-1">/month</span>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm">
                  <Zap size={14} className="text-yellow-400 shrink-0" />
                  <span className="text-gray-300">
                    <span className="font-bold text-white">{plan.generations_per_day}</span>{' '}
                    generations/day
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-blue-400 shrink-0" />
                  <span className="text-gray-300">
                    <span className="font-bold text-white">{plan.max_duration_seconds}s</span>{' '}
                    max duration
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Music size={14} className={plan.has_vocals ? 'text-green-400' : 'text-gray-600'} />
                  <span className={plan.has_vocals ? 'text-gray-300' : 'text-gray-600'}>
                    {plan.has_vocals ? 'Vocals enabled' : 'Instrumental only'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield
                    size={14}
                    className={plan.has_priority ? 'text-orange-400' : 'text-gray-600'}
                  />
                  <span className={plan.has_priority ? 'text-gray-300' : 'text-gray-600'}>
                    {plan.has_priority ? 'Priority queue' : 'Standard queue'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-800 my-3" />

              {/* Features */}
              <div className="flex-1">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Features
                </h3>
                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <Check size={12} className="text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stripe info */}
              <div className="mt-4 pt-3 border-t border-gray-800">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <CreditCard size={10} />
                  Stripe:{' '}
                  {plan.stripe_price_id ? (
                    <span className="font-mono text-gray-500">{plan.stripe_price_id}</span>
                  ) : (
                    <span className="italic">not linked</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary table */}
      <div className="mt-8 bg-[#0f172a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h2 className="text-sm font-bold text-gray-400 uppercase">Plan Comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase">
                <th className="text-left px-5 py-3 font-medium">Plan</th>
                <th className="text-center px-5 py-3 font-medium">Price</th>
                <th className="text-center px-5 py-3 font-medium">Gens/Day</th>
                <th className="text-center px-5 py-3 font-medium">Max Duration</th>
                <th className="text-center px-5 py-3 font-medium">Vocals</th>
                <th className="text-center px-5 py-3 font-medium">Priority</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {plans.map((plan) => {
                const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.free
                return (
                  <tr key={plan.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors.badge}`}>
                        {plan.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-white">
                      {plan.price_usd === 0 ? 'Free' : `$${plan.price_usd}`}
                    </td>
                    <td className="px-5 py-3 text-center text-white font-mono">
                      {plan.generations_per_day}
                    </td>
                    <td className="px-5 py-3 text-center text-white font-mono">
                      {plan.max_duration_seconds}s
                    </td>
                    <td className="px-5 py-3 text-center">
                      {plan.has_vocals ? (
                        <Check size={16} className="text-green-400 mx-auto" />
                      ) : (
                        <X size={16} className="text-gray-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {plan.has_priority ? (
                        <Check size={16} className="text-green-400 mx-auto" />
                      ) : (
                        <X size={16} className="text-gray-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          plan.is_active
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
