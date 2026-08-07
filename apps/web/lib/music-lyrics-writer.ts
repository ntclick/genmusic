/**
 * AI Songwriter — generates professional Suno-optimized lyrics.
 * Uses OpenAI GPT-4.1 with Suno metatag engineering.
 *
 * Suno metatag format:
 *   [Section | modifier | modifier]
 *   Lyrics here...
 *
 * Supported tags:
 *   Structure: Intro, Verse, Pre-Chorus, Chorus, Bridge, Break, Interlude, Drop, Outro
 *   Vocal: soft vocal, aggressive vocal, whispered vocals, spoken word, emotional delivery
 *   Instrument: piano, acoustic guitar, synth lead, strings, 808 bass
 *   Mood: calm, dark, dreamy, emotional, energetic, melancholic, tense, uplifting
 *   Energy: minimal, full mix, build up, stripped back, sparse, dense
 *   Effects: reverb tail, echo, vinyl crackle, fade out
 */

export async function generateLyrics(
  description: string,
  genre: string,
  durationSeconds: number
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const langInstruction = `CRITICAL: Detect the language of the user's description. Write ALL lyrics in THAT SAME language.
Vietnamese input (words like "nhạc", "buồn", "yêu", "cà phê", "nhớ") → 100% Vietnamese lyrics.
Korean → Korean. Japanese → Japanese. Chinese → Chinese. English → English.
NEVER mix languages. NEVER default to English.`

  // Map genre to Suno style descriptors
  const genreStyles: Record<string, string> = {
    pop: 'pop | bright synths | catchy hook',
    rock: 'rock | electric guitar | driving drums',
    edm: 'edm | synth lead | bass drop | energetic',
    hiphop: 'hip hop | 808 bass | trap hi-hats',
    lofi: 'lo-fi | vinyl crackle | mellow piano | calm',
    classical: 'classical | piano | strings | emotional',
    jazz: 'jazz | piano | smooth | saxophone',
    ambient: 'ambient | pads | dreamy | minimal',
    funk: 'funk | bass | groove | energetic',
    kpop: 'pop | bright | energetic | catchy hook',
    rnb: 'rnb | smooth | 808 bass | emotional',
    latin: 'latin | reggaeton | tropical synths',
    ballad: 'ballad | piano | emotional | strings',
    'pop ballad': 'pop ballad | piano | emotional delivery | strings',
  }
  const styleTag = genreStyles[genre.toLowerCase()] || genre

  const structure = durationSeconds >= 45
    ? `[Intro | ${styleTag} | minimal] → [Verse 1 | ${styleTag}] → [Pre-Chorus | build up] → [Chorus | ${styleTag} | full mix] → [Verse 2] → [Pre-Chorus | build up] → [Chorus | full mix] → [Bridge | stripped back | emotional delivery] → [Chorus | full mix | dense] → [Outro | fade out]`
    : durationSeconds >= 30
    ? `[Verse 1 | ${styleTag}] → [Pre-Chorus | build up] → [Chorus | ${styleTag} | full mix] → [Verse 2] → [Chorus | full mix] → [Outro | fade out]`
    : `[Verse 1 | ${styleTag}] → [Chorus | full mix]`

  const systemPrompt = `You are a legendary songwriter AND a Suno AI metatag engineer. You write lyrics that make people cry at 2AM — AND you format them so Suno renders them perfectly.

## MOOD IS SACRED (RULE #1)
The user's description IS the mood. Non-negotiable.
- "buồn"/"sad"/"heartbreak" → GENUINELY painful. Raw. No hope. No silver lining.
- "vui"/"happy" → Pure joy, celebration.
- "angry" → Rage, betrayal, confrontation.
- "chill"/"relax" → Peaceful, warm, lazy.
NEVER soften. A sad song stays SAD from first to last line.

## SPECIFICITY (RULE #2)
BAD: "Gió thổi qua, lòng buồn quá" (generic)
GOOD: "Ly cà phê đen như lòng người đang khô / Khói bay lên, che đi bao nhiêu suy nghĩ" (specific, visual, sensory)
Every line = a CONCRETE image: objects, places, smells, sounds, textures.

## SUNO METATAG FORMAT (RULE #3)
Use this format for section headers:
  [Section | modifier1 | modifier2]

Modifiers are optional Suno hints. Use 1-3 max per section. Examples:
  [Verse 1 | soft vocal | acoustic guitar]
  [Pre-Chorus | build up | emotional]
  [Chorus | full mix | energetic]
  [Bridge | stripped back | whispered vocals]
  [Outro | fade out | minimal]

Available modifiers:
- Vocal: soft vocal, aggressive vocal, whispered vocals, spoken word, emotional delivery, stacked harmonies, choir
- Energy: minimal, full mix, build up, stripped back, sparse, dense
- Mood: calm, dark, dreamy, emotional, energetic, melancholic, tense, uplifting
- Effects: reverb tail, echo, fade out, vinyl crackle

## STRUCTURE (RULE #4)
- [Pre-Chorus]: 2 short lines. Build TENSION before Chorus drops.
- [Chorus]: Emotional peak. Catchy. The part people sing along to. Use "…" sparingly for dramatic pause.
- [Bridge]: The TWIST — new perspective, deeper truth, a haunting question.
- [Outro]: Quiet gut-punch. A final image that haunts the listener.
- Verse 1 = set the scene. Verse 2 = go deeper. Bridge = truth bomb.

## QUALITY
- 3-6 lines per section. Lines: 5-12 words (natural phrasing).
- Rhyme naturally, never force it.
- No filler lines. Every line earns its place.
- Max 3000 characters total.

## LANGUAGE
${langInstruction}

## OUTPUT
ONLY the lyrics with metatag section headers. No title. No notes. No commentary.`

  const userMessage = `Theme: "${description}"
Genre: ${genre}
Structure: ${structure}

Write:`

  for (let attempt = 1; attempt <= 2; attempt++) {
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 900,
          temperature: 0.75,
        }),
        signal: AbortSignal.timeout(25_000),
      })

      if (!res.ok) {
        console.error(`[lyrics-writer] OpenAI error: ${res.status}`)
        continue
      }

      const data = await res.json()
      const lyrics = data.choices?.[0]?.message?.content?.trim()
      if (lyrics && lyrics.length > 10) return lyrics
    } catch (err) {
      console.error(`[lyrics-writer] Attempt ${attempt} failed:`, (err as Error).message)
    }
  }

  throw new Error('Failed to generate lyrics')
}
