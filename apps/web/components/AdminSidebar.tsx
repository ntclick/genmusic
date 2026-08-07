'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Music, Users, CreditCard, ListMusic, LogOut } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tracks', label: 'Tracks', icon: Music },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/genres', label: 'Genres', icon: ListMusic },
]

export default function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-[#0b0f19] border-r border-gray-800 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <Link href="/admin" className="text-lg font-black text-white">
          Phone<span className="text-brand-orange">Zoo</span>
          <span className="text-xs text-gray-500 ml-1">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-brand-orange/15 text-brand-orange'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <Link href="/" className="block text-xs text-gray-500 hover:text-white transition mb-2 px-3">
          Back to site
        </Link>
        <button onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}
