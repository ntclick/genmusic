/**
 * Static educational content for each music genre.
 * Used by track detail pages and explore page for rich, valuable content (AdSense compliance).
 */

export type GenreContent = {
  name: string
  icon: string
  description: string
  characteristics: string
  instruments: string[]
  tempoRange: string
  moodKeywords: string[]
  useCases: string
  history: string
}

export const GENRE_CONTENT: Record<string, GenreContent> = {
  pop: {
    name: 'Pop',
    icon: '🎵',
    description: 'Pop music is the most widely consumed genre in the world, characterized by catchy melodies, memorable hooks, and accessible song structures. Modern pop draws from electronic production, R&B rhythms, and dance music to create tracks that appeal to the broadest possible audience. The genre emphasizes singalong choruses, polished production, and emotional resonance.',
    characteristics: 'Pop tracks typically follow verse-chorus-verse structures with a bridge. Production is clean and layered, featuring bright synthesizers, programmed drums, and vocal-forward mixing. Tempo usually falls between 100-130 BPM, making it perfect for both casual listening and light dancing.',
    instruments: ['Synthesizers', 'Programmed drums', 'Electric bass', 'Acoustic guitar', 'Piano'],
    tempoRange: '100-130 BPM',
    moodKeywords: ['Upbeat', 'Catchy', 'Bright', 'Energetic', 'Feel-good'],
    useCases: 'Perfect for social media content, vlogs, product advertisements, workout playlists, and background music for upbeat video content. Pop instrumentals work especially well as ringtones and notification sounds.',
    history: 'Pop music evolved from rock and roll in the 1950s and has continuously reinvented itself through disco, synth-pop, boy bands, and modern electronic-influenced production.',
  },
  rock: {
    name: 'Rock',
    icon: '🎸',
    description: 'Rock music is built on the foundation of electric guitars, powerful drums, and raw energy. From classic blues-rock to modern alternative, the genre spans an enormous range of sounds unified by driving rhythms and guitar-centric arrangements. Rock emphasizes live performance energy, dynamic range, and emotional intensity.',
    characteristics: 'Rock is defined by distorted electric guitars, strong backbeat drumming, and bass guitar. Songs often feature power chords, guitar solos, and dynamic shifts between quiet verses and loud choruses. Production ranges from lo-fi garage sounds to polished stadium rock.',
    instruments: ['Electric guitar', 'Bass guitar', 'Drums', 'Keyboards', 'Vocals'],
    tempoRange: '110-140 BPM',
    moodKeywords: ['Energetic', 'Powerful', 'Raw', 'Driving', 'Intense'],
    useCases: 'Ideal for action video content, sports highlights, gaming streams, intro music, and any content that needs high energy and forward momentum.',
    history: 'Rock emerged in the 1950s from blues, country, and rhythm and blues, becoming the dominant popular music form through the 1960s-90s with movements like psychedelic rock, punk, grunge, and indie.',
  },
  edm: {
    name: 'EDM',
    icon: '⚡',
    description: 'Electronic Dance Music (EDM) is designed to make people move, featuring powerful synthesizer leads, heavy bass drops, and precisely crafted rhythmic patterns. The genre encompasses styles from house and techno to dubstep and future bass, all united by electronic production and dance-floor energy.',
    characteristics: 'EDM features four-on-the-floor kick patterns, layered synthesizers, dramatic build-ups leading to bass drops, and sidechain compression for that characteristic pumping effect. Tracks are typically structured around an intro, build, drop, breakdown, and final drop.',
    instruments: ['Synthesizers', 'Drum machines', 'Samplers', 'Sub bass', 'Effects processors'],
    tempoRange: '120-150 BPM',
    moodKeywords: ['Euphoric', 'High-energy', 'Pulsing', 'Festival', 'Electric'],
    useCases: 'Perfect for workout playlists, gaming content, party videos, event promos, and any content that needs maximum energy and excitement.',
    history: 'EDM evolved from electronic music pioneers in the 1970s-80s through house, techno, and trance scenes, becoming mainstream in the 2010s with artists like Avicii, Skrillex, and Calvin Harris.',
  },
  hiphop: {
    name: 'Hip Hop',
    icon: '🎤',
    description: 'Hip hop production blends hard-hitting drum patterns, deep bass lines, and melodic samples to create beats that serve as the foundation for rap vocals. Modern hip hop draws from trap, boom bap, and experimental electronic music, offering incredible diversity in sound and mood.',
    characteristics: 'Hip hop beats feature prominent kick and snare patterns, 808 bass, hi-hat rolls, and sampled or synthesized melodies. Trap-influenced production uses rapid hi-hat patterns, booming sub-bass, and dark atmospheric pads. Tempo typically ranges from 70-90 BPM (half-time feel at 140-180 BPM).',
    instruments: ['808 drums', 'Sampler', 'Synthesizers', 'Turntables', 'Sub bass'],
    tempoRange: '70-90 BPM (140-180 half-time)',
    moodKeywords: ['Hard-hitting', 'Dark', 'Atmospheric', 'Groove', 'Urban'],
    useCases: 'Great for fashion content, urban lifestyle videos, dance choreography, podcast intros, and any content that needs a modern, street-smart aesthetic.',
    history: 'Hip hop originated in the Bronx, New York in the 1970s, evolving from DJ culture and block parties into a global cultural movement encompassing music, dance, art, and fashion.',
  },
  lofi: {
    name: 'Lo-Fi',
    icon: '☕',
    description: 'Lo-fi hip hop combines mellow jazz-influenced melodies with relaxed boom bap drums and intentional audio imperfections like vinyl crackle and tape hiss. The genre creates a warm, nostalgic atmosphere perfect for studying, relaxing, and creative work.',
    characteristics: 'Lo-fi tracks feature detuned piano or Rhodes chords, soft drum breaks, vinyl crackle textures, and jazz-inspired chord progressions. The production is intentionally imperfect, with bit-crushed samples, subtle pitch wobble, and a compressed, warm overall tone.',
    instruments: ['Rhodes piano', 'Acoustic guitar', 'Jazz drums', 'Vinyl samples', 'Soft synth pads'],
    tempoRange: '70-90 BPM',
    moodKeywords: ['Chill', 'Relaxing', 'Nostalgic', 'Warm', 'Dreamy'],
    useCases: 'Ideal for study playlists, relaxation content, coffee shop ambiance, reading sessions, and background music for creative work or coding streams.',
    history: 'Lo-fi hip hop emerged in the 2010s from the intersection of Japanese city pop sampling, boom bap production, and YouTube "beats to study to" culture, becoming one of the most streamed ambient music genres.',
  },
  classical: {
    name: 'Classical',
    icon: '🎻',
    description: 'Classical music encompasses centuries of Western art music tradition, from intimate chamber pieces to sweeping orchestral compositions. AI-generated classical tracks capture the elegance, emotional depth, and structural sophistication of the genre, featuring rich orchestral arrangements and piano compositions.',
    characteristics: 'Classical pieces feature acoustic instruments with wide dynamic ranges, complex harmonic progressions, and formal structures like sonata form. Orchestral works layer strings, woodwinds, brass, and percussion for rich, immersive soundscapes.',
    instruments: ['Violin', 'Piano', 'Cello', 'Orchestra', 'Flute', 'French horn'],
    tempoRange: '60-140 BPM (varies widely)',
    moodKeywords: ['Elegant', 'Cinematic', 'Emotional', 'Majestic', 'Contemplative'],
    useCases: 'Perfect for film scores, documentary narration, wedding content, meditation, luxury brand advertisements, and any content requiring sophistication and emotional depth.',
    history: 'The Western classical tradition spans from medieval plainchant through Baroque, Classical, Romantic, and Modern periods, with composers like Bach, Mozart, Beethoven, and Debussy shaping the art form.',
  },
  jazz: {
    name: 'Jazz',
    icon: '🎷',
    description: 'Jazz is built on improvisation, swing rhythm, and harmonic sophistication. From smooth jazz to bebop, the genre offers rich textures of piano voicings, walking bass lines, and expressive wind instruments. AI jazz captures the relaxed groove and musical complexity that defines this quintessential American art form.',
    characteristics: 'Jazz features extended chord voicings (7ths, 9ths, 13ths), swing or shuffle rhythms, call-and-response patterns, and improvised melodic lines. The rhythm section of piano, bass, and drums provides a flexible foundation for melodic instruments.',
    instruments: ['Saxophone', 'Piano', 'Double bass', 'Drums', 'Trumpet', 'Guitar'],
    tempoRange: '80-200 BPM',
    moodKeywords: ['Smooth', 'Sophisticated', 'Groovy', 'Relaxed', 'Classy'],
    useCases: 'Ideal for restaurant ambiance, cocktail content, travel vlogs, late-night aesthetics, and any content needing a refined, cultured atmosphere.',
    history: 'Jazz originated in New Orleans in the early 1900s, blending African rhythmic traditions with European harmony. It evolved through swing, bebop, cool jazz, and fusion to become one of the most influential music genres worldwide.',
  },
  ambient: {
    name: 'Ambient',
    icon: '🌙',
    description: 'Ambient music creates immersive atmospheric soundscapes using sustained tones, ethereal pads, and minimal melodic elements. The genre prioritizes texture and atmosphere over rhythm and melody, creating sonic environments that can calm, inspire, or transport the listener.',
    characteristics: 'Ambient pieces feature long, evolving pad sounds, gentle granular textures, subtle harmonic movement, and minimal percussion. Reverb and delay effects create vast, spacious sound fields. Tracks unfold slowly, with changes happening gradually over time.',
    instruments: ['Synthesizer pads', 'Field recordings', 'Reverb effects', 'Granular textures', 'Soft bells'],
    tempoRange: '60-80 BPM (often tempo-free)',
    moodKeywords: ['Ethereal', 'Dreamy', 'Spacious', 'Calm', 'Meditative'],
    useCases: 'Perfect for meditation, sleep aids, spa environments, nature documentaries, ASMR content, and background music for focused work.',
    history: 'Ambient music was pioneered by Brian Eno in the 1970s, drawing from minimalism, electronic music, and environmental soundscapes. It has grown into a diverse genre spanning new age, dark ambient, and generative music.',
  },
  funk: {
    name: 'Funk',
    icon: '🕺',
    description: 'Funk music is all about the groove — tight, syncopated rhythms driven by slap bass, rhythmic guitar, and punchy horn sections. The genre emphasizes the downbeat, creating an irresistible urge to move. Funk is the foundation of many modern genres including hip hop, R&B, and electronic dance music.',
    characteristics: 'Funk features syncopated bass lines (often slapped), choppy rhythm guitar, tight drum grooves emphasizing the "one," and punchy horn stabs. The production is dry and percussive, with every instrument locked into the rhythmic pocket.',
    instruments: ['Slap bass', 'Rhythm guitar', 'Horns', 'Clavinet', 'Drums', 'Organ'],
    tempoRange: '90-110 BPM',
    moodKeywords: ['Groovy', 'Tight', 'Danceable', 'Punchy', 'Fun'],
    useCases: 'Great for dance content, retro-themed videos, cooking shows, party playlists, and any content that needs a feel-good, head-nodding vibe.',
    history: 'Funk emerged in the mid-1960s through artists like James Brown, Sly and the Family Stone, and Parliament-Funkadelic, emphasizing rhythm and groove over melody and harmony.',
  },
  kpop: {
    name: 'K-Pop',
    icon: '✨',
    description: 'K-Pop (Korean Pop) represents one of the most polished and diverse pop music styles globally, blending catchy melodies with cutting-edge electronic production, hip hop elements, and perfectly choreographed performance aesthetics. AI K-Pop tracks capture the genre\'s signature bright energy and addictive hooks.',
    characteristics: 'K-Pop production features rapid genre shifts within songs, combining EDM drops, hip hop verses, and melodic pop choruses. Arrangements are dense and layered with bright synths, powerful vocal harmonies, and dynamic beat switches. Production quality is exceptionally high.',
    instruments: ['Synthesizers', 'Programmed drums', 'Auto-tune vocals', 'Electric guitar', 'Sub bass'],
    tempoRange: '100-140 BPM',
    moodKeywords: ['Energetic', 'Bright', 'Addictive', 'Dynamic', 'Polished'],
    useCases: 'Perfect for dance content, fan edits, fashion lookbooks, energetic vlogs, and any content targeting a young, trend-conscious audience.',
    history: 'K-Pop emerged as a global phenomenon in the 2010s, building on decades of Korean pop music development and the "Hallyu" (Korean Wave) cultural export movement.',
  },
  rnb: {
    name: 'R&B',
    icon: '💜',
    description: 'R&B (Rhythm and Blues) blends soulful vocal melodies with smooth, groove-oriented production. Modern R&B incorporates electronic beats, lush synth pads, and atmospheric textures while maintaining the genre\'s core emphasis on emotional vocal expression and silky rhythmic feel.',
    characteristics: 'R&B features smooth chord progressions, mellow 808-style bass, soft hi-hat patterns, and warm synth pads. Vocals are central, with melismatic runs and falsetto. Modern production often includes trap-influenced drums and atmospheric reverb.',
    instruments: ['Synth pads', '808 bass', 'Electric piano', 'Soft drums', 'Guitar'],
    tempoRange: '70-100 BPM',
    moodKeywords: ['Smooth', 'Soulful', 'Intimate', 'Sensual', 'Warm'],
    useCases: 'Ideal for lifestyle content, evening ambiance, fashion videos, relationship-themed content, and any media needing a smooth, emotional backdrop.',
    history: 'R&B originated from African American musical traditions including gospel, jazz, and blues. It evolved through Motown, new jack swing, and neo-soul into the contemporary sound blending with hip hop and electronic music.',
  },
  latin: {
    name: 'Latin',
    icon: '🌴',
    description: 'Latin music encompasses the vibrant rhythms of reggaeton, salsa, bachata, and Latin pop, characterized by infectious danceable beats and tropical energy. The dembow rhythm pattern of reggaeton has become one of the most recognizable sounds in modern global pop music.',
    characteristics: 'Latin tracks feature the distinctive dembow rhythm pattern, tropical percussion, bright synth leads, and call-and-response vocal patterns. Production blends urban bass with Caribbean rhythmic elements, creating high-energy dance tracks with infectious groove.',
    instruments: ['Dembow drums', 'Tropical percussion', 'Synth leads', 'Bass', 'Guitar', 'Brass'],
    tempoRange: '85-100 BPM',
    moodKeywords: ['Tropical', 'Danceable', 'Vibrant', 'Party', 'Sunny'],
    useCases: 'Perfect for summer content, dance videos, travel vlogs, party playlists, and any content with a warm, celebratory atmosphere.',
    history: 'Latin music reflects centuries of cultural fusion between Indigenous, African, and European traditions across Latin America and the Caribbean, with reggaeton emerging from Puerto Rico in the 1990s to become a global phenomenon.',
  },
}

export function getGenreContent(genreId: string): GenreContent | null {
  return GENRE_CONTENT[genreId] || null
}

export function getAllGenreIds(): string[] {
  return Object.keys(GENRE_CONTENT)
}
