import { NextRequest, NextResponse } from 'next/server'
import { generateLyrics } from '@/lib/music-lyrics-writer'

export async function POST(req: NextRequest) {
  let body: { description?: string; genre?: string; duration?: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { description = '', genre = 'pop', duration = 30 } = body
  if (!description.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  try {
    const lyrics = await generateLyrics(description.trim(), genre, duration)
    return NextResponse.json({ lyrics })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate lyrics' }, { status: 500 })
  }
}
