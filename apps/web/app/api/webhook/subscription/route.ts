import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, getPlanFromVariantId } from '@/lib/lemonsqueezy'
import { createUserSubscription, cancelUserSubscription } from '@/lib/music-storage'

export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('x-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const rawBody = await req.text()

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName: string = event.meta?.event_name
  const customData = event.meta?.custom_data || {}
  const userId: string | undefined = customData.user_id

  if (!userId) {
    console.warn('[webhook/subscription] No user_id in custom_data')
    return NextResponse.json({ received: true })
  }

  try {
    switch (eventName) {
      case 'subscription_created': {
        const attrs = event.data?.attributes || {}
        const variantId = String(attrs.variant_id || attrs.first_subscription_item?.variant_id || '')
        const planId = getPlanFromVariantId(variantId)

        await createUserSubscription({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: String(attrs.customer_id || ''),
          stripe_subscription_id: String(event.data?.id || ''),
          current_period_start: attrs.created_at || new Date().toISOString(),
          current_period_end: attrs.renews_at || null,
        })
        break
      }

      case 'subscription_updated': {
        const attrs = event.data?.attributes || {}
        if (attrs.status === 'cancelled' || attrs.status === 'expired') {
          await cancelUserSubscription(userId)
        }
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        await cancelUserSubscription(userId)
        break
      }
    }
  } catch (err) {
    console.error('[webhook/subscription] Error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
