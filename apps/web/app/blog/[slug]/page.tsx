import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen } from 'lucide-react'
import { notFound } from 'next/navigation'

// All blog post content
const blogPosts: Record<string, {
  title: string
  date: string
  readTime: string
  category: string
  metaDescription: string
  content: React.ReactNode
}> = {
  'how-to-set-custom-ringtone-iphone': {
    title: 'How to Set a Custom Ringtone on iPhone in 2025 (Step-by-Step Guide)',
    date: '2025-01-15',
    readTime: '5 min read',
    category: 'Tutorial',
    metaDescription: 'Learn how to set a custom M4R ringtone on any iPhone. Complete guide covering the GarageBand method, Mac/Finder method, and troubleshooting tips.',
    content: (
      <>
        <p>
          Setting a custom ringtone on iPhone is not as straightforward as Android, but it is absolutely possible —
          and free. Apple requires ringtones to be in <strong>M4R format</strong> and no longer than 30 seconds.
          This guide covers every method available in 2025.
        </p>

        <h2>What You Need</h2>
        <ul>
          <li>An iPhone running iOS 14 or later</li>
          <li>A ringtone file in M4R format (download one from <Link href="/category/iphone" className="text-brand-orange hover:underline">our iPhone ringtone collection</Link>)</li>
          <li>GarageBand app (free from the App Store) or a Mac computer</li>
        </ul>

        <h2>Method 1: Using GarageBand on iPhone (No Computer Needed)</h2>
        <p>This is the easiest method and works entirely on your iPhone.</p>
        <ol>
          <li><strong>Download the M4R file</strong> from Phonezoo. When prompted, save it to the Files app.</li>
          <li><strong>Open GarageBand</strong> on your iPhone. If you do not have it, download it free from the App Store.</li>
          <li>Create a new project by tapping any instrument (Audio Recorder works fine).</li>
          <li>Tap the <strong>track view icon</strong> (third icon in the top toolbar) to switch to the timeline.</li>
          <li>Tap the <strong>loop icon</strong> in the top right corner, then tap <strong>Files</strong>.</li>
          <li>Find your M4R file and <strong>drag it</strong> onto the timeline.</li>
          <li>Tap the <strong>down arrow</strong> in the top left, then tap <strong>My Songs</strong>.</li>
          <li>Long-press the project, tap <strong>Share</strong>, then select <strong>Ringtone</strong>.</li>
          <li>Name your ringtone and tap <strong>Export</strong>.</li>
          <li>You can immediately assign it from the export screen, or go to <strong>Settings &gt; Sounds &amp; Haptics &gt; Ringtone</strong>.</li>
        </ol>

        <h2>Method 2: Using a Mac with Finder</h2>
        <p>If you prefer using a computer, this method is more straightforward.</p>
        <ol>
          <li><strong>Download the M4R file</strong> to your Mac.</li>
          <li><strong>Connect your iPhone</strong> to your Mac with a USB cable.</li>
          <li>Open <strong>Finder</strong> and click your iPhone in the sidebar.</li>
          <li>Click the <strong>General</strong> tab if it is not already selected.</li>
          <li><strong>Drag the M4R file</strong> from your Desktop (or Downloads folder) directly onto the General panel.</li>
          <li>The ringtone will sync to your iPhone. Go to <strong>Settings &gt; Sounds &amp; Haptics &gt; Ringtone</strong> to select it.</li>
        </ol>

        <h2>Method 3: Using iTunes on Windows</h2>
        <ol>
          <li>Download the M4R file to your Windows PC.</li>
          <li>Connect your iPhone via USB and open <strong>iTunes</strong>.</li>
          <li>Click the <strong>device icon</strong> at the top of iTunes.</li>
          <li>Click <strong>Tones</strong> in the left sidebar.</li>
          <li>Drag the M4R file into the Tones panel.</li>
          <li>Click <strong>Sync</strong> to transfer the ringtone to your iPhone.</li>
        </ol>

        <h2>Troubleshooting Common Issues</h2>

        <h3>Ringtone does not appear in Settings</h3>
        <p>
          Make sure the file is in M4R format (not MP3 or M4A). Also verify it is 30 seconds or shorter.
          iPhone will silently reject files that exceed the time limit.
        </p>

        <h3>GarageBand does not show the Ringtone export option</h3>
        <p>
          This usually happens if the audio clip is longer than 30 seconds. Trim it in GarageBand by dragging
          the edges of the clip, then try exporting again.
        </p>

        <h3>File downloads as MP3 instead of M4R</h3>
        <p>
          When downloading from Phonezoo, make sure to select the <strong>M4R format</strong> from the download
          options. If you only have an MP3, you can convert it using our{' '}
          <Link href="/maker" className="text-brand-orange hover:underline">free Ringtone Maker tool</Link>.
        </p>

        <h2>Quick Tips</h2>
        <ul>
          <li>iPhone ringtones must be 30 seconds or shorter</li>
          <li>Text tones must be 30 seconds or shorter (same as ringtones)</li>
          <li>M4R is essentially the same as M4A/AAC, just with a different file extension</li>
          <li>You can assign different ringtones to individual contacts for quick caller identification</li>
          <li>Custom ringtones persist through iOS updates — you only need to set them up once</li>
        </ul>
      </>
    ),
  },

  'how-to-set-ringtone-android': {
    title: 'How to Set a Custom Ringtone on Android (Samsung, Pixel, OnePlus)',
    date: '2025-01-28',
    readTime: '4 min read',
    category: 'Tutorial',
    metaDescription: 'Step-by-step guide to setting custom MP3 ringtones on Samsung Galaxy, Google Pixel, OnePlus, and other Android phones.',
    content: (
      <>
        <p>
          Android makes it much easier than iPhone to use custom ringtones. Most Android phones support MP3 files
          as ringtones directly, with no format conversion needed. Here is how to do it on every major Android brand.
        </p>

        <h2>Universal Method (Works on All Android Phones)</h2>
        <ol>
          <li><strong>Download the MP3 file</strong> from <Link href="/category/android" className="text-brand-orange hover:underline">Phonezoo&apos;s Android ringtone collection</Link>.</li>
          <li>Open your phone&apos;s <strong>Settings</strong> app.</li>
          <li>Navigate to <strong>Sound &amp; Vibration</strong> (or just &quot;Sound&quot;).</li>
          <li>Tap <strong>Phone Ringtone</strong>.</li>
          <li>Tap <strong>Add Ringtone</strong> (or the + icon).</li>
          <li>Browse to the downloaded MP3 file and select it.</li>
          <li>Tap <strong>Save</strong> or <strong>OK</strong>.</li>
        </ol>

        <h2>Samsung Galaxy Specific Instructions</h2>
        <p>Samsung phones have their own interface for ringtone settings.</p>
        <ol>
          <li>Go to <strong>Settings &gt; Sounds and Vibration &gt; Ringtone</strong>.</li>
          <li>Tap the <strong>+</strong> button at the top right.</li>
          <li>Select your downloaded MP3 from the file browser.</li>
          <li>The ringtone will appear in your ringtone list. Tap it to select.</li>
        </ol>
        <p>
          <strong>Samsung tip:</strong> You can also use the <strong>My Files</strong> app to move your MP3 directly
          to the <code>Ringtones</code> folder on your internal storage. Files in this folder automatically appear
          in the ringtone picker.
        </p>

        <h2>Google Pixel Instructions</h2>
        <ol>
          <li>Go to <strong>Settings &gt; Sound &amp; Vibration &gt; Phone ringtone</strong>.</li>
          <li>Scroll down and tap <strong>Add a ringtone</strong>.</li>
          <li>Select the MP3 file from your Downloads folder.</li>
          <li>Tap the ringtone name to set it as your default.</li>
        </ol>

        <h2>OnePlus Instructions</h2>
        <ol>
          <li>Go to <strong>Settings &gt; Sound &amp; Vibration &gt; Ringtone</strong>.</li>
          <li>Tap <strong>Choose from files</strong> at the bottom.</li>
          <li>Select the downloaded MP3 file.</li>
          <li>Confirm your selection.</li>
        </ol>

        <h2>Alternative: Using a File Manager</h2>
        <p>
          On any Android phone, you can use a file manager app to move your ringtone MP3 files to the
          <code> /Ringtones</code> folder on your internal storage. Any MP3 file in this folder will
          automatically appear in your ringtone picker. This is especially useful if you download multiple
          ringtones at once.
        </p>

        <h2>Setting Notification and Alarm Sounds</h2>
        <p>
          The same process works for notification sounds and alarm tones. Instead of selecting &quot;Ringtone&quot;
          in Settings, choose <strong>Notification Sound</strong> or use the <strong>Clock app</strong> to set
          alarm tones. Check out our <Link href="/category/sms" className="text-brand-orange hover:underline">notification tones</Link> and{' '}
          <Link href="/category/alarm" className="text-brand-orange hover:underline">alarm sounds</Link> collections.
        </p>

        <h2>Assigning Ringtones to Specific Contacts</h2>
        <ol>
          <li>Open the <strong>Contacts</strong> app.</li>
          <li>Tap the contact you want to customize.</li>
          <li>Tap <strong>Edit</strong> (pencil icon).</li>
          <li>Scroll down and tap <strong>Ringtone</strong> (on Samsung) or look for sound settings.</li>
          <li>Select your custom ringtone.</li>
        </ol>

        <h2>Supported Formats</h2>
        <p>
          Android supports these audio formats as ringtones: <strong>MP3</strong>, <strong>WAV</strong>,{' '}
          <strong>OGG</strong>, <strong>AAC</strong>, and <strong>FLAC</strong>. MP3 is the most widely
          compatible option and what we recommend for most users.
        </p>
      </>
    ),
  },

  'ringtone-formats-explained-mp3-m4r-wav-flac': {
    title: 'Ringtone Formats Explained: MP3 vs M4R vs WAV vs FLAC — Which One Do You Need?',
    date: '2025-02-10',
    readTime: '6 min read',
    category: 'Guide',
    metaDescription: 'Complete guide to ringtone audio formats. Learn the differences between MP3, M4R, WAV, FLAC, AAC, and OGG, and which format works best for your phone.',
    content: (
      <>
        <p>
          With so many audio formats available, choosing the right one for your ringtone can be confusing.
          This guide explains each format in plain language and tells you exactly which one to pick for your device.
        </p>

        <h2>Quick Answer: Which Format Should I Choose?</h2>
        <ul>
          <li><strong>iPhone user?</strong> Download <strong>M4R</strong> — it is the only format iPhones accept as ringtones.</li>
          <li><strong>Android user?</strong> Download <strong>MP3</strong> — universal compatibility, good quality.</li>
          <li><strong>Want the best quality?</strong> Download <strong>WAV</strong> or <strong>FLAC</strong> — lossless audio.</li>
          <li><strong>Not sure?</strong> Download <strong>MP3</strong> — it works on everything.</li>
        </ul>

        <h2>Format Breakdown</h2>

        <h3>MP3 (MPEG Audio Layer 3)</h3>
        <p>
          MP3 is the most universal audio format. It works on virtually every device and music player ever made.
          MP3 uses lossy compression, meaning it removes audio data that most people cannot hear to achieve smaller
          file sizes. At 320kbps (the highest quality), MP3 sounds nearly identical to the original recording.
        </p>
        <ul>
          <li><strong>Best for:</strong> Android phones, universal compatibility</li>
          <li><strong>File size:</strong> Small (a 30-second ringtone is about 500KB at 320kbps)</li>
          <li><strong>Quality:</strong> Very good at 320kbps, acceptable at 192kbps</li>
          <li><strong>Compatibility:</strong> Works on every phone, computer, and media player</li>
        </ul>

        <h3>M4R (iPhone Ringtone)</h3>
        <p>
          M4R is Apple&apos;s proprietary ringtone format. Technically, it is identical to AAC/M4A audio but with a
          different file extension that tells iOS to treat it as a ringtone. M4R files must be 30 seconds or shorter
          to be accepted by iPhone.
        </p>
        <ul>
          <li><strong>Best for:</strong> iPhone and iPad exclusively</li>
          <li><strong>File size:</strong> Small (similar to MP3)</li>
          <li><strong>Quality:</strong> Excellent — AAC codec is more efficient than MP3</li>
          <li><strong>Compatibility:</strong> iPhone/iPad only. Will not work as an Android ringtone.</li>
        </ul>

        <h3>WAV (Waveform Audio)</h3>
        <p>
          WAV is an uncompressed audio format that preserves every bit of the original recording. It offers the
          highest possible audio quality but produces much larger files. Most phones support WAV, but the file size
          is generally unnecessary for ringtones.
        </p>
        <ul>
          <li><strong>Best for:</strong> Audio enthusiasts, professional use, editing</li>
          <li><strong>File size:</strong> Large (a 30-second clip is about 5MB)</li>
          <li><strong>Quality:</strong> Perfect — no compression, no data loss</li>
          <li><strong>Compatibility:</strong> Works on most devices, but some older phones may not support it</li>
        </ul>

        <h3>FLAC (Free Lossless Audio Codec)</h3>
        <p>
          FLAC provides the same perfect audio quality as WAV but with lossless compression that reduces file
          size by about 50-60%. It is the ideal format when you want lossless quality without the massive file sizes.
        </p>
        <ul>
          <li><strong>Best for:</strong> Audiophiles who want lossless quality in a smaller package</li>
          <li><strong>File size:</strong> Medium (about 2-3MB for a 30-second clip)</li>
          <li><strong>Quality:</strong> Perfect — lossless compression preserves all audio data</li>
          <li><strong>Compatibility:</strong> Most modern Android phones. iPhones do NOT support FLAC as ringtones.</li>
        </ul>

        <h3>AAC (Advanced Audio Coding)</h3>
        <p>
          AAC is a lossy format like MP3 but is more efficient — it produces better sound quality at the same
          bitrate. It is the default format for Apple Music and iTunes purchases. AAC is widely supported on
          both iPhone and Android.
        </p>
        <ul>
          <li><strong>Best for:</strong> High quality at small file sizes</li>
          <li><strong>File size:</strong> Smaller than MP3 at equivalent quality</li>
          <li><strong>Quality:</strong> Excellent</li>
          <li><strong>Compatibility:</strong> Wide support on both iOS and Android</li>
        </ul>

        <h3>OGG (Ogg Vorbis)</h3>
        <p>
          OGG is an open-source lossy audio format. It offers better compression than MP3 and is completely
          free of patents and licensing fees. Android has native OGG support, but Apple devices do not.
        </p>
        <ul>
          <li><strong>Best for:</strong> Android users who prefer open formats</li>
          <li><strong>File size:</strong> Small (similar to or smaller than MP3)</li>
          <li><strong>Quality:</strong> Very good, often better than MP3 at the same bitrate</li>
          <li><strong>Compatibility:</strong> Android, Linux, and most media players. NOT supported on iPhone.</li>
        </ul>

        <h2>Format Comparison Table</h2>
        <p>
          Here is a quick reference comparing all formats. For ringtones, MP3 and M4R cover the vast majority
          of use cases. Use WAV or FLAC only if you specifically need lossless audio quality.
        </p>

        <h2>How to Convert Between Formats</h2>
        <p>
          If you downloaded a ringtone in one format but need another, use our free{' '}
          <Link href="/maker" className="text-brand-orange hover:underline">Ringtone Maker</Link> tool.
          It converts between all six formats (MP3, M4R, WAV, FLAC, AAC, OGG) directly in your browser.
          No software installation needed, and your files are processed locally for complete privacy.
        </p>
      </>
    ),
  },

  'best-free-ringtones-2025': {
    title: 'The 15 Best Free Ringtones to Download in 2025',
    date: '2025-02-25',
    readTime: '4 min read',
    category: 'Roundup',
    metaDescription: 'Our curated list of the 15 best free ringtones for 2025. Hand-picked from Phonezoo\'s most downloaded and highest-rated tones across all categories.',
    content: (
      <>
        <p>
          With thousands of ringtones in our library, finding the perfect one can be overwhelming.
          We have curated this list of the 15 most popular and highest-rated free ringtones based on
          download counts, user ratings, and community feedback.
        </p>

        <h2>How We Selected These Ringtones</h2>
        <p>
          Each ringtone on this list was chosen based on three criteria: total downloads (popularity),
          average user rating (quality), and variety (covering different genres and use cases). All ringtones
          are available for free download in MP3 (Android) and M4R (iPhone) formats.
        </p>

        <h2>Top Picks by Category</h2>

        <h3>Best for Everyday Use</h3>
        <p>
          Clean, professional ringtones that work in any setting — from the office to a restaurant.
          These tones are loud enough to hear but pleasant enough that nobody will cringe when your phone rings.
          Browse our <Link href="/category/trending" className="text-brand-orange hover:underline">trending collection</Link> for
          the latest popular picks.
        </p>

        <h3>Best for iPhone</h3>
        <p>
          iPhone-optimized tones that replace the default Marimba and other stock Apple sounds. All available
          in M4R format for direct import. Our <Link href="/category/iphone" className="text-brand-orange hover:underline">iPhone ringtone collection</Link> has
          hundreds of tones specifically designed for iOS devices.
        </p>

        <h3>Best Notification Sounds</h3>
        <p>
          Short, punchy sounds perfect for text messages and app notifications. These are designed to be
          attention-grabbing without being disruptive. Check out our full{' '}
          <Link href="/category/sms" className="text-brand-orange hover:underline">notification sounds collection</Link>.
        </p>

        <h3>Best Funny Ringtones</h3>
        <p>
          If you want your phone to make people laugh, these are for you. From classic comedy clips to
          viral sound effects, our <Link href="/category/funny" className="text-brand-orange hover:underline">funny ringtones</Link> are
          crowd-pleasers.
        </p>

        <h3>Best Alarm Sounds</h3>
        <p>
          Never oversleep again with these energizing alarm tones. Ranging from gentle morning melodies
          to impossible-to-ignore alarm sounds. See the full{' '}
          <Link href="/category/alarm" className="text-brand-orange hover:underline">alarm sounds collection</Link>.
        </p>

        <h2>How to Download and Set Your Ringtone</h2>
        <p>
          Every ringtone on Phonezoo is free to download. Simply browse our categories, preview any tone with
          the built-in player, and download in your preferred format. For a step-by-step guide on setting
          ringtones, check out our tutorials for{' '}
          <Link href="/blog/how-to-set-custom-ringtone-iphone" className="text-brand-orange hover:underline">iPhone</Link> and{' '}
          <Link href="/blog/how-to-set-ringtone-android" className="text-brand-orange hover:underline">Android</Link>.
        </p>

        <h2>Make Your Own Ringtone</h2>
        <p>
          Cannot find exactly what you want? Use our free{' '}
          <Link href="/maker" className="text-brand-orange hover:underline">Ringtone Maker</Link> to create
          a custom ringtone from any audio file. Upload your song, trim it to the perfect clip, and download
          in any format — all for free, directly in your browser.
        </p>
      </>
    ),
  },

  'how-to-make-ringtone-from-any-song': {
    title: 'How to Make a Ringtone From Any Song (Free, No Software Needed)',
    date: '2025-03-08',
    readTime: '5 min read',
    category: 'Tutorial',
    metaDescription: 'Step-by-step guide to creating a custom ringtone from any song using Phonezoo\'s free browser-based tool. No downloads or software required.',
    content: (
      <>
        <p>
          Want to use your favorite song as a ringtone? With Phonezoo&apos;s free Ringtone Maker, you can turn any
          audio file into a custom ringtone in under a minute — directly from your web browser. No app downloads,
          no software installation, and no account signup required.
        </p>

        <h2>What You Will Need</h2>
        <ul>
          <li>An audio file of the song you want to use (MP3, WAV, M4A, OGG, FLAC, or AAC)</li>
          <li>A web browser (Chrome, Safari, Firefox, or Edge)</li>
          <li>That is it — no additional software needed</li>
        </ul>

        <h2>Step-by-Step Instructions</h2>

        <h3>Step 1: Open the Ringtone Maker</h3>
        <p>
          Go to <Link href="/maker" className="text-brand-orange hover:underline">phonezoo.com/maker</Link> in
          your browser. The tool works on phones, tablets, and computers.
        </p>

        <h3>Step 2: Upload Your Audio File</h3>
        <p>
          Click <strong>&quot;Upload Audio File&quot;</strong> or drag and drop your file onto the upload area.
          The tool accepts MP3, WAV, M4A, OGG, FLAC, and AAC files up to 50MB.
        </p>

        <h3>Step 3: Select the Ringtone Section</h3>
        <p>
          Once uploaded, you will see a waveform visualization of your audio. Drag the left and right handles
          to select the section you want as your ringtone. Most ringtones are 15-30 seconds long. For iPhone,
          the maximum length is 30 seconds.
        </p>

        <h3>Step 4: Preview Your Selection</h3>
        <p>
          Press the <strong>Play</strong> button to hear your selected section. Adjust the handles until
          you are happy with the result. The loop feature lets you hear how it sounds on repeat.
        </p>

        <h3>Step 5: Choose Your Format and Download</h3>
        <p>
          Select your output format. Choose <strong>M4R for iPhone</strong> or <strong>MP3 for Android</strong>.
          Then click <strong>Download</strong>. The conversion happens instantly in your browser.
        </p>

        <h3>Step 6: Set It as Your Ringtone</h3>
        <p>
          Follow the instructions for your device. We have detailed guides for both{' '}
          <Link href="/blog/how-to-set-custom-ringtone-iphone" className="text-brand-orange hover:underline">iPhone</Link> and{' '}
          <Link href="/blog/how-to-set-ringtone-android" className="text-brand-orange hover:underline">Android</Link>.
        </p>

        <h2>Tips for a Great Ringtone</h2>
        <ul>
          <li><strong>Choose a distinctive section</strong> — pick the chorus, a memorable hook, or a unique instrumental break</li>
          <li><strong>Keep it short</strong> — 15-30 seconds is ideal. You want to answer before it loops</li>
          <li><strong>Start strong</strong> — begin with a noticeable sound so you hear it immediately</li>
          <li><strong>Avoid quiet beginnings</strong> — a ringtone that starts with silence is easy to miss</li>
          <li><strong>Test at different volumes</strong> — make sure it sounds good both loud and quiet</li>
        </ul>

        <h2>Privacy and Security</h2>
        <p>
          Phonezoo&apos;s Ringtone Maker processes audio entirely in your browser using WebAssembly technology.
          Your files are <strong>never uploaded</strong> to any server. All cutting, trimming, and format
          conversion happens locally on your device, making it completely private and secure.
        </p>

        <h2>Frequently Asked Questions</h2>

        <h3>Can I use copyrighted music?</h3>
        <p>
          You can create ringtones from music you own for personal use. Setting a song as your own ringtone
          is generally considered personal use. However, you should not redistribute copyrighted ringtones.
        </p>

        <h3>What is the best ringtone length?</h3>
        <p>
          Most ringtones are between 15 and 30 seconds. iPhone has a hard limit of 30 seconds for ringtones.
          For notification sounds, 1-5 seconds works best.
        </p>

        <h3>Why choose Phonezoo over a ringtone app?</h3>
        <p>
          Unlike downloadable apps, Phonezoo works directly in your browser — no installation needed, no
          storage space used, no app permissions required. It also processes everything locally, so your
          files stay completely private.
        </p>
      </>
    ),
  },
}

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = blogPosts[params.slug]
  if (!post) return { title: 'Post Not Found | Phonezoo Blog' }

  return {
    title: `${post.title} | Phonezoo Blog`,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      url: `https://phonezoo.com/blog/${params.slug}`,
      publishedTime: post.date,
    },
    alternates: {
      canonical: `https://phonezoo.com/blog/${params.slug}`,
    },
  }
}

export function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }))
}

export default function BlogPostPage({ params }: PageProps) {
  const post = blogPosts[params.slug]
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-bg-main text-brand-text">
      {/* Header */}
      <div className="bg-bg-panel border-b border-bg-border">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-brand-orange hover:text-brand-orangeHover mb-6 transition text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-0.5 bg-brand-orange/10 text-brand-orange text-xs font-bold rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-brand-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> {post.readTime}
            </span>
            <span className="text-xs text-brand-muted">
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{post.title}</h1>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-10">
        <div className="prose prose-invert prose-sm md:prose-base max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-brand-text prose-p:leading-relaxed prose-p:mb-4
          prose-li:text-brand-text prose-li:leading-relaxed
          prose-strong:text-white
          prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline
          prose-ul:mb-4 prose-ol:mb-4
          prose-code:text-brand-orange prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        ">
          {post.content}
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Ready to Get Your Custom Ringtone?</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/category/trending" className="bg-brand-orange hover:bg-brand-orangeHover text-white px-6 py-3 rounded-full font-bold text-sm transition">
              Browse Ringtones
            </Link>
            <Link href="/maker" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-full font-bold text-sm transition">
              Make Your Own
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <h3 className="text-lg font-bold text-white mb-4">More from the Blog</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(blogPosts)
              .filter(([slug]) => slug !== params.slug)
              .slice(0, 2)
              .map(([slug, relatedPost]) => (
                <Link key={slug} href={`/blog/${slug}`} className="bg-bg-panel border border-white/5 rounded-xl p-4 hover:border-brand-orange/30 transition group">
                  <span className="text-xs text-brand-orange font-bold">{relatedPost.category}</span>
                  <h4 className="text-white font-semibold text-sm mt-1 group-hover:text-brand-orange transition line-clamp-2">
                    {relatedPost.title}
                  </h4>
                  <span className="text-xs text-brand-muted mt-2 block">{relatedPost.readTime}</span>
                </Link>
              ))}
          </div>
        </div>
      </article>
    </div>
  )
}
