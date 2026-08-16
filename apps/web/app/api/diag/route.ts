import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Diagnostic: report whether clay.wasm actually shipped inside the deployed
 * function. Shelby uploads fail on Vercel with "Unable to locate clay.wasm",
 * and file tracing cannot be inspected from outside, so ask the runtime.
 *
 * Read-only, returns paths and file listings only.
 */
export async function GET() {
  const fs = eval('require')('fs')
  const path = eval('require')('path')

  const out: Record<string, unknown> = {
    cwd: process.cwd(),
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION ?? null,
    // Confirms which build is actually live, so a fix is never judged against
    // a deployment that has not rolled out yet.
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7),
  }

  // The SDK is loaded as an external, so what actually shipped decides whether
  // `import('@shelby-protocol/sdk/node')` can resolve.
  for (const pkg of ['@shelby-protocol/sdk', '@shelby-protocol/clay-codes']) {
    const pkgPath = `/var/task/node_modules/${pkg}/package.json`
    try {
      const raw = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      out[`${pkg}:version`] = raw.version
      out[`${pkg}:exports`] = raw.exports ? Object.keys(raw.exports) : null
      out[`${pkg}:files`] = fs.existsSync(`/var/task/node_modules/${pkg}/dist`)
        ? fs.readdirSync(`/var/task/node_modules/${pkg}/dist`).slice(0, 12)
        : null
    } catch (e) {
      out[`${pkg}:error`] = (e as Error)?.message?.slice(0, 160)
    }
  }

  try {
    await import('@shelby-protocol/sdk/node')
    out.sdkNodeImport = 'OK'
  } catch (e) {
    out.sdkNodeImport = (e as Error)?.message?.slice(0, 180)
  }

  try {
    const pkgJson = eval('require').resolve('@shelby-protocol/clay-codes/package.json')
    const dist = path.join(path.dirname(pkgJson), 'dist')
    out.resolvedPackage = pkgJson
    out.distDir = dist
    out.distExists = fs.existsSync(dist)
    out.distFiles = fs.existsSync(dist) ? fs.readdirSync(dist) : null
    out.wasmExists = fs.existsSync(path.join(dist, 'clay.wasm'))
  } catch (e) {
    out.resolveError = (e as Error)?.message
  }

  // The exact paths the SDK probes at runtime.
  for (const candidate of [
    '/vercel/path0/node_modules/@shelby-protocol/clay-codes/dist/clay.wasm',
    path.join(process.cwd(), 'node_modules/@shelby-protocol/clay-codes/dist/clay.wasm'),
    path.join(process.cwd(), '../../node_modules/@shelby-protocol/clay-codes/dist/clay.wasm'),
  ]) {
    out[`exists:${candidate}`] = fs.existsSync(candidate)
  }

  return NextResponse.json(out)
}
