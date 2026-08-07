/**
 * Client-side API helpers for music generation.
 */
import type { GenerateRequest, GenerateResponse, StatusResponse, QuotaResponse } from '@/types/music'

function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('phonezoo_user_id')
}

function getAuthHeaders(): Record<string, string> {
  const userId = getUserId()
  return userId ? { 'x-user-id': userId } : {}
}

export async function submitMusicGeneration(request: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch('/api/music/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }

  return res.json()
}

export async function pollMusicStatus(jobId: string): Promise<StatusResponse> {
  const res = await fetch(`/api/music/status/${jobId}?_t=${Date.now()}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Status check failed: ${res.status}`)
  }

  return res.json()
}

export async function fetchQuota(): Promise<QuotaResponse> {
  const res = await fetch('/api/music/quota', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    throw new Error('Failed to fetch quota')
  }

  return res.json()
}

export async function enhancePromptWithAI(description: string, genre?: string, lyrics?: string): Promise<string> {
  const res = await fetch('/api/music/ai-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, genre, lyrics }),
  })

  if (!res.ok) throw new Error('AI enhancement failed')
  const data = await res.json()
  return data.prompt || description
}

export async function fetchUserTracks(): Promise<any[]> {
  const res = await fetch('/api/music/tracks?limit=50&offset=0', {
    cache: 'no-store',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch tracks')
  const data = await res.json()
  return data.data || []
}

export async function updateTrack(
  id: string,
  updates: { title?: string; description?: string; is_public?: boolean }
): Promise<void> {
  const res = await fetch(`/api/music/tracks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Update failed')
  }
}

export async function deleteTrack(id: string): Promise<void> {
  const res = await fetch(`/api/music/tracks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Delete failed')
  }
}

export async function startCheckout(planId: string): Promise<string> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ plan_id: planId }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Checkout failed')
  }

  const data = await res.json()
  return data.url
}
