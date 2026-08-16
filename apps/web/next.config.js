const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Ad/analytics hosts are listed because the app loads GA, AdSense and
              // Ezoic itself (see ConditionalScripts); without them every one of
              // those requests is blocked and the console fills with CSP errors.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://www.ezojs.com https://www.ezojs.com https://*.ezojs.com https://*.ezoic.net https://cmp.gatekeeperconsent.com https://the.gatekeeperconsent.com https://*.gatekeeperconsent.com http://ezoicanalytics.com https://ezoicanalytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.doubleclick.net https://*.adtrafficquality.google",
              "style-src 'self' 'unsafe-inline'",
              "media-src 'self' https://api.shelbynet.shelby.xyz https://shelby.shelbynet.shelby.xyz blob: data:",
              "connect-src 'self' https://api.shelbynet.shelby.xyz https://shelby.shelbynet.shelby.xyz https://api.pexels.com https://pixabay.com https://*.supabase.co wss://*.supabase.co https://1.1.1.1 http://*.ezoic.net https://*.ezoic.net http://*.ezojs.com https://*.ezojs.com https://*.gatekeeperconsent.com http://*.gatekeeperconsent.com http://ezoicanalytics.com https://ezoicanalytics.com https://www.google-analytics.com https://*.google-analytics.com https://www.google.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.googleadservices.com",
              "img-src 'self' data: blob: https://images.pexels.com https://*.pexels.com https://pixabay.com https://*.pixabay.com https://*.ezoic.net https://*.ezoic.com https://www.google-analytics.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://www.google.com https://*.adtrafficquality.google",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.doubleclick.net https://*.googlesyndication.com https://*.ezoic.net",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Polling routes must never be cached by CDN
        source: '/api/status/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      '@aptos-labs/ts-sdk',
      '@shelby-protocol/sdk',
      'got',
      'keyv',
      'cacheable-request',
    ],

    // This is an npm-workspaces monorepo, so on Vercel the dependencies hoist to
    // the repo root (/vercel/path0/node_modules) rather than apps/web/node_modules.
    // Tracing has to be rooted there or the hoisted files are considered outside
    // the project and skipped.
    outputFileTracingRoot: path.join(__dirname, '../../'),

    // The Shelby SDK reads clay.wasm from disk at runtime via import.meta.url.
    // Nothing imports it, so file tracing does not see it and the serverless
    // bundle ships without it — uploads then fail with "Unable to locate
    // clay.wasm". Cover both the hoisted and the local layout; a glob that
    // matches nothing is simply ignored.
    outputFileTracingIncludes: {
      '/api/**': [
        '../../node_modules/@shelby-protocol/**/*.wasm',
        './node_modules/@shelby-protocol/**/*.wasm',
      ],
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false }
    }
    return config
  },
}

module.exports = nextConfig
