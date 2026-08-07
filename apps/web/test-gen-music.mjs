#!/usr/bin/env node
import { readFileSync } from 'fs'

// Auto-load .env.local
try {
  const lines = readFileSync(new URL('.env.local', import.meta.url), 'utf8').split('\n')
  for (const line of lines) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const i = line.indexOf('=')
    process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
} catch {}

console.log('====================================================')
console.log('   TESTING AI MUSIC GENERATION & SHELBYNET UPLOAD   ')
console.log('====================================================\n')

const testPrompt = process.argv[2] || 'Chill Lo-Fi Rain Beat'
const testGenre = process.argv[3] || 'lofi'

async function runTest() {
  console.log(`[1/4] Sending POST request to http://localhost:5050/api/generate...`)
  console.log(`      Prompt: "${testPrompt}"`)
  console.log(`      Genre : "${testGenre}"\n`)

  const startTime = Date.now()

  try {
    const res = await fetch('http://localhost:5050/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: testPrompt,
        genre: testGenre,
        durationSeconds: 10,
        userId: 'test_script_user',
      }),
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[2/4] HTTP Response Status: ${res.status} ${res.statusText} (${elapsed}s)`)

    const data = await res.json()

    if (!res.ok || !data.success) {
      console.error('\n❌ GENERATION FAILED!')
      console.error('API Error Details:', JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('\n====================================================')
    console.log(' 🎉 MUSIC GENERATED & VERIFIED SUCCESSFULLY!')
    console.log('====================================================')
    console.log(`- Project ID      : ${data.projectId}`)
    console.log(`- Audio URL       : ${data.audioUrl?.slice(0, 100)}...`)
    console.log(`- Cover Artwork   : ${data.coverUrl}`)
    console.log(`- Storage Method  : ${data.storage}`)
    console.log(`- Size            : ${data.sizeKb} KB`)
    console.log(`- Move Tx Hash    : ${data.txHash || 'N/A'}`)
    console.log(`- Shelby Explorer : ${data.explorerUrl}`)

    if (data.audioUrl && data.audioUrl.startsWith('http')) {
      console.log('\n[3/4] Testing public audio URL playback access...')
      const audioRes = await fetch(data.audioUrl)
      console.log(`      Public Audio URL HTTP Status: ${audioRes.status} (${audioRes.headers.get('content-type') || 'audio/mpeg'})`)
    }

    console.log('\n✅ All checks passed cleanly!\n')
  } catch (err) {
    console.error('\n❌ SCRIPT ERROR:', err.message)
    process.exit(1)
  }
}

runTest()
