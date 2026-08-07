'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ListMusic,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'

type Genre = {
  id: string
  name: string
  description: string | null
  prompt_template: string
  icon: string | null
  sort_order: number
}

type GenreForm = {
  id: string
  name: string
  description: string
  prompt_template: string
  icon: string
  sort_order: number
}

const EMPTY_FORM: GenreForm = {
  id: '',
  name: '',
  description: '',
  prompt_template: '',
  icon: '',
  sort_order: 0,
}

export default function AdminGenresPage() {
  const [uid, setUid] = useState('')
  const [email, setEmail] = useState('')
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GenreForm>(EMPTY_FORM)

  // New genre form state
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<GenreForm>(EMPTY_FORM)

  // Saving / deleting indicators
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      if (u) { setUid(u.uid); setEmail(u.email || '') }
    })
    return () => unsub()
  }, [])

  const fetchGenres = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/genres', {
        headers: { 'x-user-id': uid, 'x-user-email': email },
      })
      if (!res.ok) throw new Error('Failed to fetch genres')
      const json = await res.json()
      setGenres(json.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load genres')
    }
    setLoading(false)
  }, [uid, email])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  // ── Edit handlers ────────────────────────────────────────────────────

  const startEdit = (genre: Genre) => {
    setEditingId(genre.id)
    setEditForm({
      id: genre.id,
      name: genre.name,
      description: genre.description || '',
      prompt_template: genre.prompt_template,
      icon: genre.icon || '',
      sort_order: genre.sort_order,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(EMPTY_FORM)
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/genres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid, 'x-user-email': email },
        body: JSON.stringify({
          id: editingId,
          name: editForm.name,
          description: editForm.description || null,
          prompt_template: editForm.prompt_template,
          icon: editForm.icon || null,
          sort_order: editForm.sort_order,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to update genre')
      }
      setEditingId(null)
      setEditForm(EMPTY_FORM)
      await fetchGenres()
    } catch (err: any) {
      setError(err.message || 'Save failed')
    }
    setSaving(false)
  }

  // ── Add handlers ─────────────────────────────────────────────────────

  const saveNew = async () => {
    if (!addForm.id || !addForm.name || !addForm.prompt_template) {
      setError('ID, name, and prompt template are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid, 'x-user-email': email },
        body: JSON.stringify({
          id: addForm.id,
          name: addForm.name,
          description: addForm.description || null,
          prompt_template: addForm.prompt_template,
          icon: addForm.icon || null,
          sort_order: addForm.sort_order,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to create genre')
      }
      setShowAdd(false)
      setAddForm(EMPTY_FORM)
      await fetchGenres()
    } catch (err: any) {
      setError(err.message || 'Create failed')
    }
    setSaving(false)
  }

  // ── Delete handler ───────────────────────────────────────────────────

  const deleteGenre = async (id: string) => {
    if (!confirm(`Delete genre "${id}"? This cannot be undone.`)) return
    setDeletingId(id)
    setError('')
    try {
      const res = await fetch('/api/admin/genres', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid, 'x-user-email': email },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to delete genre')
      }
      if (editingId === id) cancelEdit()
      await fetchGenres()
    } catch (err: any) {
      setError(err.message || 'Delete failed')
    }
    setDeletingId(null)
  }

  // ── Render helpers ───────────────────────────────────────────────────

  const renderFormFields = (
    form: GenreForm,
    setForm: (f: GenreForm) => void,
    showId: boolean,
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {showId && (
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1">
            ID (slug, lowercase)
          </label>
          <input
            type="text"
            value={form.id}
            onChange={(e) =>
              setForm({
                ...form,
                id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              })
            }
            placeholder="e.g. synthwave"
            className="w-full bg-[#020617] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition"
          />
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 font-medium mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Synthwave"
          className="w-full bg-[#020617] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 font-medium mb-1">Icon (emoji)</label>
        <input
          type="text"
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
          placeholder="e.g. 🎹"
          className="w-full bg-[#020617] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 font-medium mb-1">Sort Order</label>
        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          className="w-full bg-[#020617] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 font-medium mb-1">Description</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description of this genre"
          className="w-full bg-[#020617] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 font-medium mb-1">
          Prompt Template
        </label>
        <textarea
          value={form.prompt_template}
          onChange={(e) => setForm({ ...form, prompt_template: e.target.value })}
          rows={3}
          placeholder="AI prompt template for this genre..."
          className="w-full bg-[#020617] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition resize-y"
        />
      </div>
    </div>
  )

  // ── Main render ──────────────────────────────────────────────────────

  if (!uid) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Genres</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage music generation genres and prompt templates
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(!showAdd)
            setAddForm({ ...EMPTY_FORM, sort_order: genres.length + 1 })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-brand-orangeHover text-white rounded-lg text-sm font-bold transition"
        >
          <Plus size={16} />
          Add Genre
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-600/30 rounded-lg text-sm text-red-400">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto hover:text-red-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add new genre form */}
      {showAdd && (
        <div className="bg-[#0f172a] border border-green-800/50 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold text-green-400 uppercase mb-4 flex items-center gap-2">
            <Plus size={14} /> New Genre
          </h2>
          {renderFormFields(addForm, setAddForm, true)}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={saveNew}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Create Genre
            </button>
            <button
              onClick={() => {
                setShowAdd(false)
                setAddForm(EMPTY_FORM)
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-brand-orange animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && genres.length === 0 && (
        <div className="text-center py-20">
          <ListMusic size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No genres found</p>
          <p className="text-xs text-gray-600 mt-1">Click &ldquo;Add Genre&rdquo; to create one</p>
        </div>
      )}

      {/* Genres list */}
      {!loading && genres.length > 0 && (
        <div className="space-y-3">
          {genres.map((genre) => {
            const isEditing = editingId === genre.id
            const isDeleting = deletingId === genre.id

            return (
              <div
                key={genre.id}
                className={`bg-[#0f172a] border rounded-xl transition ${
                  isEditing ? 'border-brand-orange/50' : 'border-gray-800'
                }`}
              >
                {/* Genre row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Sort order indicator */}
                  <div className="flex items-center gap-1 text-gray-600 shrink-0">
                    <GripVertical size={14} />
                    <span className="text-xs font-mono w-5 text-center">
                      {genre.sort_order}
                    </span>
                  </div>

                  {/* Icon */}
                  <span className="text-2xl w-8 text-center shrink-0">
                    {genre.icon || '🎵'}
                  </span>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{genre.name}</span>
                      <span className="text-xs font-mono text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                        {genre.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {genre.description || 'No description'}
                    </p>
                  </div>

                  {/* Prompt preview */}
                  <div className="hidden lg:block flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate font-mono">
                      {genre.prompt_template}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => (isEditing ? cancelEdit() : startEdit(genre))}
                      className={`p-2 rounded-lg transition ${
                        isEditing
                          ? 'bg-brand-orange/15 text-brand-orange'
                          : 'text-gray-500 hover:text-white hover:bg-gray-800'
                      }`}
                      title={isEditing ? 'Cancel editing' : 'Edit genre'}
                    >
                      {isEditing ? <ChevronUp size={16} /> : <Pencil size={16} />}
                    </button>
                    <button
                      onClick={() => deleteGenre(genre.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                      title="Delete genre"
                    >
                      {isDeleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded edit form */}
                {isEditing && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-800">
                    {renderFormFields(editForm, setEditForm, false)}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-50 text-white rounded-lg text-sm font-bold transition"
                      >
                        {saving ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Count */}
      {!loading && genres.length > 0 && (
        <p className="text-xs text-gray-600 mt-4 text-right">
          {genres.length} genre{genres.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
