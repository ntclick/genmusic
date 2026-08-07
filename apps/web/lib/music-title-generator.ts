/**
 * AI-powered title and description generation for music tracks.
 * Uses OpenAI GPT-4.1 for high-quality title/description generation.
 */

const SYSTEM_PROMPT = `You are a music catalog editor at a major streaming platform.
Given a music generation prompt, genre, and optional lyrics, create:

1. TITLE: A catchy, memorable title (3-7 words). Write in ENGLISH for SEO (even if prompt is in another language). No quotes, no special characters. Make it evocative and searchable.
2. DESCRIPTION: 2-3 sentences in English describing the track's mood, key instruments, tempo feel, and ideal use cases (e.g. "Perfect for..."). Include relevant keywords for SEO.

Format your response EXACTLY as:
TITLE: [your title here]
DESCRIPTION: [your description here]

Examples:
TITLE: Neon City Nights
DESCRIPTION: A pulsing synthwave track with retro arpeggios, punchy drums, and an 80s-inspired lead synth. The driving 128 BPM beat creates an energetic atmosphere perfect for gaming montages and late-night drives.

TITLE: Rainy Day Piano
DESCRIPTION: A contemplative solo piano piece with gentle reverb and a slow, breathing tempo. Soft dynamics and minor key melodies evoke quiet introspection, ideal for study sessions or relaxing evenings.

TITLE: Morning Window Lofi
DESCRIPTION: A warm lo-fi beat with mellow detuned piano, vinyl crackle, and lazy sub bass. The hypnotic groove and soft tape-stop stutters create a peaceful atmosphere perfect for studying, coffee mornings, or relaxing at home.`

type TitleResult = {
  title: string
  description: string
}

function parseTitleResponse(text: string): TitleResult | null {
  const titleMatch = text.match(/TITLE:\s*(.+)/i)
  const descMatch = text.match(/DESCRIPTION:\s*([\s\S]+)/i)

  if (!titleMatch?.[1]) return null

  return {
    title: titleMatch[1].trim().replace(/^["']|["']$/g, ''),
    description: descMatch?.[1]?.trim().replace(/^["']|["']$/g, '') || '',
  }
}

function buildFallbackTitle(prompt: string, genre: string): string {
  // Take first meaningful words from prompt, capitalize
  const words = prompt
    .replace(/[,.].*$/, '') // cut after first comma/period
    .split(/\s+/)
    .slice(0, 5)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  return words || `${genre.charAt(0).toUpperCase() + genre.slice(1)} Track`
}

function buildFallbackDescription(prompt: string, genre: string, hasVocals: boolean): string {
  const type = hasVocals ? 'vocal track' : 'instrumental track'
  return `An AI-generated ${genre} ${type}. ${prompt.slice(0, 150)}.`
}

/**
 * Generate a catchy title and SEO description for a music track.
 * Falls back to prompt-derived title on failure.
 */
export async function generateTitleAndDescription(
  prompt: string,
  genre: string,
  lyrics: string,
  hasVocals: boolean
): Promise<TitleResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[music-title] OPENAI_API_KEY not configured, using fallback')
    return {
      title: buildFallbackTitle(prompt, genre),
      description: buildFallbackDescription(prompt, genre, hasVocals),
    }
  }

  const userMessage = [
    `Music prompt: "${prompt}"`,
    `Genre: ${genre}`,
    hasVocals ? 'Type: Vocal track with lyrics' : 'Type: Instrumental',
    lyrics ? `Lyrics snippet: "${lyrics.slice(0, 200)}"` : '',
    '\nGenerate the title and description:',
  ].filter(Boolean).join('\n')

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15_000),
      })

      if (!res.ok) {
        console.error(`[music-title] OpenAI error: ${res.status}`)
        continue
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content?.trim()
      if (!text) continue

      const parsed = parseTitleResponse(text)
      if (parsed?.title) return parsed
    } catch (err) {
      console.error(`[music-title] Attempt ${attempt} failed:`, (err as Error).message)
    }

    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
  }

  // All retries failed — use fallback
  return {
    title: buildFallbackTitle(prompt, genre),
    description: buildFallbackDescription(prompt, genre, hasVocals),
  }
}
