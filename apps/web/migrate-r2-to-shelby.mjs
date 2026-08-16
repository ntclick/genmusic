#!/usr/bin/env node
/**
 * Migrate legacy Cloudflare R2 audio to Shelby (shelbynet).
 *
 * For every music_generations row whose audio_url still points at r2.dev:
 *   1. download the bytes from R2
 *   2. upload them to Shelby (registers + commits the blob on-chain)
 *   3. verify the Shelby URL actually serves (HTTP 200)
 *   4. only then rewrite audio_url in Supabase
 *
 * A row is never repointed at a blob that does not read back, so a failed
 * migration leaves the original R2 link intact rather than breaking the track.
 *
 * Usage (run from apps/web):
 *   node migrate-r2-to-shelby.mjs             # dry run — reports, writes nothing
 *   node migrate-r2-to-shelby.mjs --apply     # perform the migration
 *   node migrate-r2-to-shelby.mjs --apply --limit 3
 */
import { readFileSync } from 'fs'
import dns from 'dns'

dns.setDefaultResultOrder('ipv4first')

const APPLY = process.argv.includes('--apply')
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : 100

// ---------------------------------------------------------------- env
for (const file of ['.env.local', '../../.env']) {
  try {
    for (const line of readFileSync(new URL(file, import.meta.url), 'utf8').split('\n')) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const i = line.indexOf('=')
      const k = line.slice(0, i).trim()
      if (!process.env[k]) process.env[k] = line.slice(i + 1).trim()
    }
  } catch { /* optional */ }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SHELBY_KEY = process.env.SHELBY_API_KEY
const RPC_BASE = 'https://api.shelbynet.shelby.xyz/shelby'
const TABLE = 'music_generations'

for (const [name, val] of [
  ['NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY],
  ['SHELBY_PRIVATE_KEY', process.env.SHELBY_PRIVATE_KEY],
]) {
  if (!val) { console.error(`Missing ${name}`); process.exit(1) }
}

// ---------------------------------------------------------------- shelby client
const { Ed25519PrivateKey, Account, PrivateKey } = await import('@aptos-labs/ts-sdk')
const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')

async function resolveApiKey() {
  if (!SHELBY_KEY) return undefined
  try {
    const probe = await fetch('https://api.shelbynet.shelby.xyz/v1', {
      headers: { Authorization: `Bearer ${SHELBY_KEY}` },
    })
    if (probe.ok) return SHELBY_KEY
    console.warn(`! SHELBY_API_KEY rejected (HTTP ${probe.status}) — running anonymous, expect rate limits`)
  } catch (e) {
    console.warn(`! could not validate SHELBY_API_KEY (${e.message})`)
  }
  return undefined
}

const apiKey = await resolveApiKey()
const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(
    PrivateKey.formatPrivateKey((process.env.SHELBY_PRIVATE_KEY || '').replace(/^ed25519-priv-/, ''), 'ed25519')
  ),
})
const shelby = new ShelbyNodeClient({ network: 'shelbynet', ...(apiKey ? { apiKey } : {}) })
const account = signer.accountAddress.toString()

// ---------------------------------------------------------------- supabase rest
const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function fetchLegacyRows() {
  const url =
    `${SUPABASE_URL}/rest/v1/${TABLE}` +
    `?select=id,title,audio_url&audio_url=ilike.*r2.dev*&order=created_at.desc&limit=${LIMIT}`
  const res = await fetch(url, { headers: sbHeaders })
  if (!res.ok) throw new Error(`Supabase select failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function updateRow(id, audioUrl, sizeKb) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ audio_url: audioUrl, audio_size_kb: sizeKb }),
  })
  if (!res.ok) throw new Error(`Supabase update failed: ${res.status} ${await res.text()}`)
}

// ---------------------------------------------------------------- helpers
function blobUrl(blobName) {
  const encoded = blobName.split('/').map(encodeURIComponent).join('/')
  return `${RPC_BASE}/v1/blobs/${account}/${encoded}`
}

async function verifyReadable(url, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const r = await fetch(url, { method: 'HEAD' })
      if (r.ok) return true
    } catch { /* retry */ }
    if (i < attempts) await new Promise(r => setTimeout(r, 3000))
  }
  return false
}

// ---------------------------------------------------------------- main
const rows = await fetchLegacyRows()
console.log(`Mode      : ${APPLY ? 'APPLY (ghi DB)' : 'DRY RUN (không ghi gì)'}`)
console.log(`Account   : ${account}`)
console.log(`API key   : ${apiKey ? 'hợp lệ' : 'KHÔNG — anonymous, dễ dính 429'}`)
console.log(`Cần migrate: ${rows.length} track\n`)

let ok = 0, failed = 0, skipped = 0

for (const [idx, row] of rows.entries()) {
  const label = `[${idx + 1}/${rows.length}] ${row.title || row.id}`
  const ext = (row.audio_url.match(/\.(mp3|wav)(?:\?|$)/i)?.[1] || 'mp3').toLowerCase()
  const blobName = `phonezoo/ringtones/ai-generated/${row.id}.${ext}`
  const target = blobUrl(blobName)

  // Already on Shelby and readable? nothing to do.
  if (await verifyReadable(target, 1)) {
    console.log(`${label}\n    đã có trên Shelby → chỉ cập nhật DB`)
    if (APPLY) { await updateRow(row.id, target, undefined); }
    skipped++
    continue
  }

  if (!APPLY) {
    console.log(`${label}\n    sẽ tải từ R2 → upload ${blobName}`)
    skipped++
    continue
  }

  try {
    const dl = await fetch(row.audio_url)
    if (!dl.ok) throw new Error(`tải từ R2 lỗi: HTTP ${dl.status}`)
    const bytes = Buffer.from(await dl.arrayBuffer())

    const expirationDays = parseInt(process.env.SHELBY_EXPIRATION_DAYS || '30', 10)
    await shelby.upload({
      signer,
      blobName,
      blobData: new Uint8Array(bytes),
      expirationMicros: BigInt(Date.now() + expirationDays * 86400000) * 1000n,
      // Required: the account has no default write location, so the storage
      // provider must be named explicitly or the upload is rejected outright.
      options: { locationHint: 'shelbynet-1' },
    })

    if (!(await verifyReadable(target))) {
      throw new Error('upload xong nhưng blob không đọc được (chưa commit)')
    }

    await updateRow(row.id, target, Math.round(bytes.length / 1024))
    console.log(`${label}\n    ✓ ${(bytes.length / 1024).toFixed(0)} KB → ${target}`)
    ok++
  } catch (e) {
    console.log(`${label}\n    ✗ ${e.message}  (giữ nguyên link R2 cũ)`)
    failed++
  }

  // Space out uploads so the RPC does not rate limit us mid-batch.
  await new Promise(r => setTimeout(r, 2000))
}

console.log(`\nThành công: ${ok}   Thất bại: ${failed}   Bỏ qua: ${skipped}`)
if (!APPLY) console.log('Đây là dry run — chạy lại với --apply để thực hiện.')
