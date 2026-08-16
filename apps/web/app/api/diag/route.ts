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
