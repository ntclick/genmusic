import { uploadBufferToShelbyDirect, getShelbyPublicUrl } from './shelby'

export function getBucketName(): string {
  return 'shelbynet'
}

export const R2_PUBLIC_DOMAIN = `https://api.shelbynet.shelby.xyz/shelby/v1/blobs/${process.env.SHELBY_ACCOUNT_ADDRESS || ''}`

export const R2_PATHS = {
  ORIGINAL: 'ringtones/original',
  PROCESSED: 'ringtones/processed',
  THUMBNAILS: 'ringtones/thumbnails',
  TEMP: 'ringtones/temp',
  USER_UPLOADS: 'user-uploads',
  AI_GENERATED: 'ringtones/ai',
  AVATARS: 'avatars'
} as const

export async function uploadOriginal(
  fileBuffer: Buffer,
  ringtoneId: string | number,
  mimeType: string,
  _metadata?: Record<string, string>
) {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const ext = getExtensionFromMime(mimeType)
  const key = `${R2_PATHS.ORIGINAL}/${year}/${month}/${ringtoneId}_original.${ext}`
  const crypto = eval('require')('crypto')
  const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex')

  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, mimeType)

  return {
    key,
    md5,
    size: fileBuffer.length,
    url
  }
}

export async function uploadProcessed(
  fileBuffer: Buffer,
  ringtoneId: string | number,
  format: string,
  quality?: string
) {
  const folder = quality
    ? `${R2_PATHS.PROCESSED}/${format}/${quality}`
    : `${R2_PATHS.PROCESSED}/${format}`

  const suffix = quality ? `_${quality}` : ''
  const key = `${folder}/${ringtoneId}${suffix}.${format}`

  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, getMimeType(format))

  return {
    key,
    url
  }
}

export async function uploadAIAudio(
  fileBuffer: Buffer,
  userId: string | number,
  projectId: string | number,
  filename: string,
  contentType: string,
  _options?: { skipShelbyBackup?: boolean }
) {
  const key = `${R2_PATHS.AI_GENERATED}/${userId}/${projectId}/${filename}`
  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, contentType)
  return { key, url }
}

export async function uploadUserGeneratedAudio(
  fileBuffer: Buffer,
  userId: string | number,
  projectId: string | number,
  filename: string,
  contentType: string
) {
  const key = `${R2_PATHS.USER_UPLOADS}/${userId}/${projectId}/${filename}`
  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, contentType)
  return { key, url }
}

export async function uploadUserProject(
  fileBuffer: Buffer,
  userId: string | number,
  projectId: string | number,
  filename: string
) {
  const key = `${R2_PATHS.USER_UPLOADS}/${userId}/${projectId}/${filename}`
  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, 'audio/mpeg')
  return { key, url }
}

export async function uploadTemp(
  fileBuffer: Buffer,
  sessionId: string,
  filename: string
) {
  const timestamp = Date.now()
  const key = `${R2_PATHS.TEMP}/${sessionId}_${timestamp}_${filename}`
  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, 'audio/mpeg')
  return { key, url }
}

export async function uploadAvatar(
  fileBuffer: Buffer,
  userId: string | number,
  filename: string
) {
  const key = `${R2_PATHS.AVATARS}/${userId}_${filename}`
  const { url } = await uploadBufferToShelbyDirect(fileBuffer, key, 'image/jpeg')
  return { key, url }
}

export function getPublicUrl(key: string): string {
  if (!key) return ''
  if (key.startsWith('http://') || key.startsWith('https://')) return key
  return getShelbyPublicUrl(key)
}

export async function deleteFromStorage(_key: string) {
  // Shelby does not require manual deletion
}

export function generateStorageKey(filename: string, prefix = 'uploads') {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = filename.split('.').pop()
  return `${prefix}/${timestamp}-${random}.${extension}`
}

export function generateProcessedKeys(ringtoneId: string | number) {
  const baseKey = String(ringtoneId)
  return {
    mp3_320: `${R2_PATHS.PROCESSED}/mp3/320kbps/${baseKey}.mp3`,
    mp3_preview: `${R2_PATHS.PROCESSED}/mp3/192kbps/${baseKey}_preview.mp3`,
    m4r: `${R2_PATHS.PROCESSED}/m4r/${baseKey}.m4r`,
    wav: `${R2_PATHS.PROCESSED}/wav/${baseKey}.wav`,
    flac: `${R2_PATHS.PROCESSED}/flac/${baseKey}.flac`,
    waveform: `${R2_PATHS.THUMBNAILS}/${baseKey}_waveform.png`,
  }
}

function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-m4a': 'm4a',
    'audio/flac': 'flac',
    'audio/x-m4r': 'm4r',
  }
  return map[mimeType] || 'mp3'
}

function getMimeType(format: string): string {
  const map: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'm4r': 'audio/x-m4r',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'png': 'image/png',
    'jpg': 'image/jpeg',
  }
  return map[format] || 'application/octet-stream'
}

export async function uploadToStorage(key: string, file: File | Blob, options?: { contentType?: string }) {
  const buffer = Buffer.from(await file.arrayBuffer())
  return uploadOriginal(buffer, key, options?.contentType || 'audio/mpeg')
}
