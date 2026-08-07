import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog - Ringtone Guides, Tips & How-To Articles | Phonezoo',
  description: 'Learn how to set custom ringtones on iPhone and Android, discover the best free ringtones, understand audio formats, and get the most out of your phone sounds.',
  keywords: ['ringtone guide', 'how to set ringtone', 'iphone ringtone tutorial', 'android ringtone help', 'ringtone formats', 'free ringtone tips'],
  openGraph: {
    title: 'Phonezoo Blog - Ringtone Guides & Tips',
    description: 'Helpful articles about ringtones, audio formats, and phone customization.',
    type: 'website',
    url: 'https://phonezoo.com/blog',
  },
  alternates: {
    canonical: 'https://phonezoo.com/blog',
  },
}

// Blog posts with staggered dates
const posts = [
  {
    slug: 'how-to-set-custom-ringtone-iphone',
    title: 'How to Set a Custom Ringtone on iPhone in 2025 (Step-by-Step Guide)',
    excerpt: 'A complete walkthrough for setting custom M4R ringtones on any iPhone model. Learn the GarageBand method, the Mac/Finder method, and common troubleshooting tips.',
    date: '2025-01-15',
    readTime: '5 min read',
    category: 'Tutorial',
  },
  {
    slug: 'how-to-set-ringtone-android',
    title: 'How to Set a Custom Ringtone on Android (Samsung, Pixel, OnePlus)',
    excerpt: 'Step-by-step instructions for setting downloaded MP3 files as ringtones on popular Android phones. Covers Samsung Galaxy, Google Pixel, OnePlus, and Xiaomi devices.',
    date: '2025-01-28',
    readTime: '4 min read',
    category: 'Tutorial',
  },
  {
    slug: 'ringtone-formats-explained-mp3-m4r-wav-flac',
    title: 'Ringtone Formats Explained: MP3 vs M4R vs WAV vs FLAC — Which One Do You Need?',
    excerpt: 'Understanding audio formats can be confusing. This guide breaks down every ringtone format, explains which devices support what, and helps you pick the right one.',
    date: '2025-02-10',
    readTime: '6 min read',
    category: 'Guide',
  },
  {
    slug: 'best-free-ringtones-2025',
    title: 'The 15 Best Free Ringtones to Download in 2025',
    excerpt: 'Our hand-picked selection of the most popular and highest-rated free ringtones across all categories — from classic melodies to trending sounds.',
    date: '2025-02-25',
    readTime: '4 min read',
    category: 'Roundup',
  },
  {
    slug: 'how-to-make-ringtone-from-any-song',
    title: 'How to Make a Ringtone From Any Song (Free, No Software Needed)',
    excerpt: 'Learn how to turn any song into a custom ringtone using Phonezoo\'s free browser-based tool. Works on any device — no app downloads or software installation required.',
    date: '2025-03-08',
    readTime: '5 min read',
    category: 'Tutorial',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      {/* Header */}
      <div className="bg-bg-panel border-b border-bg-border">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <BookOpen className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-medium text-brand-muted">Phonezoo Blog</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Ringtone Guides & Tips</h1>
          <p className="text-brand-muted max-w-2xl mx-auto leading-relaxed">
            Helpful articles about setting custom ringtones, understanding audio formats, and getting the most
            out of your phone sounds. Written by the Phonezoo team to help you personalize your device.
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="bg-bg-panel border border-white/5 rounded-2xl p-6 md:p-8 hover:border-brand-orange/30 transition group">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-0.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-brand-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
                <span className="text-xs text-brand-muted">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-brand-orange transition">
                  {post.title}
                </h2>
              </Link>
              <p className="text-brand-muted text-sm leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-brand-orange text-sm font-semibold hover:text-brand-orangeHover transition"
              >
                Read Article <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>

        {/* About Section */}
        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <h2 className="text-xl font-bold text-white mb-4">About the Phonezoo Blog</h2>
          <p className="text-brand-muted text-sm leading-relaxed max-w-2xl mx-auto">
            The Phonezoo blog is your resource for everything related to phone ringtones and audio customization.
            We publish practical guides, how-to articles, and curated collections to help you personalize your
            device. All articles are written by our team based on hands-on testing with real devices including
            the latest iPhone and Android models. New articles are published regularly — bookmark this page to stay updated.
          </p>
        </div>
      </div>
    </div>
  )
}
