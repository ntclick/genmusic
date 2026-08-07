'use client'

import { useEffect, useState } from 'react'
import { Music, Users, CreditCard, Zap, TrendingUp } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'

type Stats = {
  totalTracks: number
  totalUsers: number
  activeSubscriptions: number
  generationsToday: number
  recentTracks: any[]
  recentUsers: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [uid, setUid] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (u) { setUid(u.uid); setEmail(u.email || '') }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!uid) return
    fetch('/api/admin/stats', { headers: { 'x-user-id': uid, 'x-user-email': email } })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [uid])

  if (!stats) return <div className="text-gray-500">Loading...</div>

  const cards = [
    { label: 'Total Tracks', value: stats.totalTracks, icon: Music, color: 'text-orange-400 bg-orange-500/15' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400 bg-blue-500/15' },
    { label: 'Active Subs', value: stats.activeSubscriptions, icon: CreditCard, color: 'text-green-400 bg-green-500/15' },
    { label: 'Gens Today', value: stats.generationsToday, icon: Zap, color: 'text-purple-400 bg-purple-500/15' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{c.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-black">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tracks */}
        <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Recent Tracks
          </h2>
          <div className="space-y-3">
            {stats.recentTracks.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-white truncate font-medium">{t.title || t.prompt?.slice(0, 40)}</p>
                  <p className="text-xs text-gray-500">
                    {t.user_name || 'Anonymous'} &middot; {t.genre} &middot; {t.engine}
                  </p>
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.status === 'completed' ? 'bg-green-500/15 text-green-400' :
                  t.status === 'failed' ? 'bg-red-500/15 text-red-400' :
                  'bg-yellow-500/15 text-yellow-400'
                }`}>{t.status}</span>
              </div>
            ))}
            {stats.recentTracks.length === 0 && <p className="text-gray-600 text-sm">No tracks yet</p>}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
            <Users size={14} /> Recent Users
          </h2>
          <div className="space-y-3">
            {stats.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-white truncate font-medium">{u.name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                  u.role === 'admin' ? 'bg-orange-500/15 text-orange-400' : 'bg-gray-500/15 text-gray-400'
                }`}>{u.role || 'user'}</span>
              </div>
            ))}
            {stats.recentUsers.length === 0 && <p className="text-gray-600 text-sm">No users yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
