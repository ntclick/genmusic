'use client'

import { useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'
import AdminSidebar from '@/components/AdminSidebar'
import { Loader2, ShieldAlert, LogIn } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u)
      setLoading(false)

      if (u) {
        setChecking(true)
        // Sync user to DB first
        fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }),
        }).catch(() => {})

        try {
          const res = await fetch('/api/admin/stats', {
            headers: { 'x-user-id': u.uid, 'x-user-email': u.email || '' },
          })
          setIsAdmin(res.ok)
        } catch {
          setIsAdmin(false)
        }
        setChecking(false)
      } else {
        setIsAdmin(false)
      }
    })
    return () => unsub()
  }, [])

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(firebaseAuth, provider)
  }

  const handleLogout = async () => {
    await signOut(firebaseAuth)
    setIsAdmin(false)
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 size={32} className="text-brand-orange animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Login</h1>
          <p className="text-gray-400 mb-6">Sign in with your admin account</p>
          <button onClick={handleLogin}
            className="flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-brand-orangeHover text-white rounded-xl font-bold transition mx-auto">
            <LogIn size={18} /> Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">You don&apos;t have admin privileges.</p>
          <p className="text-gray-500 text-sm mb-6">{user.email}</p>
          <button onClick={handleLogout}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#020617] text-white">
      <AdminSidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
