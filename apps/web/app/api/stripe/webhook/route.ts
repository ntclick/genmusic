import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/stripe'
import { createUserSubscription, cancelUserSubscription } from '@/lib/music-storage'

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const rawBody = await req.text()

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id || session.client_reference_id
        if (!userId) break

        const subscriptionId = session.subscription

        // Fetch subscription details from Stripe
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        })
        const sub = await subRes.json()

        const priceId = sub.items?.data?.[0]?.price?.id

        // Map Stripe price ID to our plan
        const planId = getPlanFromPriceId(priceId)

        await createUserSubscription({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        if (sub.status === 'active') {
          // Update period dates if needed
          break
        }
        // If canceled or past_due, handle accordingly
        if (sub.status === 'canceled' || sub.cancel_at_period_end) {
          const userId = sub.metadata?.user_id
          if (userId) await cancelUserSubscription(userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const userId = sub.metadata?.user_id
        if (userId) await cancelUserSubscription(userId)
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] Error processing event:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function getPlanFromPriceId(priceId: string): string {
  const proPrice = process.env.STRIPE_PRO_PRICE_ID
  const premiumPrice = process.env.STRIPE_PREMIUM_PRICE_ID

  if (priceId === proPrice) return 'pro'
  if (priceId === premiumPrice) return 'premium'

  // Fallback: check price amount
  return 'pro'
}
