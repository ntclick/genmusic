/**
 * Pexels image service for fetching artwork based on genre/mood.
 * Falls back to Pixabay & curated Pexels cover URLs if Pexels API key fails.
 */

const DEFAULT_PEXELS_KEY = 'SCO87VXtiuBRdHZ1S5KGK0seWCpe5yBWSdDDbWshZr0QllDfI4XXFHMG'
const DEFAULT_PIXABAY_KEY = '10529169-8b4e95571c6d63a04132f4b8b'

const GENRE_QUERIES: Record<string, string> = {
  pop: 'colorful neon lights abstract',
  rock: 'electric guitar dark concert',
  edm: 'neon abstract laser lights',
  hiphop: 'urban street art graffiti night',
  lofi: 'rainy window coffee aesthetic',
  classical: 'piano keys elegant concert hall',
  jazz: 'saxophone jazz club moody',
  ambient: 'aurora borealis night sky stars',
  synthwave: 'futuristic neon city synthwave',
  funk: 'disco lights retro colorful',
  kpop: 'neon city lights seoul aesthetic',
  rnb: 'city night lights purple moody',
  latin: 'tropical sunset beach vibrant',
  country: 'acoustic guitar sunset rural',
  metal: 'dark fire smoke concert',
  reggae: 'tropical sunset ocean palm',
  blues: 'blues guitar bar moody night',
  soul: 'vinyl record warm vintage',
  electronic: 'abstract digital art neon',
  indie: 'vintage camera film aesthetic',
  acoustic: 'acoustic guitar nature peaceful',
}

const FALLBACK_COVER_IMAGES: Record<string, string[]> = {
  pop: [
    'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  rock: [
    'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/144429/pexels-photo-144429.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  edm: [
    'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  lofi: [
    'https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1629236/pexels-photo-1629236.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  default: [
    'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/164745/pexels-photo-164745.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/167092/pexels-photo-167092.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
}

interface PexelsPhoto {
  id: number
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
  }
}

export async function fetchPexelsImage(genre: string, query?: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY || DEFAULT_PEXELS_KEY
  if (!apiKey) return null

  const searchQuery = query || GENRE_QUERIES[genre] || `${genre} music abstract`
  const page = Math.floor(Math.random() * 3) + 1

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=15&page=${page}&orientation=square`,
      {
        headers: { Authorization: apiKey },
        cache: 'no-store',
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    const photos: PexelsPhoto[] = data.photos || []
    if (photos.length === 0) return null

    const photo = photos[Math.floor(Math.random() * photos.length)]
    return photo.src.large || photo.src.medium
  } catch {
    return null
  }
}

export async function fetchPixabayImage(genre: string, query?: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY || DEFAULT_PIXABAY_KEY
  if (!apiKey) return null

  const searchQuery = query || GENRE_QUERIES[genre] || `${genre} music`

  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&image_type=photo&per_page=15&orientation=horizontal&safesearch=true`,
      { cache: 'no-store' }
    )

    if (!res.ok) return null

    const data = await res.json()
    const hits = data.hits || []
    if (hits.length === 0) return null

    return hits[Math.floor(Math.random() * hits.length)].webformatURL
  } catch {
    return null
  }
}

export async function getArtworkImage(genre: string = 'pop', query?: string): Promise<string> {
  const pexels = await fetchPexelsImage(genre, query)
  if (pexels) return pexels

  const pixabay = await fetchPixabayImage(genre, query)
  if (pixabay) return pixabay

  const fallbacks = FALLBACK_COVER_IMAGES[genre] || FALLBACK_COVER_IMAGES.default
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}
