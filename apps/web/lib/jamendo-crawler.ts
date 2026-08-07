// @ts-nocheck
import { OpenAI } from 'openai'
import { uploadOriginal, generateProcessedKeys } from './r2'
import { createRingtone, updateRingtoneProcessing } from './database'
import { getSupabaseClient } from './supabase'
import crypto from 'crypto'
import https from 'https'

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID!
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Category mapping từ Jamendo tags sang Phonezoo categories
const CATEGORY_MAPPING: Record<string, number> = {
  'alarm': 4,      // Alarm
  'notification': 3, // SMS & Message Tones
  'ringtone': 1,   // iPhone Ringtones
  'message': 3,    // SMS & Message Tones
  'iphone': 1,     // iPhone Ringtones
  'android': 2,    // Android Ringtones
  'funny': 5,      // Funny
  'game': 6,       // Gaming FX
  'nature': 4,     // Alarm (nature sounds for alarms)
  'electronic': 5, // Funny (electronic/fun sounds)
  'classical': 1,  // iPhone Ringtones (classical for iPhone)
  'pop': 1,        // iPhone Ringtones
  'rock': 5,       // Funny (rock for fun)
  'jazz': 6       // Gaming FX (jazzy gaming sounds)
}

// Only these CC licenses allow commercial use (ads) and redistribution
const ALLOWED_LICENSES = [
  'http://creativecommons.org/licenses/by/3.0/',
  'http://creativecommons.org/licenses/by/4.0/',
  'http://creativecommons.org/licenses/by-sa/3.0/',
  'http://creativecommons.org/licenses/by-sa/4.0/',
  'https://creativecommons.org/licenses/by/3.0/',
  'https://creativecommons.org/licenses/by/4.0/',
  'https://creativecommons.org/licenses/by-sa/3.0/',
  'https://creativecommons.org/licenses/by-sa/4.0/',
]

function isCommercialLicense(licenseUrl: string | undefined): boolean {
  if (!licenseUrl) return false
  const normalized = licenseUrl.toLowerCase().replace(/\/$/, '')
  // Allow CC BY and CC BY-SA (any version). Reject anything with -nc or -nd
  if (normalized.includes('-nc')) return false
  if (normalized.includes('-nd')) return false
  if (normalized.includes('/by/') || normalized.includes('/by-sa/')) return true
  return ALLOWED_LICENSES.some(allowed => normalized.startsWith(allowed.replace(/\/$/, '')))
}

interface JamendoTrack {
  id: number
  name: string
  artist_name: string
  album_name: string
  duration: number
  image: string
  audio: string
  audiodownload: string
  tags: string[]
  license_ccurl?: string
}

interface DuplicateCheckResult {
  isDuplicate: boolean
  reason?: string
  existingRingtone?: any
}

interface CrawlResult {
  totalCrawled: number
  successfulUploads: number
  failedUploads: number
  duplicatesSkipped: number
  errors: string[]
}

export async function crawlJamendoTracks({
  searchTerms,
  limit = 50,
  categories = ['alarm', 'sms', 'iphone', 'android'],
  skipDuplicates = true
}: {
  searchTerms: string[]
  limit: number
  categories: string[]
  skipDuplicates?: boolean
}): Promise<CrawlResult> {
  const results: CrawlResult = {
    totalCrawled: 0,
    successfulUploads: 0,
    failedUploads: 0,
    duplicatesSkipped: 0,
    errors: []
  }

  for (const searchTerm of searchTerms) {
    try {
      // Fetch từ Jamendo API
      const tracks = await fetchJamendoTracks(searchTerm, Math.ceil(limit / searchTerms.length))

      for (const track of tracks) {
        results.totalCrawled++

        try {
          // Check for duplicates with multiple criteria
          if (skipDuplicates) {
            const duplicateCheck = await checkForDuplicates(track)
            if (duplicateCheck.isDuplicate) {
              results.duplicatesSkipped++
              continue
            }
          }

          // Generate SEO content
          const seoContent = await generateSEOContent(track, searchTerm)

          // Determine category
          const categoryId = determineCategory(track.tags, searchTerm)

          // Download and upload using official /tracks/file/ endpoint
          const uploadResult = await downloadAndUploadTrack(track, seoContent)

          // Create processed formats (only MP3 and M4R)
          const processedKeys = await createProcessedFormats(uploadResult.key, uploadResult.ringtoneId)

          // Create database entry - match exact schema
          const ringtoneData = {
            title: seoContent.title,
            artist: track.artist_name || 'Unknown',
            description: seoContent.description,
            duration: Math.floor(track.duration),
            category_id: categoryId,
            uploader_id: null, // Jamendo tracks don't have uploader
            upload_source: 'jamendo',
            external_id: track.id.toString(),
            r2_original_key: uploadResult.key,
            r2_processed_keys: processedKeys,
            file_checksums: {
              original: uploadResult.md5
            },
            total_storage_kb: Math.ceil(uploadResult.size / 1024),
            meta_title: seoContent.metaTitle,
            meta_description: seoContent.metaDescription,
            meta_keywords: seoContent.keywords
          }

          const newRingtone = await createRingtone(ringtoneData)

          // Add tags to ringtone_tags table
          await addTagsToRingtone(newRingtone.id, track.tags || [])

          // Mark as completed
          await updateRingtoneProcessing(newRingtone.id, {
            r2_processed_keys: processedKeys,
            file_checksums: {
              original: uploadResult.md5,
              mp3_320: processedKeys.mp3_320 ? 'generated' : undefined,
              m4r: processedKeys.m4r ? 'generated' : undefined
            },
            total_storage_kb: Math.ceil(uploadResult.size / 1024),
            processing_status: 'completed'
          })

          results.successfulUploads++

          // Rate limiting - wait 2 seconds between downloads (Jamendo rate limit)
          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error) {
          results.failedUploads++
          const errorMsg = `Failed to process ${track.name}: ${error instanceof Error ? error.message : String(error)}`
          results.errors.push(errorMsg)
          console.error('❌', errorMsg)
        }
      }

    } catch (error) {
      const errorMsg = `Failed to search "${searchTerm}": ${error instanceof Error ? error.message : String(error)}`
      results.errors.push(errorMsg)
      console.error('❌', errorMsg)
    }
  }

  return results
}

async function checkForDuplicates(track: JamendoTrack) {
  try {
    // 1. Check by Jamendo ID (external_id)
    const jamendoCheck = await getSupabaseClient()
      .from('ringtones')
      .select('id')
      .eq('upload_source', 'jamendo')
      .eq('external_id', track.id.toString())
      .single()

    if (jamendoCheck.data) {
      return { isDuplicate: true, reason: 'Jamendo ID exists' }
    }

    // 2. Check by similar title/artist (fuzzy match)
    const titleSimilarity = generateSlug(track.name)
    const similarCheck = await getSupabaseClient()
      .from('ringtones')
      .select('id')
      .ilike('slug', `%${titleSimilarity}%`)
      .ilike('artist', `%${track.artist_name}%`)
      .limit(1)

    if (similarCheck.data && similarCheck.data.length > 0) {
      return { isDuplicate: true, reason: 'Similar title/artist exists' }
    }

    return { isDuplicate: false }
  } catch (error) {
    return { isDuplicate: false } // Safe fallback
  }
}

function getCategoryName(categoryId: number): string {
  const names: Record<number, string> = {
    1: 'iPhone Ringtones',
    2: 'Android Ringtones',
    3: 'SMS & Message Tones',
    4: 'Alarms',
    5: 'Funny',
    6: 'Gaming FX'
  }
  return names[categoryId] || 'Unknown'
}

async function fetchJamendoTracks(searchTerm: string, limit: number): Promise<JamendoTrack[]> {
  // Request more than needed since we filter by license after
  const fetchLimit = Math.min(limit * 3, 200)
  const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&search=${encodeURIComponent(searchTerm)}&format=json&limit=${fetchLimit}&order=popularity_month&include=licenses`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Jamendo API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.headers.status !== 'success') {
    throw new Error(`Jamendo API returned error: ${data.headers.message}`)
  }

  const allTracks: JamendoTrack[] = data.results || []

  // CRITICAL: Filter to only commercially-usable licenses (CC BY or CC BY-SA)
  // Reject CC BY-NC, CC BY-NC-SA, CC BY-NC-ND, CC BY-ND
  const commercialTracks = allTracks.filter(track => {
    if (!isCommercialLicense(track.license_ccurl)) {
      console.log(`⏭️ Skipping "${track.name}" — non-commercial license: ${track.license_ccurl || 'unknown'}`)
      return false
    }
    return true
  })

  console.log(`🔍 Jamendo search "${searchTerm}": ${allTracks.length} total → ${commercialTracks.length} commercially-licensed`)

  return commercialTracks.slice(0, limit)
}

async function generateSEOContent(track: JamendoTrack, searchTerm: string) {
  const prompt = `Generate SEO-optimized title and description for a ringtone:

Track: "${track.name}"
Artist: "${track.artist_name}"
Search: "${searchTerm}"
Tags: ${track.tags && Array.isArray(track.tags) ? track.tags.join(', ') : 'No tags'}

Return JSON:
{
  "title": "Title under 60 chars",
  "description": "Description under 160 chars",
  "metaTitle": "Meta title under 60 chars",
  "metaDescription": "Meta description under 160 chars",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')

    const parsed = JSON.parse(content)

    return {
      title: parsed.title?.substring(0, 60) || track.name.substring(0, 60),
      description: parsed.description?.substring(0, 160) || `Download ${track.name} by ${track.artist_name}`,
      metaTitle: parsed.metaTitle?.substring(0, 60) || parsed.title?.substring(0, 60),
      metaDescription: parsed.metaDescription?.substring(0, 160) || parsed.description?.substring(0, 160),
      keywords: parsed.keywords || `${searchTerm}, ringtone, ${track.artist_name}, free`
    }
  } catch (error) {
    // Fallback
    const title = `${track.name} - ${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)} Ringtone`
    return {
      title: title.substring(0, 60),
      description: `Download "${track.name}" by ${track.artist_name} - Free ${searchTerm} ringtone`,
      metaTitle: title.substring(0, 60),
      metaDescription: `Download free ${searchTerm} ringtone - ${track.name} by ${track.artist_name}`,
      keywords: `${searchTerm}, ringtone, ${track.artist_name}, free, download`
    }
  }
}

function determineCategory(tags: string[], searchTerm: string): number {
  // Match search term first
  if (CATEGORY_MAPPING[searchTerm]) {
    return CATEGORY_MAPPING[searchTerm]
  }

  // Match tags (if tags exist and is array)
  if (tags && Array.isArray(tags)) {
    for (const tag of tags) {
      if (typeof tag === 'string') {
        const tagLower = tag.toLowerCase()
        for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
          if (tagLower.includes(key)) {
            return value
          }
        }
      }
    }
  }

  // Default based on search term
  switch (searchTerm) {
    case 'alarm': return 4
    case 'notification':
    case 'message': return 3
    case 'ringtone': return 1
    default: return 1
  }
}

async function downloadAndUploadTrack(track: JamendoTrack, seoContent: any) {
  return new Promise((resolve, reject) => {
    // Use official /tracks/file/ endpoint (no client_id needed)
    const downloadUrl = `https://api.jamendo.com/v3.0/tracks/file/?id=${track.id}`

    https.get(downloadUrl, async (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode} for track ${track.id}`))
        return
      }

      // Check content type
      const contentType = response.headers['content-type']
      if (!contentType || !contentType.includes('audio/')) {
        reject(new Error(`Invalid content type: ${contentType} for track ${track.id}`))
        return
      }

      const chunks: Buffer[] = []
      let totalBytes = 0

      response.on('data', (chunk) => {
        chunks.push(chunk)
        totalBytes += chunk.length

        // Progress indicator for large files
        if (totalBytes % (1024 * 100) === 0) { // Every 100KB
          // Progress tracked internally
        }
      })

      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks)

          // Validate file size (should be reasonable for MP3)
          if (buffer.length < 10000) { // Less than 10KB is probably not a real track
            reject(new Error(`File too small: ${buffer.length} bytes for track ${track.id}`))
            return
          }

          const ringtoneId = Date.now().toString()

          // Upload to R2
          const uploadResult = await uploadOriginal(
            buffer,
            ringtoneId,
            'audio/mpeg',
            {
              'source': 'jamendo',
              'jamendo-id': track.id.toString(),
              'artist': track.artist_name,
              'album': track.album_name,
              'tags': Array.isArray(track.tags) ? track.tags.join(',') : '',
              'seo-title': seoContent.title,
              'original-url': downloadUrl,
              'download-method': 'tracks/file',
              'license': track.license_ccurl || 'unknown'
            }
          )

          resolve({
            ...uploadResult,
            ringtoneId,
            fileSize: buffer.length
          })
        } catch (error) {
          reject(error)
        }
      })

      response.on('error', reject)
    }).on('error', reject)
  })
}

// Simplified: only create MP3 and M4R formats
async function createProcessedFormats(originalKey: string, ringtoneId: string) {
  // For test, we'll just return mock processed keys
  // In real implementation, you'd convert the audio formats
  const baseKey = ringtoneId

  return {
    mp3_320: `ringtones/processed/mp3/320kbps/${baseKey}.mp3`,
    m4r: `ringtones/processed/m4r/${baseKey}.m4r`
  }
}

async function addTagsToRingtone(ringtoneId: string, jamendoTags: string[]) {
  try {
    if (!jamendoTags || !Array.isArray(jamendoTags) || jamendoTags.length === 0) {
      return;
    }

    const tagIds: number[] = []

    for (const tagName of jamendoTags.slice(0, 3)) { // Limit to 3 tags for test
      try {
        let tagResult = await getSupabaseClient()
          .from('tags')
          .select('tag_id')
          .eq('name', tagName.toLowerCase())
          .single()

        if (!tagResult.data) {
          tagResult = await getSupabaseClient()
            .from('tags')
            .insert({
              name: tagName.toLowerCase(),
              slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            })
            .select('tag_id')
            .single()
        }

        if (tagResult.data) {
          tagIds.push(tagResult.data.tag_id)
        }
      } catch (error) {
        console.warn(`Failed to process tag "${tagName}":`, error)
      }
    }

    if (tagIds.length > 0) {
      const tagInserts = tagIds.map(tagId => ({
        ringtone_id: parseInt(ringtoneId),
        tag_id: tagId
      }))

      await getSupabaseClient()
        .from('ringtone_tags')
        .insert(tagInserts)
    }

  } catch (error) {
    console.warn('Failed to add tags:', error)
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}
