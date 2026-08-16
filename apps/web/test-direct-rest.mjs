#!/usr/bin/env node
/**
 * Test direct Shelby REST API upload (multipart upload API)
 */

import { readFileSync } from 'fs'
import dns from 'dns'

console.log('====================================================')
console.log('   TESTING SHELBY DIRECT REST MULTIPART UPLOAD      ')
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

const account = process.env.SHELBY_ACCOUNT_ADDRESS || '0xdf66cf59a7d7bd10a9904518d17880226d03c66894c26bebaf1c35b0ba0c2757'

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

const jobId = `rest-${Date.now()}`
const blobName = `phonezoo/ringtones/ai-generated/${jobId}.wav`
const testBuffer = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00\xee\x02\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary')

const baseUrl = 'https://api.shelbynet.shelby.xyz/shelby'

console.log(`Target Blob : ${blobName}`)
console.log(`Target Account: ${account}`)

try {
  console.log('\n[1/3] POST /v1/multipart-uploads...')
  const startRes = await fetch(`${baseUrl}/v1/multipart-uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawAccount: account, rawBlobName: blobName, rawPartSize: 5_242_880 }),
  })
  console.log(`Start response status: ${startRes.status} ${startRes.statusText}`)
  const startText = await startRes.text()
  console.log(`Start response body: ${startText}`)

  if (startRes.ok) {
    const { uploadId } = JSON.parse(startText)
    console.log(`\n[2/3] PUT /v1/multipart-uploads/${uploadId}/parts/0...`)
    const partRes = await fetch(`${baseUrl}/v1/multipart-uploads/${uploadId}/parts/0`, {
      method: 'PUT',
      headers: { 'Content-Type': 'audio/wav' },
      body: testBuffer,
    })
    console.log(`Part response status: ${partRes.status} ${partRes.statusText}`)

    console.log(`\n[3/3] POST /v1/multipart-uploads/${uploadId}/complete...`)
    const completeRes = await fetch(`${baseUrl}/v1/multipart-uploads/${uploadId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    console.log(`Complete response status: ${completeRes.status} ${completeRes.statusText}`)

    const publicUrl = `${baseUrl}/v1/blobs/${account}/${blobName.split('/').map(encodeURIComponent).join('/')}`
    console.log(`\nTesting public URL: ${publicUrl}`)
    const fetchRes = await fetch(publicUrl)
    console.log(`Public fetch status: ${fetchRes.status} ${fetchRes.statusText}`)
  }
} catch (err) {
  console.error('REST Upload error:', err)
}
