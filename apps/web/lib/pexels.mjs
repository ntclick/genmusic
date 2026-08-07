/**
 * Pexels image service for fetching artwork based on genre/mood.
 */

const DEFAULT_PEXELS_KEY = 'SCO87VXtiuBRdHZ1S5KGK0seWCpe5yBWSdDDbWshZr0QllDfI4XXFHMG'
const DEFAULT_PIXABAY_KEY = '10529169-8b4e95571c6d63a04132f4b8b'

const GENRE_QUERIES = {
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
}

const FALLBACK_COVER_IMAGES = {
  default: [
    'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
}

export async function fetchPexelsImage(genre, query) {
  const apiKey = process.env.PEXELS_API_KEY || DEFAULT_PEXELS_KEY
  if (!apiKey) return null

  const searchQuery = query || GENRE_QUERIES[genre] || `${genre} music abstract`
  const page = Math.floor(Math.random() * 3) + 1

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=15&page=${page}&orientation=square`,
      {
        headers: { Authorization: apiKey },
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    const photos = data.photos || []
    if (photos.length === 0) return null

    const photo = photos[Math.floor(Math.random() * photos.length)]
    return photo.src.large || photo.src.medium
  } catch {
    return null
  }
}

export async function getArtworkImage(genre = 'pop', query) {
  const pexels = await fetchPexelsImage(genre, query)
  if (pexels) return pexels

  const fallbacks = FALLBACK_COVER_IMAGES.default
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}
