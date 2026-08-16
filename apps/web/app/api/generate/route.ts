import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { generateMusicGen } from '@/lib/huggingface/musicgen'
import { uploadViaProcess } from '@/lib/shelby'
import { getArtworkImage } from '@/lib/pexels'
import { getSupabaseAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { prompt, userId, genre, durationSeconds } = (await req.json()) as {
      prompt?: string
      userId?: string
      genre?: string
      durationSeconds?: number
    }

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Missing prompt description' }, { status: 400 })
    }

    // Intelligent Genre Auto-Detection & Binding from Prompt Keywords
    let selectedGenre = (genre || 'synthwave').toLowerCase()
    const pLower = (prompt || '').toLowerCase()

    if (pLower.includes('phonk') || pLower.includes('hiphop') || pLower.includes('rap') || pLower.includes('trap') || pLower.includes('drift')) {
      selectedGenre = 'hiphop'
    } else if (pLower.includes('edm') || pLower.includes('festival') || pLower.includes('techno') || pLower.includes('house') || pLower.includes('club') || pLower.includes('hyperpop')) {
      selectedGenre = 'edm'
    } else if (pLower.includes('rock') || pLower.includes('metal') || pLower.includes('guitar') || pLower.includes('industrial')) {
      selectedGenre = 'rock'
    } else if (pLower.includes('lofi') || pLower.includes('lo-fi') || pLower.includes('relax') || pLower.includes('rain') || pLower.includes('cozy')) {
      selectedGenre = 'lofi'
    } else if (pLower.includes('synth') || pLower.includes('cyberpunk') || pLower.includes('neon') || pLower.includes('80s') || pLower.includes('retro')) {
      selectedGenre = 'synthwave'
    } else if (pLower.includes('orchestral') || pLower.includes('cinematic') || pLower.includes('trailer') || pLower.includes('classical')) {
      selectedGenre = 'classical'
    } else if (pLower.includes('jazz') || pLower.includes('saxophone')) {
      selectedGenre = 'jazz'
    } else if (pLower.includes('ambient') || pLower.includes('space') || pLower.includes('chillstep') || pLower.includes('zen')) {
      selectedGenre = 'ambient'
    }

    const targetDuration = durationSeconds || 10
    // music_generations.id is a uuid column, so this has to be a real UUID —
    // a "song-<timestamp>" id makes every insert fail with 22P02 and the track
    // is silently lost even though its audio uploaded fine. The blob is named
    // after the same id so a row and its audio always correspond.
    const projectId = crypto.randomUUID()

    // 1. Fetch Pexels Artwork
    const coverUrl = await getArtworkImage(selectedGenre, prompt.trim())

    // 2. Generate Audio via MusicGen (calling Modal GPU ACESTEP AI Model or Dynamic AI Synthesizer)
    const { audioBase64, mimeType, realAiModel } = await generateMusicGen({
      prompt: prompt.trim(),
      genre: selectedGenre,
      durationSeconds: targetDuration,
      streamingIntervalSeconds: 1.5,
      seed: Math.floor(Math.random() * 2_147_483_647),
      jobId: projectId,
    })

    const audioBuffer = Buffer.from(audioBase64, 'base64')
    void mimeType

    // 3. Upload to ShelbyNet & Register Move Transaction on Aptos.
    // Shelby is the only storage backend: if the blob cannot be stored and read
    // back, the request fails. We deliberately do not fall back to an inline
    // base64 data URI — that bloated the DB and published tracks that were never
    // actually on-chain.
    let uploadRes: any
    try {
      uploadRes = await uploadViaProcess(audioBuffer, projectId)
    } catch (err: any) {
      console.error('[api/generate] Shelby upload failed:', err?.message)
      return NextResponse.json(
        { error: 'Shelby storage unavailable', details: err?.message || 'upload failed' },
        { status: 502 }
      )
    }

    const isShelbyUploaded = !!(uploadRes?.url && uploadRes.url.includes('shelby.xyz'))
    if (!isShelbyUploaded) {
      console.error('[api/generate] Shelby upload returned no usable blob URL')
      return NextResponse.json(
        { error: 'Shelby storage unavailable', details: 'blob was not committed on-chain' },
        { status: 502 }
      )
    }

    const finalAudioUrl = uploadRes.url
    const effectiveTxHash = uploadRes?.txHash || null

    const explorerUrl = effectiveTxHash
      ? `https://explorer.shelby.xyz/shelbynet/tx/${effectiveTxHash}`
      : uploadRes.url

    // Save generation to Supabase DB for global public listing.
    // A failure here means the track never shows up anywhere, so it is reported
    // rather than swallowed — this used to fail on every single request.
    let saved = false
    try {
      const admin = getSupabaseAdminClient() as any
      const title = prompt.trim().slice(0, 50)
      // Slug matches the shape used by existing rows: slugified title + short id,
      // so /music/[slug] resolves for newly generated tracks too.
      const slug = `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)}-${projectId.slice(0, 4)}`

      // Only columns that exist on music_generations. There is no column for the
      // Move transaction, so the hash is returned to the client but not stored.
      const { error: insertError } = await admin.from('music_generations').insert({
        id: projectId,
        prompt: prompt.trim(),
        genre: selectedGenre,
        duration_seconds: targetDuration,
        audio_url: finalAudioUrl,
        artwork_url: coverUrl,
        audio_size_kb: uploadRes?.sizeKb ?? Math.round(audioBuffer.length / 1024),
        engine: 'musicgen',
        status: 'completed',
        is_public: true,
        source: 'user',
        title,
        slug,
        created_at: new Date().toISOString(),
      })
      if (insertError) {
        console.error('[api/generate] DB insert failed:', insertError.message, insertError.code)
      } else {
        saved = true
      }
    } catch (dbErr: any) {
      console.error('[api/generate] DB insert threw:', dbErr?.message)
    }

    return NextResponse.json({
      success: true,
      audioUrl: finalAudioUrl,
      coverUrl,
      txHash: effectiveTxHash,
      explorerUrl,
      isVerifiedBlob: true,
      blobMerkleRoot: uploadRes?.blobMerkleRoot || null,
      sizeKb: uploadRes?.sizeKb || Math.round(audioBuffer.length / 1024),
      storage: 'shelbynet',
      projectId,
      // false means the audio exists on Shelby but the track is not in the library
      saved,
    })
  } catch (error: any) {
    console.error('[api/generate] Error:', error)
    return NextResponse.json({ error: 'Generation failed', details: error?.message || 'Server error' }, { status: 500 })
  }
}
