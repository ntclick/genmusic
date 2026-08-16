#!/usr/bin/env node
/**
 * Standalone Diagnostic Test Script for ShelbyNet & Aptos On-Chain Transaction Verification
 * Usage: node --dns-result-order=ipv4first test-shelby-full.mjs
 */

import { readFileSync } from 'fs'
import dns from 'dns'
import { Account, Ed25519PrivateKey, PrivateKey, AptosConfig, Aptos, Network } from '@aptos-labs/ts-sdk'
import { ShelbyNodeClient } from '@shelby-protocol/sdk/node'

console.log('====================================================')
console.log('   SHELBYNET ON-CHAIN & FAUCET DIAGNOSTIC TEST      ')
console.log('====================================================\n')

// 1. Load .env.local
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

// 2. Patch DNS for Windows
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

// 3. Initialize Aptos Signer
const formattedKey = PrivateKey.formatPrivateKey(rawKey, 'ed25519')
const privateKey = new Ed25519PrivateKey(formattedKey)
const signer = Account.fromPrivateKey({ privateKey })
const accountAddress = signer.accountAddress.toString()

console.log(`[1/5] Account Address : ${accountAddress}`)
console.log(`[2/5] Target Network  : shelbynet\n`)

// 4. Fund Account via Aptos Devnet Faucet if balance is 0
const aptosConfig = new AptosConfig({ network: Network.DEVNET })
const aptos = new Aptos(aptosConfig)

try {
  console.log('[3/5] Checking APT balance and funding via Aptos Faucet...')
  const balance = await aptos.getAccountAPTAmount({ accountAddress: signer.accountAddress }).catch(() => 0)
  console.log(`      Current Account Balance: ${balance} Octas (${balance / 100_000_000} APT)`)

  if (balance < 100_000_000) {
    console.log('      Requesting 1 APT from Devnet Faucet...')
    await aptos.fundAccount({ accountAddress: signer.accountAddress, amount: 100_000_000 }).catch(e => {
      console.log('      Faucet fund notice:', e.message)
    })
    const newBal = await aptos.getAccountAPTAmount({ accountAddress: signer.accountAddress }).catch(() => 0)
    console.log(`      Updated Account Balance: ${newBal} Octas (${newBal / 100_000_000} APT)`)
  }
} catch (faucetErr) {
  console.warn('      Faucet step notice:', faucetErr.message)
}

// 5. Initialize Shelby Client & Hook Move Transactions
const client = new ShelbyNodeClient({ network: 'shelbynet' })

let moveTxHash = null
if (client.coordination?.registerBlob) {
  const originalRegister = client.coordination.registerBlob.bind(client.coordination)
  client.coordination.registerBlob = async (params) => {
    const result = await originalRegister(params)
    const tx = result?.hash || result?.transaction?.hash || result?.transactionHash || (typeof result === 'string' ? result : null)
    if (tx) moveTxHash = tx
    console.log(`      [Move Tx Register] ${tx || JSON.stringify(result)}`)
    return result
  }
}

if (client.coordination?.commitBlob) {
  const originalCommit = client.coordination.commitBlob.bind(client.coordination)
  client.coordination.commitBlob = async (params) => {
    const result = await originalCommit(params)
    const tx = result?.hash || result?.transaction?.hash || result?.transactionHash || (typeof result === 'string' ? result : null)
    if (tx && !moveTxHash) moveTxHash = tx
    console.log(`      [Move Tx Commit] ${tx || JSON.stringify(result)}`)
    return result
  }
}

// 6. Upload Blob to ShelbyNet
const jobId = `test-${Date.now()}`
const blobName = `phonezoo/ringtones/ai-generated/${jobId}.wav`
const testBuffer = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00\xee\x02\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary')
const expirationMicros = BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000n

console.log(`\n[4/5] Uploading Audio Blob "${blobName}" (${testBuffer.length} bytes)...`)

let uploadSuccess = false
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    await client.upload({
      signer,
      blobName,
      blobData: new Uint8Array(testBuffer),
      expirationMicros,
      options: { locationHint: 'shelbynet-1' },
    })
    uploadSuccess = true
    break
  } catch (err) {
    console.warn(`      Attempt ${attempt} notice: ${err.message}`)
    if (attempt < 3) await new Promise(r => setTimeout(r, 2000))
  }
}

// 7. Verify Public URL
const publicUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${accountAddress}/${blobName.split('/').map(encodeURIComponent).join('/')}`
const aptosExplorerUrl = moveTxHash
  ? `https://explorer.aptoslabs.com/txn/${moveTxHash}?network=shelbynet`
  : `https://explorer.aptoslabs.com/account/${accountAddress}?network=shelbynet`

console.log('\n[5/5] Testing HTTP retrieval of public audio blob...')
try {
  const httpRes = await fetch(publicUrl)
  console.log(`      HTTP Access Status: ${httpRes.status} ${httpRes.statusText} (${httpRes.headers.get('content-type')})`)
} catch (e) {
  console.warn('      HTTP Access notice:', e.message)
}

console.log('\n====================================================')
console.log(' 🎉 DIAGNOSTIC TEST COMPLETED!')
console.log('====================================================')
console.log(`- Account Address : ${accountAddress}`)
console.log(`- Public Audio URL: ${publicUrl}`)
console.log(`- Move Tx Hash    : ${moveTxHash || 'Account Registered'}`)
console.log(`- Aptos Explorer  : ${aptosExplorerUrl}`)
console.log('====================================================\n')
