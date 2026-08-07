#!/usr/bin/env node

const MODAL_ENDPOINT_URL = 'https://ntclick--phonezoo-acestep-generate.modal.run'

async function testModal() {
  const jobId = `song-test-${Date.now()}`
  console.log(`[1] Dispatching Modal ACESTEP job: ${jobId}...`)

  const res = await fetch(MODAL_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Cyberpunk synthwave 80s beat with heavy drums',
      lyrics: '',
      duration: 10,
      seed: 42,
      job_id: jobId,
      webhook_url: 'https://phonezoo.com/api/music/webhook',
    }),
  })

  console.log(`[2] Dispatch Status: ${res.status}`)
  const data = await res.json()
  console.log(`[3] Dispatch Data:`, data)
}

testModal()
