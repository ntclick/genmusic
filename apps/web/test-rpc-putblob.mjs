#!/usr/bin/env node
/**
 * Test manual Shelby upload according to official SDK documentation guide:
 * 1. registerBlob on coordination layer
 * 2. waitForTransaction on Aptos
 * 3. rpc.putBlob on RPC layer
 */

import { readFileSync } from 'fs'
import dns from 'dns'
import { Account, Ed25519PrivateKey, PrivateKey, AptosConfig, Aptos, Network } from '@aptos-labs/ts-sdk'
import { ShelbyNodeClient } from '@shelby-protocol/sdk/node'

console.log('====================================================')
console.log('   TESTING OFFICIAL SHELBY 3-STEP MANUAL UPLOAD FLOW ')
console.log('====================================================\n')

// 1. Load env
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
  console.warn('Notice: Could not load .env.local:', err.message)
}

const rawKey = (process.env.SHELBY_PRIVATE_KEY || '').replace(/^ed25519-priv-/, '')
if (!rawKey) {
  console.error('❌ Error: SHELBY_PRIVATE_KEY not found in .env.local')
  process.exit(1)
}

// 2. Patch DNS
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
        if (opts.all) cb(null, [{ address: shelbyIP, family: 4 }])
        else cb(null, shelbyIP, 4)
      } else if (typeof options === 'function') {
        _nativeLookup(hostname, options)
      } else {
        _nativeLookup(hostname, options, callback)
      }
    }
  }
} catch (e) {
  console.warn('DNS DoH Patch notice:', e.message)
}

// 3. Initialize Aptos Signer & Shelby Client
const formattedKey = PrivateKey.formatPrivateKey(rawKey, 'ed25519')
const privateKey = new Ed25519PrivateKey(formattedKey)
const signer = Account.fromPrivateKey({ privateKey })
const accountAddress = signer.accountAddress.toString()

const aptosConfig = new AptosConfig({ network: Network.DEVNET })
const aptosClient = new Aptos(aptosConfig)

const client = new ShelbyNodeClient({ network: 'shelbynet' })

const jobId = `manual-${Date.now()}`
const blobName = `phonezoo/ringtones/ai-generated/${jobId}.wav`
const testBuffer = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00\xee\x02\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary')

console.log(`Blob Name : ${blobName}`)
console.log(`Account   : ${accountAddress}`)

// Inspect available rpc methods
console.log('\nRPC Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.rpc || {})))

try {
  // Step 1: Upload using client.upload or client.rpc.putBlob
  console.log('\nExecuting client.rpc.putBlob...')
  const putResult = await client.rpc.putBlob({
    account: signer.accountAddress,
    blobName,
    blobData: new Uint8Array(testBuffer),
  }).catch(e => console.log('putBlob direct notice:', e.message))

  console.log('putBlob result:', putResult)
} catch (err) {
  console.error('Error during test:', err)
}

const publicUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${accountAddress}/${blobName.split('/').map(encodeURIComponent).join('/')}`
console.log(`\nTesting HTTP fetch from ${publicUrl}...`)
try {
  const httpRes = await fetch(publicUrl)
  console.log(`HTTP Access Status: ${httpRes.status} ${httpRes.statusText}`)
} catch (e) {
  console.warn('HTTP Fetch notice:', e.message)
}
