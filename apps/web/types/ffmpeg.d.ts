declare module '@ffmpeg/ffmpeg' {
  export function createFFmpeg(options?: { log?: boolean; corePath?: string }): {
    load: () => Promise<void>
    isLoaded: () => boolean
    FS: {
      (op: 'writeFile', path: string, data: Uint8Array): void
      (op: 'readFile', path: string): Uint8Array
    }
    run: (...args: string[]) => Promise<void>
  }
  export function fetchFile(input: string | URL | ArrayBuffer | Blob | File): Promise<Uint8Array>
}
