'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'
import {
  Search,
  Shield,
  Crown,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  X,
} from 'lucide-react'

type UserRow = {
  id: string
  firebase_uid: string
  name: string | null
  email: string
  role: string
  plan_id: string | null
  created_at: string
}

const LIMIT = 20

export default function AdminUsersPage() {
  const [uid, setUid] = useState('')
  const [email, setEmail] = useState('')
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (u) { setUid(u.uid); setEmail(u.email || '') }
    })
    return () => unsub()
  }, [])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
      })
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { 'x-user-id': uid, 'x-user-email': email },
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.data ?? [])
      setTotal(data.count ?? 0)
    } catch {
      setUsers([])
      setTotal(0)
    }
    setLoading(false)
  }, [uid, page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(0)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      // fetchUsers triggered by search state change via useEffect
    }, 300)
  }

  // Actions
  async function patchUser(body: Record<string, string>) {
    setActionLoading(body.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid, 'x-user-email': email,
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Action failed')
      await fetchUsers()
    } catch {
      // silently fail
    }
    setActionLoading(null)
    setOpenMenu(null)
  }

  function changeRole(id: string, role: 'admin' | 'user') {
    patchUser({ id, action: 'change_role', role })
  }

  function assignPlan(id: string, firebase_uid: string, plan_id: 'pro' | 'premium' | 'starter') {
    patchUser({ id, firebase_uid, action: 'assign_plan', plan_id })
  }

  function cancelPlan(id: string, firebase_uid: string) {
    patchUser({ id, firebase_uid, action: 'cancel_plan' })
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          Users
          {!loading && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              {total.toLocaleString()} total
            </span>
          )}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-9 py-2.5 bg-[#0f172a] border border-gray-800 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600 transition"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(0) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-gray-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'No users match your search.' : 'No users found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase text-gray-500">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-800/50 hover:bg-white/[0.02] transition"
                  >
                    {/* Name */}
                    <td className="px-5 py-3 font-medium text-white">
                      {u.name || <span className="text-gray-600">Unnamed</span>}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3 text-gray-400">{u.email}</td>

                    {/* Role badge */}
                    <td className="px-5 py-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-400">
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/15 text-gray-400">
                          User
                        </span>
                      )}
                    </td>

                    {/* Plan badge */}
                    <td className="px-5 py-3">
                      {u.plan_id === 'premium' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-400">
                          <Crown size={12} /> Premium
                        </span>
                      ) : u.plan_id === 'pro' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-400">
                          Pro
                        </span>
                      ) : u.plan_id === 'starter' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-400">
                          Starter
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-600">Free</span>
                      )}
                    </td>

                    {/* Created date */}
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block" ref={openMenu === String(u.id) ? menuRef : undefined}>
                        <button
                          onClick={() => setOpenMenu(openMenu === String(u.id) ? null : String(u.id))}
                          disabled={actionLoading === String(u.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition disabled:opacity-40"
                        >
                          {actionLoading === String(u.id) ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <UserCog size={14} />
                          )}
                          Manage
                        </button>

                        {openMenu === String(u.id) && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-[#1a2236] border border-gray-700 rounded-xl shadow-2xl z-50 py-1 text-left">
                            {/* Role section */}
                            <div className="px-3 pt-2 pb-1">
                              <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">
                                Change Role
                              </p>
                            </div>
                            <button
                              onClick={() => changeRole(String(u.id), 'admin')}
                              disabled={u.role === 'admin'}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Shield size={13} className="text-orange-400" />
                              Set as Admin
                            </button>
                            <button
                              onClick={() => changeRole(String(u.id), 'user')}
                              disabled={u.role === 'user' || !u.role}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <UserCog size={13} className="text-gray-400" />
                              Set as User
                            </button>

                            <div className="border-t border-gray-700/50 my-1" />

                            {/* Plan section */}
                            <div className="px-3 pt-2 pb-1">
                              <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">
                                Assign Plan
                              </p>
                            </div>
                            <button
                              onClick={() => assignPlan(String(u.id), u.firebase_uid, 'starter')}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white transition"
                            >
                              <Crown size={13} className="text-gray-400" />
                              Starter
                            </button>
                            <button
                              onClick={() => assignPlan(String(u.id), u.firebase_uid, 'pro')}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white transition"
                            >
                              <Crown size={13} className="text-blue-400" />
                              Pro
                            </button>
                            <button
                              onClick={() => assignPlan(String(u.id), u.firebase_uid, 'premium')}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white transition"
                            >
                              <Crown size={13} className="text-purple-400" />
                              Premium
                            </button>

                            <div className="border-t border-gray-700/50 my-1" />

                            <button
                              onClick={() => cancelPlan(String(u.id), u.firebase_uid)}
                              disabled={!u.plan_id}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-red-500/10 flex items-center gap-2 text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <X size={13} />
                              Cancel Plan
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">
            Showing {page * LIMIT + 1}&ndash;{Math.min((page + 1) * LIMIT, total)} of{' '}
            {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <span className="text-gray-500 text-xs px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
