/**
 * Client-safe Shelby constants.
 *
 * `lib/shelby.ts` pulls in the Shelby/Aptos Node SDKs and reads server-only env,
 * so it can never be imported from a client component. This module holds just the
 * URL shape, which is public information, and is safe on both server and client.
 *
 * The account address must be exposed as NEXT_PUBLIC_SHELBY_ACCOUNT_ADDRESS for
 * client bundles — Next.js only inlines NEXT_PUBLIC_* variables into the browser.
 */

/** Shelby RPC / blob gateway for shelbynet (serves CORS `*`). */
export const SHELBY_RPC_BASE = 'https://api.shelbynet.shelby.xyz/shelby'

/** Aptos account that owns the blobs. Empty string when unconfigured. */
export const SHELBY_ACCOUNT =
  process.env.NEXT_PUBLIC_SHELBY_ACCOUNT_ADDRESS ||
  process.env.SHELBY_ACCOUNT_ADDRESS ||
  ''

/**
 * Build a public Shelby blob URL from a storage key.
 * Passes absolute URLs through untouched; returns '' when the key or account is missing.
 */
export function shelbyBlobUrl(key: string, account: string = SHELBY_ACCOUNT): string {
  if (!key) return ''
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  if (!account) return ''

  const encoded = key.split('/').map(encodeURIComponent).join('/')
  return `${SHELBY_RPC_BASE}/v1/blobs/${account}/${encoded}`
}
