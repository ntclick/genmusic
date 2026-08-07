'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Music, Loader2, ArrowLeft, Play, Download, Heart } from 'lucide-react'

interface SearchResult {
  id: number
  title: string
  slug: string
  duration: number
  plays: number
  likes: number
  category: string
}

export default function SearchPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Search when query param changes
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q.length >= 2) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams])

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) return
    
    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      } else {
        console.error('Search failed:', response.status)
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      performSearch(query)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      {/* Header */}
      <div className="bg-bg-panel border-b border-bg-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orangeHover mb-6 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-6">Search Ringtones</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for ringtones..."
              className="w-full bg-bg-main text-white pl-12 pr-32 py-4 rounded-full border border-white/10 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 text-base placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={query.trim().length < 2}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange hover:bg-brand-orangeHover disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-full text-white font-medium transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-brand-orange animate-spin mb-4" />
            <p className="text-gray-400">Searching...</p>
          </div>
        ) : hasSearched ? (
          results.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400">
                  Found <span className="text-white font-semibold">{results.length}</span> result{results.length !== 1 ? 's' : ''} for &quot;{searchParams.get('q')}&quot;
                </p>
              </div>
              
              <div className="grid gap-3">
                {results.map((result, index) => (
                  <Link
                    key={result.id}
                    href={`/ringtone/${result.slug || result.id}`}
                    className="flex items-center gap-4 p-4 bg-bg-panel border border-bg-border rounded-xl hover:border-brand-orange/40 transition group"
                  >
                    <div className="w-8 text-center text-gray-500 font-medium">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 bg-brand-orange/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand-orange/20 transition">
                      <Music className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate group-hover:text-brand-orange transition">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span>{result.category}</span>
                        <span>{formatDuration(result.duration || 0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Play className="w-4 h-4" />
                        <span className="text-sm">{result.plays || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{result.likes || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-bg-panel rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No results found</h2>
              <p className="text-gray-400 mb-6">
                No ringtones match &quot;{searchParams.get('q')}&quot;. Try different keywords.
              </p>
              <Link href="/" className="text-brand-orange hover:text-brand-orangeHover transition">
                Browse all ringtones →
              </Link>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-bg-panel rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Search for ringtones</h2>
            <p className="text-gray-400 mb-10">
              Enter a keyword to find ringtones, notification sounds, and more.
            </p>

            {/* Popular Searches */}
            <div className="max-w-2xl mx-auto text-left">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Popular Searches</h3>
              <div className="flex flex-wrap gap-2 mb-10">
                {['iPhone ringtone', 'Funny sounds', 'Samsung', 'Marimba', 'Alarm', 'SMS tone', 'Gaming', 'Classic', 'Pop', 'Nature sounds'].map((term) => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); performSearch(term) }}
                    className="px-4 py-2 bg-bg-panel border border-white/10 rounded-full text-sm text-gray-300 hover:border-brand-orange hover:text-white transition"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <div className="text-left space-y-6 border-t border-white/5 pt-8">
                <h3 className="text-white font-bold text-lg">How to Find the Perfect Ringtone</h3>
                <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Use the search bar above to find ringtones by name, genre, mood, or device type. You can search for
                    specific songs, artists, or categories like &quot;funny,&quot; &quot;alarm,&quot; or &quot;notification.&quot;
                  </p>
                  <p>
                    All search results show the ringtone title, category, duration, play count, and number of likes.
                    Click any result to preview it, read community reviews, and download in your preferred format
                    (MP3 for Android, M4R for iPhone, plus WAV, FLAC, and more).
                  </p>
                  <p>
                    <strong className="text-white">Search tips:</strong> Try broad terms like &quot;pop&quot; or &quot;rock&quot;
                    for genre browsing. Use specific terms like &quot;morning alarm gentle&quot; for targeted results.
                    You can also search by device type — try &quot;iphone&quot; or &quot;samsung&quot; to find device-optimized tones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
