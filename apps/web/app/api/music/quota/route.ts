import { NextRequest, NextResponse } from 'next/server'
import { getUserQuota } from '@/lib/music-storage'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || null

  // For anonymous users, use IP as quota identifier (same as generate route)
  let quotaIdentifier: string | undefined
  if (!userId) {
    const ip =
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    quotaIdentifier = `ip:${ip}`
  }

  const quota = await getUserQuota(userId, quotaIdentifier)
  return NextResponse.json(quota, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
