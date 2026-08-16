// @ts-nocheck
/**
 * Shelby decentralized storage helper — ShelbyNet
 *
 * Network: shelbynet is the ONLY Shelby network. Shelby Testnet has been retired
 * and @shelby-protocol/sdk v0.6 throws "Unsupported Shelby network" if given it,
 * so the network is a constant here rather than an env var.
 *
 * Setup:
 *   npm i -g @shelby-protocol/cli
 *   shelby init                                   # creates ~/.shelby/config.yaml
 *   shelby faucet --network shelbynet --no-open   # get APT
 *   shelby account balance                        # check balance
 *   # Visit https://docs.shelby.xyz/apis/faucet/shelbyusd for ShelbyUSD tokens
 *
 * Required env vars:
 *   SHELBY_API_KEY=aptoslabs_xxx         # from shelby init or Aptos dashboard
 *   SHELBY_PRIVATE_KEY=0x...             # Ed25519 private key (hex)
 *   SHELBY_ACCOUNT_ADDRESS=0x...         # your Aptos account address
 *   SHELBY_EXPIRATION_DAYS=30            # how long to keep files (default: 30)
 *
 * Public file URL: https://api.shelbynet.shelby.xyz/shelby/v1/blobs/{account}/{blobName}
 *
 * NOTE: a blob only becomes readable once it is committed on-chain (is_committed=1).
 * Reading an uncommitted blob returns HTTP 404 "Blob not found".
 */

/** The only supported Shelby network. */
export const SHELBY_NETWORK = 'shelbynet' as const

/** Shelby RPC / blob gateway. Serves CORS `*`, so it is safe to use in <audio src>. */
export const SHELBY_RPC_BASE = 'https://api.shelbynet.shelby.xyz/shelby'

/** Hasura indexer that tracks blob metadata for shelbynet. */
export const SHELBY_INDEXER_URL = 'https://api.shelbynet.shelby.xyz/v1/graphql'

/** Aptos fullnode for shelbynet (chain_id 118, isolated from Aptos mainnet/testnet/devnet). */
export const SHELBY_APTOS_FULLNODE = 'https://api.shelbynet.shelby.xyz/v1'

/** Shelby block explorer. */
export const SHELBY_EXPLORER_BASE = 'https://explorer.shelby.xyz/shelbynet'

/** A committed blob as reported by the shelbynet indexer. */
export interface ShelbyBlobRecord {
  uid: string
  /** Blob name as uploaded, e.g. "phonezoo/ringtones/ai-generated/<id>.wav" */
  blobName: string
  /** Raw indexer value, e.g. "@df66.../phonezoo/ringtones/ai-generated/<id>.wav" */
  objectName: string
  owner: string
  sizeBytes: number
  createdAtMicros: number
  /** Public HTTP URL for the blob. */
  url: string
  /** @deprecated use `blobName` — kept so existing callers keep working. */
  blob_name: string
}


// Lazy-initialized clients
let shelbyClient: import('@shelby-protocol/sdk/node').ShelbyNodeClient | null = null
let aptosSigner: import('@aptos-labs/ts-sdk').Account | null = null

const BLOB_PATH_PREFIX = 'phonezoo/ringtones/ai-generated'

async function getShelbyClient() {
  if (!shelbyClient) {
    const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')
    const apiKey = await resolveApiKey()
    shelbyClient = new ShelbyNodeClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      network: SHELBY_NETWORK as any,
      ...(apiKey ? { apiKey } : {}),
    })
  }
  return shelbyClient
}

async function getSigner() {
  if (!aptosSigner) {
    const { Ed25519PrivateKey, Account, PrivateKey } = await import('@aptos-labs/ts-sdk')
    const rawKey = process.env.SHELBY_PRIVATE_KEY
    if (!rawKey) throw new Error('SHELBY_PRIVATE_KEY not set')
    // Strip AIP-80 prefix if present: "ed25519-priv-0x..." → "0x..."
    const privateKeyHex = rawKey.replace(/^ed25519-priv-/, '')
    const privateKey = new Ed25519PrivateKey(PrivateKey.formatPrivateKey(privateKeyHex, 'ed25519' as any))
    aptosSigner = Account.fromPrivateKey({ privateKey })
  }
  return aptosSigner
}

/**
 * Resolve a usable API key. A valid one avoids the per-IP anonymous rate limit
 * (429) that otherwise aborts uploads midway; but shelbynet is wiped ~weekly so
 * keys go stale, and a stale key fails harder (401) than none at all.
 */
let apiKeyChecked = false
let usableApiKey: string | undefined
async function resolveApiKey(): Promise<string | undefined> {
  if (apiKeyChecked) return usableApiKey
  apiKeyChecked = true
  const key = process.env.SHELBY_API_KEY
  if (!key) return (usableApiKey = undefined)
  try {
    const probe = await fetch(SHELBY_APTOS_FULLNODE, { headers: { Authorization: `Bearer ${key}` } })
    usableApiKey = probe.ok ? key : undefined
    if (!probe.ok) console.warn(`[shelby] SHELBY_API_KEY rejected (HTTP ${probe.status}) — running anonymous`)
  } catch {
    usableApiKey = undefined
  }
  return usableApiKey
}

/**
 * Upload an MP3 audio buffer to Shelby testnet.
 * Returns the public URL and blob name.
 */
export async function uploadToShelby(
  audioBuffer: Buffer,
  jobId: string
): Promise<{ url: string; blobName: string; sizeKb: number }> {
  const client = await getShelbyClient()
  const signer = await getSigner()

  const blobName = `${BLOB_PATH_PREFIX}/${jobId}.mp3`
  const expirationDays = parseInt(process.env.SHELBY_EXPIRATION_DAYS || '30', 10)

  // Expiration in microseconds (Shelby uses micros)
  const expirationMicros = BigInt(Date.now() + expirationDays * 24 * 60 * 60 * 1000) * 1000n

  await client.upload({
    signer,
    blobName,
    blobData: new Uint8Array(audioBuffer),
    expirationMicros,
  })

  // Use the signer's actual account address (not env var, to avoid mismatch)
  const url = getShelbyPublicUrl(blobName, signer.accountAddress.toString())

  return {
    url,
    blobName,
    sizeKb: Math.round(audioBuffer.length / 1024),
  }
}

/**
 * Build the public HTTP URL for a Shelby blob.
 * Format: https://api.shelbynet.shelby.xyz/shelby/v1/blobs/{account}/{blobName}
 */
export function getShelbyPublicUrl(blobName: string, accountOverride?: string): string {
  const account = accountOverride || process.env.SHELBY_ACCOUNT_ADDRESS
  if (!account) throw new Error('SHELBY_ACCOUNT_ADDRESS not set')

  const encodedName = blobName.split('/').map(encodeURIComponent).join('/')
  return `${SHELBY_RPC_BASE}/v1/blobs/${account}/${encodedName}`
}

export interface ShelbyUploadResult {
  url: string
  blobName: string
  sizeKb: number
  txHash?: string | null
  explorerUrl?: string | null
  registerTxHash?: string | null
  commitTxHash?: string | null
  blobMerkleRoot?: string | null
}

/**
 * Upload in-process with the Shelby SDK.
 *
 * This is the path that works on serverless: a Vercel function cannot spawn
 * `node shelby-upload.mjs`, because that script is not part of the deployed
 * bundle (the spawn fails with "Cannot find module /var/task/.../shelby-upload.mjs").
 */
async function uploadInProcess(audioBuffer: Buffer, jobId: string): Promise<ShelbyUploadResult> {
  const client: any = await getShelbyClient()
  const signer = await getSigner()
  const account = signer.accountAddress.toString()

  const isWav = audioBuffer.length >= 4 && audioBuffer.toString('utf8', 0, 4) === 'RIFF'
  const blobName = `${BLOB_PATH_PREFIX}/${jobId}.${isWav ? 'wav' : 'mp3'}`
  const expirationDays = parseInt(process.env.SHELBY_EXPIRATION_DAYS || '30', 10)
  const expirationMicros = BigInt(Date.now() + expirationDays * 24 * 60 * 60 * 1000) * 1000n

  // Capture the Move tx hash by wrapping the coordination calls the SDK makes.
  let moveTxHash: string | null = null
  const capture = (result: any) => {
    const tx = result?.transaction?.hash || result?.hash || result?.transactionHash ||
      (typeof result === 'string' ? result : null)
    if (tx && !moveTxHash) moveTxHash = tx
    return result
  }
  for (const method of ['registerBlob', 'commitObject'] as const) {
    const original = client.coordination?.[method]
    if (typeof original === 'function' && !original.__wrapped) {
      const bound = original.bind(client.coordination)
      const wrapper = async (params: unknown) => capture(await bound(params))
      wrapper.__wrapped = true
      client.coordination[method] = wrapper
    }
  }

  await client.upload({
    signer,
    blobName,
    blobData: new Uint8Array(audioBuffer),
    expirationMicros,
    // Required: the account has no default write location, and without this the
    // upload is rejected with "No write location could be resolved".
    options: { locationHint: 'shelbynet-1' },
  })

  const url = getShelbyPublicUrl(blobName, account)

  // A blob only reads back once it is committed; publishing an uncommitted one
  // would hand the client a URL that 404s.
  if (!(await isShelbyBlobReadable(url))) {
    throw new Error(`Blob uploaded but not readable (not committed): ${blobName}`)
  }

  return {
    url,
    blobName,
    sizeKb: Math.round(audioBuffer.length / 1024),
    txHash: moveTxHash,
    explorerUrl: moveTxHash ? `${SHELBY_EXPLORER_BASE}/tx/${moveTxHash}` : url,
    blobMerkleRoot: null,
  }
}

/**
 * Upload an audio buffer to Shelby.
 *
 * Prefers the in-process SDK path (the only one that works on serverless) and
 * falls back to the shelby-upload.mjs subprocess, which stays useful locally
 * where Next.js's module context has historically broken the SDK's HTTP stack.
 */
export async function uploadViaProcess(
  audioBuffer: Buffer,
  jobId: string
): Promise<ShelbyUploadResult> {
  try {
    return await uploadInProcess(audioBuffer, jobId)
  } catch (err) {
    const reason = (err as Error)?.message || String(err)

    // On serverless there is no bundled shelby-upload.mjs to spawn, so the
    // subprocess can only fail — and falling back would replace the real reason
    // with a misleading "Cannot find module" error.
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
    if (isServerless) {
      console.error('[shelby] in-process upload failed:', reason)
      throw new Error(`Shelby in-process upload failed: ${reason}`)
    }

    console.warn('[shelby] in-process upload failed, trying subprocess:', reason)
    try {
      return await uploadViaSubprocess(audioBuffer, jobId)
    } catch (subErr) {
      throw new Error(
        `Shelby upload failed. in-process: ${reason}; subprocess: ${(subErr as Error)?.message}`
      )
    }
  }
}

async function uploadViaSubprocess(
  audioBuffer: Buffer,
  jobId: string
): Promise<ShelbyUploadResult> {
  const { spawn } = eval('require')('child_process')
  const { resolve, join } = eval('require')('path')
  const { writeFileSync, unlinkSync } = eval('require')('fs')
  const { tmpdir } = eval('require')('os')

  const tempFile = join(tmpdir(), `shelby-${jobId}.wav`)
  try {
    writeFileSync(tempFile, audioBuffer)
  } catch (err) {
    console.warn('[shelby] Temp file write failed:', err)
  }

  return new Promise((res, rej) => {
    const script = resolve(process.cwd(), 'shelby-upload.mjs')
    const child = spawn('node', ['--dns-result-order=ipv4first', script, jobId, tempFile], {
      env: { ...process.env },  // inherit full env (PATH, HOME, NODE_OPTIONS, Shelby vars)
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Kill after 60s
    const timer = setTimeout(() => {
      try { unlinkSync(tempFile) } catch {}
      child.kill()
      rej(new Error('shelby-upload timeout'))
    }, 60_000)

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d: Buffer) => { stdout += d })
    child.stderr.on('data', (d: Buffer) => { stderr += d })

    child.on('close', (code: number) => {
      clearTimeout(timer)
      try { unlinkSync(tempFile) } catch {}
      if (code !== 0) { rej(new Error(`shelby-upload exited ${code}: ${stderr.slice(0, 500)}`)); return }

      // The Aptos SDK prints notices to stdout (e.g. "Note: using CUSTOM network
      // will require queries to lookup ChainId"), so the result JSON is not
      // necessarily the whole of stdout. Take the last line that parses as JSON.
      const parsed = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('{') && line.endsWith('}'))
        .reduce<Record<string, unknown> | null>((acc, line) => {
          try { return JSON.parse(line) } catch { return acc }
        }, null)

      if (!parsed) {
        rej(new Error(`Bad output from shelby-upload: ${stdout.slice(0, 500)}`))
        return
      }

      const { url, sizeKb, txHash, explorerUrl, registerTxHash, commitTxHash, blobMerkleRoot } = parsed as Record<string, any>
      const blobName = `phonezoo/ringtones/ai-generated/${jobId}.wav`
      res({ url, blobName, sizeKb, txHash, explorerUrl, registerTxHash, commitTxHash, blobMerkleRoot })
    })
  })
}

/**
 * Generic direct upload to Shelby testnet / shelbynet using REST API.
 * Uploads any buffer to the given blobName.
 */
export async function uploadBufferToShelbyDirect(
  fileBuffer: Buffer,
  blobName: string,
  contentType = 'application/octet-stream'
): Promise<{ url: string; blobName: string; sizeKb: number }> {
  const apiKey = process.env.SHELBY_API_KEY
  const account = process.env.SHELBY_ACCOUNT_ADDRESS
  if (!account) throw new Error('SHELBY_ACCOUNT_ADDRESS not set')

  const baseUrl = SHELBY_RPC_BASE

  // Always send the API key. Anonymous calls hit a per-IP rate limit (HTTP 429)
  // that can abort an upload midway, leaving an uncommitted — and unreadable — blob.
  const authHeader: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {}

  // 1. Initiate multipart upload
  const startRes = await fetch(`${baseUrl}/v1/multipart-uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ rawAccount: account, rawBlobName: blobName, rawPartSize: 5_242_880 }),
  })
  if (!startRes.ok) throw new Error(`Shelby initiate failed: ${startRes.status} ${await startRes.text()}`)
  const { uploadId } = await startRes.json() as { uploadId: string }

  // 2. Upload part
  const uploadRes = await fetch(`${baseUrl}/v1/multipart-uploads/${uploadId}/parts/0`, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, ...authHeader },
    body: fileBuffer,
  })
  if (!uploadRes.ok) throw new Error(`Shelby upload part failed: ${uploadRes.status} ${await uploadRes.text()}`)

  // 3. Complete upload
  const completeRes = await fetch(`${baseUrl}/v1/multipart-uploads/${uploadId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
  })
  if (!completeRes.ok) throw new Error(`Shelby complete failed: ${completeRes.status} ${await completeRes.text()}`)

  const encodedName = blobName.split('/').map(encodeURIComponent).join('/')
  const url = `${baseUrl}/v1/blobs/${account}/${encodedName}`
  return { url, blobName, sizeKb: Math.round(fileBuffer.length / 1024) }
}

export async function uploadToShelbyDirect(
  audioBuffer: Buffer,
  jobId: string
): Promise<{ url: string; blobName: string; sizeKb: number }> {
  const blobName = `${BLOB_PATH_PREFIX}/${jobId}.mp3`
  return uploadBufferToShelbyDirect(audioBuffer, blobName, 'audio/mpeg')
}

/**
 * Verify a blob is actually retrievable before exposing its URL to the browser.
 * A blob that exists on-chain but is not yet committed answers 404.
 */
export async function isShelbyBlobReadable(url: string): Promise<boolean> {
  if (!url || !url.startsWith(SHELBY_RPC_BASE)) return false
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Check if Shelby is configured (all env vars present).
 */
export function isShelbyConfigured(): boolean {
  return !!(
    process.env.SHELBY_API_KEY &&
    process.env.SHELBY_PRIVATE_KEY &&
    process.env.SHELBY_ACCOUNT_ADDRESS
  )
}

/**
 * Fetch the latest blobs for the configured account from the Shelby Indexer.
 */
export async function getLatestShelbyBlobs(limit = 10): Promise<ShelbyBlobRecord[]> {
  const account = process.env.SHELBY_ACCOUNT_ADDRESS
  if (!account) return []

  // Only committed, non-deleted blobs are actually retrievable — an uncommitted
  // blob answers HTTP 404 "Blob not found", which is what used to surface as
  // broken audio links in the UI.
  const query = `
    query GetBlobs($account: String!, $limit: Int!) {
      blobs(
        where: {
          owner: { _eq: $account }
          is_committed: { _eq: 1 }
          is_deleted: { _eq: 0 }
        }
        order_by: { created_at: desc }
        limit: $limit
      ) {
        uid
        object_name
        owner
        size
        created_at
        expires_at
      }
    }
  `

  try {
    const res = await fetch(SHELBY_INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { account, limit } }),
    })

    if (!res.ok) {
      console.error('[shelby] Indexer HTTP error:', res.status, await res.text())
      return []
    }
    const { data, errors } = await res.json()
    if (errors) {
      console.error('[shelby] Indexer GraphQL errors:', errors)
      return []
    }

    // object_name is "@{account-without-0x}/{blobName}" — strip the owner prefix
    // so callers get the blob name they uploaded with.
    return (data?.blobs || []).map((b: Record<string, unknown>) => {
      const objectName = String(b.object_name || '')
      const blobName = objectName.startsWith('@')
        ? objectName.slice(objectName.indexOf('/') + 1)
        : objectName
      return {
        uid: String(b.uid ?? ''),
        blobName,
        objectName,
        owner: String(b.owner ?? account),
        sizeBytes: Number(b.size ?? 0),
        createdAtMicros: Number(b.created_at ?? 0),
        url: getShelbyPublicUrl(blobName, String(b.owner ?? account)),
        // Back-compat with callers that read `blob_name`
        blob_name: blobName,
      }
    })
  } catch (err) {
    console.error('[shelby] Failed to fetch latest blobs:', err)
    return []
  }
}

