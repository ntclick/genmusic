import { NextRequest, NextResponse } from 'next/server'
import { incrementDownloadCount } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { ringtoneId: string } }
) {
  try {
    const { ringtoneId } = params

    if (!ringtoneId) {
      return NextResponse.json(
        { error: 'Ringtone ID is required' },
        { status: 400 }
      )
    }

    await incrementDownloadCount(ringtoneId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking download:', error)
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    )
  }
}
