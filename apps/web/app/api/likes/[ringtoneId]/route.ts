import { NextRequest, NextResponse } from 'next/server'
import { toggleLike } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { ringtoneId: string } }
) {
  try {
    const body = await request.json()
    const { increment } = body

    if (typeof increment !== 'boolean') {
      return NextResponse.json(
        { error: 'increment must be a boolean' },
        { status: 400 }
      )
    }

    const result = await toggleLike(params.ringtoneId, increment)
    return NextResponse.json({ success: true, likeCount: result })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
