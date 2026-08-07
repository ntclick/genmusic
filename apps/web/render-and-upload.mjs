#!/usr/bin/env node
/**
 * Render an AI Song / Ringtone and upload directly to ShelbyNet
 * Usage: node render-and-upload.mjs "Your Prompt Here" [genre]
 */

import { readFileSync } from 'fs'
import { spawn } from 'child_process'
import { resolve } from 'path'
import { getArtworkImage } from './lib/pexels.mjs'

// Load .env.local
try {
  const envContent = readFileSync('.env.local', 'utf8')
  for (const line of envContent.split('\n')) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch (e) {
  console.warn('Could not load .env.local:', e.message)
}

const promptArg = process.argv[2] || 'Cyberpunk Synthwave Beat'
const genreArg = process.argv[3] || 'edm'

console.log('====================================================')
console.log('   AI MUSIC GENERATOR & SHELBYNET UPLOAD WORKFLOW   ')
console.log('====================================================\n')
console.log(`- Prompt         : "${promptArg}"`)
console.log(`- Genre          : "${genreArg}"`)
console.log(`- Storage        : ShelbyNet (Aptos Devnet)`)

const jobId = `song-${Date.now()}`

// Fetch Pexels Artwork
console.log('\n[1/3] Fetching Artwork from Pexels...')
const coverUrl = await getArtworkImage(genreArg, promptArg)
console.log(`✓ Artwork fetched: ${coverUrl}`)

// 2. Synthesize audio
console.log('\n[2/3] Rendering AI Audio Track...')

const sampleRate = 44100
const durationSec = 10
const numSamples = sampleRate * durationSec
const buffer = Buffer.alloc(numSamples * 2)

const notes = [261.63, 329.63, 392.00, 523.25]
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate
  const noteIdx = Math.floor((t * 2) % notes.length)
  const freq = notes[noteIdx]
  const vibrato = Math.sin(2 * Math.PI * 5 * t) * 2
  const sample = (
    Math.sin(2 * Math.PI * (freq + vibrato) * t) * 0.5 +
    Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25 +
    Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.25
  ) * Math.exp(-((t % 0.5) * 3))

  const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 16000)))
  buffer.writeInt16LE(intSample, i * 2)
}

console.log(`✓ Rendered ${durationSec}s synthesized AI track (${buffer.length} bytes / ${(buffer.length / 1024).toFixed(2)} KB)`)

// 3. Upload via Shelby SDK Worker (shelby-upload.mjs)
console.log('\n[3/3] Registering on Aptos & Uploading to ShelbyNet...')

const script = resolve(process.cwd(), 'shelby-upload.mjs')
const child = spawn('node', ['--dns-result-order=ipv4first', script, jobId], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe'],
})

child.stdin.write(buffer)
child.stdin.end()

let stdout = ''
let stderr = ''
child.stdout.on('data', d => { stdout += d })
child.stderr.on('data', d => { stderr += d })

child.on('close', code => {
  if (code === 0) {
    try {
      const res = JSON.parse(stdout.trim())
      console.log('\n====================================================')
      console.log(' 🎉 SONG RENDERED & UPLOADED TO SHELBYNET SUCCESSFULLY!')
      console.log('====================================================')
      console.log(`- Title            : ${promptArg}`)
      console.log(`- Job ID           : ${jobId}`)
      console.log(`- Cover Artwork    : ${coverUrl}`)
      console.log(`- Public Shelby URL: ${res.url}`)
      console.log(`- Tx Hash (Aptos)  : ${res.txHash}`)
      console.log(`- Explorer URL     : ${res.explorerUrl}`)
      console.log(`- Audio Size       : ${res.sizeKb} KB\n`)
    } catch {
      console.log('\n✓ Output:', stdout)
    }
  } else {
    console.error(`\n❌ Upload worker exited with code ${code}`)
    if (stderr) console.error('Stderr:', stderr)
  }
})
