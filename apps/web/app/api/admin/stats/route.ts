import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminStats, getRecentTracks, getRecentUsers } from '@/lib/admin-storage'

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req.headers.get('x-user-id'), req.headers.get('x-user-email'))
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const [stats, recentTracks, recentUsers] = await Promise.all([
    getAdminStats(),
    getRecentTracks(5),
    getRecentUsers(5),
  ])

  return NextResponse.json({ ...stats, recentTracks, recentUsers })
}
