#!/usr/bin/env node
/**
 * Shelby upload worker — spawned by Next.js webhook as a child process.
 * Usage: node --dns-result-order=ipv4first shelby-upload.mjs <jobId>
 * Input : MP3 bytes via stdin
 * Output: JSON { url, sizeKb, txHash, explorerUrl, blobMerkleRoot } on stdout
 */
import { readFileSync } from 'fs'
import dns from 'dns'

const jobId = process.argv[2]
if (!jobId) { process.stderr.write('Usage: shelby-upload.mjs <jobId>\n'); process.exit(1) }

// Auto-load .env.local when run standalone
if (!process.env.SHELBY_PRIVATE_KEY) {
  try {
    const lines = readFileSync(new URL('.env.local', import.meta.url), 'utf8').split('\n')
    for (const line of lines) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const i = line.indexOf('=')
      process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  } catch { /* rely on parent env */ }
}

// Open ShelbyNet fullnode does not accept API keys (returns 401 if Authorization header is sent)
delete process.env.SHELBY_API_KEY
delete process.env.APTOS_API_KEY

const rawKey = (process.env.SHELBY_PRIVATE_KEY || '').replace(/^ed25519-priv-/, '')
if (!rawKey) { process.stderr.write('SHELBY_PRIVATE_KEY not set\n'); process.exit(1) }

// Read audio data from stdin
const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const audioBuffer = Buffer.concat(chunks)

// DNS strategy for Windows
const shelbyHost = 'api.shelbynet.shelby.xyz'
let shelbyIP = null

try {
  const res = await fetch(
    `https://1.1.1.1/dns-query?name=${encodeURIComponent(shelbyHost)}&type=A`,
    { headers: { Accept: 'application/dns-json' } }
  )
  const data = await res.json()
  shelbyIP = data.Answer?.find(r => r.type === 1)?.data ?? null
} catch (e) {
  process.stderr.write(`[dns] DoH failed: ${e.message}\n`)
}

if (shelbyIP) {
  const _nativeLookup = dns.lookup.bind(dns)
  const _resolvedIP = shelbyIP
  const _shelbyHost = shelbyHost

  dns.lookup = function patchedLookup(hostname, options, callback) {
    if (hostname === _shelbyHost) {
      const cb = typeof options === 'function' ? options : callback
      const opts = typeof options === 'object' && options !== null ? options : {}
      if (opts.all) {
        cb(null, [{ address: _resolvedIP, family: 4 }])
      } else {
        cb(null, _resolvedIP, 4)
      }
    } else if (typeof options === 'function') {
      _nativeLookup(hostname, options)
    } else {
      _nativeLookup(hostname, options, callback)
    }
  }
}

// Dynamic imports
const { Ed25519PrivateKey, Account, PrivateKey } = await import('@aptos-labs/ts-sdk')
const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')

const formattedKey = PrivateKey.formatPrivateKey(rawKey, 'ed25519')
const privateKey = new Ed25519PrivateKey(formattedKey)
const signer = Account.fromPrivateKey({ privateKey })

// Note: Do NOT send apiKey to open ShelbyNet endpoints (causes 401 Unauthorized)
const client = new ShelbyNodeClient({
  network: 'shelbynet',
})

// Capture Move transaction hash from registerBlob and commitBlob calls
let moveTxHash = null
if (client.coordination?.registerBlob) {
  const originalRegister = client.coordination.registerBlob.bind(client.coordination)
  client.coordination.registerBlob = async (params) => {
    const result = await originalRegister(params)
    const tx = result?.hash || result?.transaction?.hash || result?.transactionHash || (typeof result === 'string' ? result : null)
    if (tx) moveTxHash = tx
    process.stderr.write(`[shelby-upload] registerBlob tx: ${tx || JSON.stringify(result)}\n`)
    return result
  }
}

if (client.coordination?.commitBlob) {
  const originalCommit = client.coordination.commitBlob.bind(client.coordination)
  client.coordination.commitBlob = async (params) => {
    const result = await originalCommit(params)
    const tx = result?.hash || result?.transaction?.hash || result?.transactionHash || (typeof result === 'string' ? result : null)
    if (tx && !moveTxHash) moveTxHash = tx
    process.stderr.write(`[shelby-upload] commitBlob tx: ${tx || JSON.stringify(result)}\n`)
    return result
  }
}

const isWavHeader = audioBuffer.length >= 4 && audioBuffer.toString('utf8', 0, 4) === 'RIFF'
const fileExt = isWavHeader ? 'wav' : 'mp3'
const blobName = `phonezoo/ringtones/ai-generated/${jobId}.${fileExt}`
const expirationDays = parseInt(process.env.SHELBY_EXPIRATION_DAYS || '30', 10)
const expirationMicros = BigInt(Date.now() + expirationDays * 24 * 60 * 60 * 1000) * 1000n

// Retry loop with backoff for rate limits
let lastError = null
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    await client.upload({
      signer,
      blobName,
      blobData: new Uint8Array(audioBuffer),
      expirationMicros,
      options: {
        locationHint: 'shelbynet-1',
      }
    })
    lastError = null
    break
  } catch (err) {
    lastError = err
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, attempt * 2000))
    }
  }
}

if (lastError) {
  throw lastError
}

const base = 'https://api.shelbynet.shelby.xyz/shelby'
const encodedName = blobName.split('/').map(encodeURIComponent).join('/')
const url = `${base}/v1/blobs/${signer.accountAddress}/${encodedName}`
const shelbyExplorerUrl = moveTxHash
  ? `https://explorer.shelby.xyz/shelbynet/tx/${moveTxHash}`
  : 'https://explorer.shelby.xyz/shelbynet/'

process.stdout.write(JSON.stringify({
  url,
  sizeKb: Math.round(audioBuffer.length / 1024),
  txHash: moveTxHash,
  account: signer.accountAddress.toString(),
  locationHint: 'shelbynet-1',
  explorerUrl: shelbyExplorerUrl,
  aptosExplorerUrl: moveTxHash ? `https://explorer.aptoslabs.com/txn/${moveTxHash}?network=shelbynet` : null,
}) + '\n')
