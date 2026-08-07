#!/usr/bin/env node
/**
 * Test uploading a real blob to ShelbyNet with Aptos contract registration
 * Usage: node test-shelbynet-upload.mjs
 */

import { readFileSync } from 'fs'
import dns from 'dns'
import { Account, Ed25519PrivateKey, PrivateKey, Network, AptosConfig, Aptos } from '@aptos-labs/ts-sdk'
import { ShelbyNodeClient } from '@shelby-protocol/sdk/node'

// 1. Auto-load .env.local
try {
  const envContent = readFileSync('.env.local', 'utf8')
  for (const line of envContent.split('\n')) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch (err) {
  console.warn('Could not load .env.local:', err.message)
}

const rawKey = (process.env.SHELBY_PRIVATE_KEY || '').replace(/^ed25519-priv-/, '')
if (!rawKey) {
  console.error('SHELBY_PRIVATE_KEY is missing')
  process.exit(1)
}

// 2. DNS DoH Patch for Windows
const shelbyHost = 'api.shelbynet.shelby.xyz'
try {
  const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(shelbyHost)}&type=A`, {
    headers: { Accept: 'application/dns-json' }
  })
  const data = await res.json()
  const shelbyIP = data.Answer?.find(r => r.type === 1)?.data ?? null
  if (shelbyIP) {
    const _nativeLookup = dns.lookup.bind(dns)
    dns.lookup = function (hostname, options, callback) {
      if (hostname === shelbyHost) {
        const cb = typeof options === 'function' ? options : callback
        const opts = typeof options === 'object' && options !== null ? options : {}
        if (opts.all) {
          cb(null, [{ address: shelbyIP, family: 4 }])
        } else {
          cb(null, shelbyIP, 4)
        }
      } else if (typeof options === 'function') {
        _nativeLookup(hostname, options)
      } else {
        _nativeLookup(hostname, options, callback)
      }
    }
  }
} catch (e) {
  console.warn('DoH patch failed:', e.message)
}

// 3. Initialize Aptos Signer & Shelby Client
const formattedKey = PrivateKey.formatPrivateKey(rawKey, 'ed25519')
const privateKey = new Ed25519PrivateKey(formattedKey)
const signer = Account.fromPrivateKey({ privateKey })

console.log('====================================================')
console.log('   SHELBYNET ON-CHAIN BLOB UPLOAD DIAGNOSTIC   ')
console.log('====================================================\n')
console.log(`- Account Address : ${signer.accountAddress.toString()}`)
console.log(`- Shelby Network  : ${process.env.SHELBY_NETWORK || 'shelbynet'}`)

// Initialize ShelbyNodeClient for shelbynet
const client = new ShelbyNodeClient({
  network: 'shelbynet',
})

const jobId = `diag-${Date.now()}`
const blobName = `diag-${jobId}.txt`
const testData = new TextEncoder().encode('Hello ShelbyNet On-Chain Blob Test ' + Date.now())
const expirationMicros = BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000n

console.log(`\nUploading "${blobName}" (${testData.length} bytes)...`)

const locations = await client.metadata.getLocationNames().catch(e => console.log('Location query notice:', e.message))
console.log('Available Shelby Locations:', locations)
const locationHint = Array.isArray(locations) && locations.length > 0 ? locations[0] : 'us-east-1'

try {
  await client.upload({
    signer,
    blobName,
    blobData: testData,
    expirationMicros,
    options: {
      locationHint,
    }
  })

  const publicUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${signer.accountAddress}/${blobName.split('/').map(encodeURIComponent).join('/')}`
  console.log('\n✓ ON-CHAIN UPLOAD SUCCESSFUL!')
  console.log(`- Public URL: ${publicUrl}\n`)
} catch (err) {
  console.error('\n❌ On-chain upload failed:')
  console.error(err)
}
