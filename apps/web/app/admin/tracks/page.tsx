'use client'

import { useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'
import {
  Search,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Music,
  Loader2,
} from 'lucide-react'
import type { MusicGeneration } from '@/types/music'

const GENRES = [
  'pop', 'rock', 'edm', 'hiphop', 'lofi', 'classical',
  'jazz', 'ambient', 'funk', 'kpop', 'rnb', 'latin',
] as const

const STATUSES = ['all', 'completed', 'processing', 'failed'] as const

const PAGE_SIZE = 20

function statusBadge(status: string) {
  const map: Record<string, string> = {
    completed: 'bg-green-500/15 text-green-400',
    processing: 'bg-yellow-500/15 text-yellow-400',
    pending: 'bg-blue-500/15 text-blue-400',
    failed: 'bg-red-500/15 text-red-400',
  }
  return map[status] || 'bg-gray-500/15 text-gray-400'
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '--'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AdminTracksPage() {
  const [uid, setUid] = useState('')
  const [email, setEmail] = useState('')
  const [tracks, setTracks] = useState<MusicGeneration[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)

  // Filters
  const [status, setStatus] = useState('all')
  const [genre, setGenre] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Track which rows are toggling / deleting
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (u) { setUid(u.uid); setEmail(u.email || '') }
    })
    return () => unsub()
  }, [])

  const fetchTracks = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })
      if (status !== 'all') params.set('status', status)
      if (genre !== 'all') params.set('genre', genre)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/tracks?${params}`, {
        headers: { 'x-user-id': uid, 'x-user-email': email },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setTracks(json.data ?? [])
      setTotal(json.count ?? 0)
    } catch {
      setTracks([])
      setTotal(0)
    }
    setLoading(false)
  }, [uid, offset, status, genre, search])

  useEffect(() => {
    fetchTracks()
  }, [fetchTracks])

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0)
  }, [status, genre, search])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  const handleTogglePublic = async (track: MusicGeneration) => {
    setTogglingIds((prev) => new Set(prev).add(track.id))
    try {
      const res = await fetch('/api/admin/tracks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid, 'x-user-email': email,
        },
        body: JSON.stringify({ id: track.id, is_public: !track.is_public }),
      })
      if (res.ok) {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === track.id ? { ...t, is_public: !t.is_public } : t
          )
        )
      }
    } catch {
      // silently fail
    }
    setTogglingIds((prev) => {
      const next = new Set(prev)
      next.delete(track.id)
      return next
    })
  }

  const handleDelete = async (track: MusicGeneration) => {
    const label = track.title || track.prompt?.slice(0, 40) || track.id
    if (!confirm(`Delete track "${label}"? This cannot be undone.`)) return

    setDeletingIds((prev) => new Set(prev).add(track.id))
    try {
      const res = await fetch('/api/admin/tracks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid, 'x-user-email': email,
        },
        body: JSON.stringify({ id: track.id }),
      })
      if (res.ok) {
        setTracks((prev) => prev.filter((t) => t.id !== track.id))
        setTotal((prev) => prev - 1)
      }
    } catch {
      // silently fail
    }
    setDeletingIds((prev) => {
      const next = new Set(prev)
      next.delete(track.id)
      return next
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-500/15 text-orange-400">
          <Music size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Tracks</h1>
          <p className="text-sm text-gray-500">
            {total.toLocaleString()} total track{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 transition"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Genre */}
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-[#1e293b] border border-gray-700 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 transition"
          >
            <option value="all">All Genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="flex items-center flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title or prompt..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-[#1e293b] border border-gray-700 text-sm text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-orange-500 transition placeholder:text-gray-600"
              />
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="ml-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg transition"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-orange-400 animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Music size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No tracks found</p>
            <p className="text-xs text-gray-600 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Genre</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Engine</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold">Public</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr
                    key={track.id}
                    className="border-b border-gray-800/60 hover:bg-white/[0.02] transition"
                  >
                    {/* Title */}
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-white font-medium truncate">
                        {track.title || track.prompt?.slice(0, 50) || '--'}
                      </p>
                      {track.title && track.prompt && (
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {track.prompt.slice(0, 60)}
                        </p>
                      )}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-gray-300 text-xs truncate">{(track as any).user_name || 'Anonymous'}</p>
                        {(track as any).user_email && (
                          <p className="text-gray-600 text-[10px] truncate">{(track as any).user_email}</p>
                        )}
                      </div>
                    </td>

                    {/* Genre */}
                    <td className="px-4 py-3">
                      <span className="text-gray-300 capitalize">
                        {track.genre || '--'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadge(track.status)}`}
                      >
                        {track.status}
                      </span>
                    </td>

                    {/* Engine */}
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-xs">
                        {track.engine || '--'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-gray-400 tabular-nums">
                      {formatDuration(track.duration_seconds)}
                    </td>

                    {/* Public toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublic(track)}
                        disabled={togglingIds.has(track.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition ${
                          track.is_public
                            ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                            : 'bg-gray-500/15 text-gray-500 hover:bg-gray-500/25'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {togglingIds.has(track.id) ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : track.is_public ? (
                          <Eye size={12} />
                        ) : (
                          <EyeOff size={12} />
                        )}
                        {track.is_public ? 'Yes' : 'No'}
                      </button>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(track.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(track)}
                        disabled={deletingIds.has(track.id)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete track"
                      >
                        {deletingIds.has(track.id) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && tracks.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {offset + 1}&ndash;{Math.min(offset + PAGE_SIZE, total)} of{' '}
              {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                disabled={offset === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 bg-[#1e293b] border border-gray-700 rounded-lg hover:border-orange-500 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-400"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-xs text-gray-500 tabular-nums px-2">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                disabled={offset + PAGE_SIZE >= total}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 bg-[#1e293b] border border-gray-700 rounded-lg hover:border-orange-500 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-400"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
