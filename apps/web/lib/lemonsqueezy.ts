/**
 * Lemon Squeezy API integration for subscription payments.
 * Plans: Pro ($4.99/mo), Premium ($29.99/mo)
 */

const LEMON_API_BASE = 'https://api.lemonsqueezy.com/v1'

function getHeaders(): Record<string, string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) throw new Error('LEMONSQUEEZY_API_KEY not configured')
  return {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${apiKey}`,
  }
}

/**
 * Get the variant ID for a given plan
 */
export function getVariantId(planId: string): string | null {
  if (planId === 'pro') return process.env.LEMONSQUEEZY_PRO_VARIANT_ID || null
  if (planId === 'premium') return process.env.LEMONSQUEEZY_PREMIUM_VARIANT_ID || null
  return null
}

/**
 * Map variant ID back to plan ID
 */
export function getPlanFromVariantId(variantId: string): string {
  if (variantId === process.env.LEMONSQUEEZY_PRO_VARIANT_ID) return 'pro'
  if (variantId === process.env.LEMONSQUEEZY_PREMIUM_VARIANT_ID) return 'premium'
  return 'pro'
}

/**
 * Create a Lemon Squeezy Checkout URL
 */
export async function createCheckout(options: {
  variantId: string
  userId: string
  userEmail?: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  if (!storeId) throw new Error('LEMONSQUEEZY_STORE_ID not configured')

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: {
            user_id: options.userId,
          },
          ...(options.userEmail ? { email: options.userEmail } : {}),
        },
        product_options: {
          redirect_url: options.successUrl,
        },
      },
      relationships: {
        store: {
          data: { type: 'stores', id: storeId },
        },
        variant: {
          data: { type: 'variants', id: options.variantId },
        },
      },
    },
  }

  const res = await fetch(`${LEMON_API_BASE}/checkouts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Lemon Squeezy checkout error: ${err}`)
  }

  const data = await res.json()
  return data.data.attributes.url
}

/**
 * Verify Lemon Squeezy webhook signature (HMAC SHA-256)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto') as typeof import('crypto')
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
  } catch {
    return false
  }
}
