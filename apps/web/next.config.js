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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://www.ezojs.com https://www.ezojs.com https://cmp.gatekeeperconsent.com https://the.gatekeeperconsent.com http://ezoicanalytics.com https://ezoicanalytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com",
              "style-src 'self' 'unsafe-inline'",
              "media-src 'self' https://api.testnet.shelby.xyz https://api.shelbynet.shelby.xyz https://pub-7cafaf04d6324dc1acc356106790287a.r2.dev blob: data:",
              "connect-src 'self' https://api.testnet.shelby.xyz https://api.shelbynet.shelby.xyz https://api.pexels.com https://pixabay.com https://*.supabase.co wss://*.supabase.co https://1.1.1.1 http://*.ezoic.net https://*.ezoic.net http://*.ezojs.com https://*.ezojs.com https://*.gatekeeperconsent.com http://*.gatekeeperconsent.com http://ezoicanalytics.com https://ezoicanalytics.com",
              "img-src 'self' data: blob: https://images.pexels.com https://*.pexels.com https://pixabay.com https://*.pixabay.com https://pub-7cafaf04d6324dc1acc356106790287a.r2.dev",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
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
        hostname: 'pub-7cafaf04d6324dc1acc356106790287a.r2.dev',
        pathname: '/**',
      },
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
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false }
    }
    return config
  },
}

module.exports = nextConfig
