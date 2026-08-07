/**
 * Stripe integration for music generation subscriptions.
 * Plans: Pro ($4.99/mo), Premium ($29.99/mo)
 */

type StripeCheckoutOptions = {
  priceId: string
  userId: string
  userEmail?: string
  successUrl: string
  cancelUrl: string
}

function getStripeHeaders(): Record<string, string> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured')
  return {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(options: StripeCheckoutOptions): Promise<string> {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = options

  const params = new URLSearchParams({
    'mode': 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'success_url': successUrl,
    'cancel_url': cancelUrl,
    'metadata[user_id]': userId,
    'client_reference_id': userId,
  })

  if (userEmail) {
    params.set('customer_email', userEmail)
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: getStripeHeaders(),
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Stripe checkout error: ${err}`)
  }

  const data = await res.json()
  return data.url
}

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const params = new URLSearchParams({
    'customer': customerId,
    'return_url': returnUrl,
  })

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: getStripeHeaders(),
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Stripe portal error: ${err}`)
  }

  const data = await res.json()
  return data.url
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto') as typeof import('crypto')

  const elements = signature.split(',')
  const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1]
  const v1Sig = elements.find(e => e.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !v1Sig) return false

  const signedPayload = `${timestamp}.${payload}`
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(v1Sig),
    Buffer.from(expectedSig)
  )
}
