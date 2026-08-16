#!/usr/bin/env node
/**
 * Test direct HTTP PUT blob to ShelbyNet endpoint
 */

import dns from 'dns'

console.log('====================================================')
console.log('   TESTING SHELBY DIRECT HTTP PUT BLOB              ')
console.log('====================================================\n')

const account = '0xdf66cf59a7d7bd10a9904518d17880226d03c66894c26bebaf1c35b0ba0c2757'
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

const jobId = `put-${Date.now()}`
const blobName = `phonezoo/ringtones/ai-generated/${jobId}.wav`
const testBuffer = Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00\xee\x02\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary')

const publicUrl = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${account}/${blobName.split('/').map(encodeURIComponent).join('/')}`
console.log(`Target URL: ${publicUrl}`)

try {
  console.log('Sending direct HTTP PUT...')
  const putRes = await fetch(publicUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'audio/wav' },
    body: testBuffer,
  })
  console.log(`PUT Status: ${putRes.status} ${putRes.statusText}`)
  console.log(`PUT Response body: ${await putRes.text()}`)

  console.log('\nSending GET to verify...')
  const getRes = await fetch(publicUrl)
  console.log(`GET Status: ${getRes.status} ${getRes.statusText}`)
} catch (e) {
  console.error('PUT Test Error:', e)
}
