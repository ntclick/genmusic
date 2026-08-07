import { NextRequest, NextResponse } from 'next/server'
import { getReviews, addReview } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { ringtoneId: string } }
) {
  try {
    const reviews = await getReviews(params.ringtoneId)
    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('❌ Error fetching reviews:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : 'Unknown error',
        ringtoneId: params.ringtoneId
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ringtoneId: string } }
) {
  try {
    const body = await request.json()
    const { rating, comment, author } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      )
    }

    if (!author || !author.trim()) {
      return NextResponse.json(
        { error: 'Author name is required' },
        { status: 400 }
      )
    }

    const review = await addReview(params.ringtoneId, rating, comment.trim(), author.trim())
    return NextResponse.json({ review })
  } catch (error) {
    console.error('❌ Error adding review:', error)
    return NextResponse.json(
      {
        error: 'Failed to add review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
