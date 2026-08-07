let ffmpegInstance: ReturnType<typeof import('@ffmpeg/ffmpeg').createFFmpeg> | null = null
let loadingPromise: Promise<void> | null = null

const getFFmpeg = async () => {
  if (!ffmpegInstance) {
    const mod = await import('@ffmpeg/ffmpeg')
    // some builds expose createFFmpeg on default
    const createFFmpeg = mod.createFFmpeg ?? (mod as any).default?.createFFmpeg
    if (!createFFmpeg) throw new Error('createFFmpeg not available')
    ffmpegInstance = createFFmpeg({
      log: false,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/ffmpeg-core.js',
    })
  }
  return ffmpegInstance
}

export const loadFFmpeg = async () => {
  const ffmpeg = await getFFmpeg()
  if (ffmpeg.isLoaded()) return
  if (!loadingPromise) {
    loadingPromise = ffmpeg.load()
  }
  await loadingPromise
}

type TargetFormat = 'mp3' | 'm4r' | 'aac' | 'ogg' | 'flac'

export const transcodeWav = async (blob: Blob, target: TargetFormat) => {
  await loadFFmpeg()
  const ffmpeg = await getFFmpeg()

  const inputName = 'input.wav'
  const outputName =
    target === 'mp3'
      ? 'output.mp3'
      : target === 'm4r'
        ? 'output.m4r'
        : target === 'aac'
          ? 'output.aac'
          : target === 'ogg'
            ? 'output.ogg'
            : 'output.flac'

  const inputBuffer = await blob.arrayBuffer()
  ffmpeg.FS('writeFile', inputName, new Uint8Array(inputBuffer))

  // m4r is m4a container; aac codec. Choose codec per target.
  const args =
    target === 'mp3'
      ? ['-i', inputName, '-codec:a', 'libmp3lame', '-qscale:a', '2', outputName]
      : target === 'm4r'
        ? ['-i', inputName, '-codec:a', 'aac', '-b:a', '192k', outputName]
        : target === 'aac'
          ? ['-i', inputName, '-codec:a', 'aac', '-b:a', '192k', outputName]
          : target === 'ogg'
            ? ['-i', inputName, '-codec:a', 'libvorbis', '-qscale:a', '4', outputName]
            : ['-i', inputName, '-codec:a', 'flac', outputName]

  await ffmpeg.run(...args)

  const data = ffmpeg.FS('readFile', outputName) as Uint8Array
  const mime =
    target === 'mp3'
      ? 'audio/mpeg'
      : target === 'm4r'
        ? 'audio/mp4'
        : target === 'aac'
          ? 'audio/aac'
          : target === 'ogg'
            ? 'audio/ogg'
            : 'audio/flac'
  // Ensure ArrayBuffer (avoid SharedArrayBuffer type issues)
  const outputBuffer = new Uint8Array(data).buffer

  // Cleanup FFmpeg virtual filesystem
  try {
    (ffmpeg as any).FS('unlink', inputName);
    (ffmpeg as any).FS('unlink', outputName)
  } catch { /* ignore cleanup errors */ }

  return new Blob([outputBuffer], { type: mime })
}
