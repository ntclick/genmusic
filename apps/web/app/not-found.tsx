import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-6">Ringtone Not Found</h2>
        <p className="text-brand-muted mb-8 max-w-md">
          The ringtone you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-block bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
