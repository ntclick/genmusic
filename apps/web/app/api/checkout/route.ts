import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, getVariantId } from '@/lib/lemonsqueezy'
import { getSupabaseAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: { plan_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { plan_id } = body
  if (!plan_id || !['pro', 'premium'].includes(plan_id)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const variantId = getVariantId(plan_id)
  if (!variantId) {
    return NextResponse.json({ error: 'Plan not available for purchase' }, { status: 400 })
  }

  // Get user email
  const { data: user } = await (getSupabaseAdminClient())
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  const appUrl = process.env.APP_URL || 'https://phonezoo.com'

  try {
    const checkoutUrl = await createCheckout({
      variantId,
      userId,
      userEmail: (user as { email: string } | null)?.email,
      successUrl: `${appUrl}/music?upgraded=true`,
      cancelUrl: `${appUrl}/music/pricing`,
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
