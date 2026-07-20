<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** YouTube/Vimeo URL, or a path to a local file under public/videos/. */
    src: string
    /** Caption rendered under the video. */
    caption?: string
    /** Accessible name for the iframe. Falls back to the caption. */
    title?: string
    /** Aspect ratio, "W:H" or "W/H". Ignored for local video (uses intrinsic). */
    ratio?: string
    /** Poster frame for local video. */
    poster?: string
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    /** Local video only; set false for a bare GIF-style clip. */
    controls?: boolean
  }>(),
  { ratio: '16:9', controls: true },
)

const FILE_RE = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i

// "16:9" | "16/9" -> "16 / 9" for the CSS aspect-ratio property.
const aspect = computed(() => {
  const m = String(props.ratio).match(/^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/)
  return m ? `${m[1]} / ${m[2]}` : '16 / 9'
})

// "90" | "1m30s" | "2h3m4s" -> seconds
function toSeconds(raw: string | null): number {
  if (!raw) return 0
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i)
  if (!m) return 0
  return +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0)
}

type Resolved =
  | { kind: 'file'; url: string }
  | { kind: 'iframe'; url: string }
  | { kind: 'unknown'; url: string }

const resolved = computed<Resolved>(() => {
  const raw = (props.src || '').trim()
  if (!raw) return { kind: 'unknown', url: '' }

  // Local/relative path or any direct video file URL -> native <video>.
  if (raw.startsWith('/') || FILE_RE.test(raw)) return { kind: 'file', url: raw }

  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return { kind: 'unknown', url: raw }
  }

  const host = u.hostname.replace(/^www\./, '')
  const start = toSeconds(u.searchParams.get('t') || u.searchParams.get('start'))

  // YouTube: watch?v= / youtu.be/ / shorts/ / embed/ / live/
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') {
    let id = ''
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (u.pathname === '/watch') id = u.searchParams.get('v') || ''
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
      if (m) id = m[1]
    }
    id = id.split('/')[0]
    if (!id) return { kind: 'unknown', url: raw }

    // nocookie domain: no tracking cookies until the viewer actually plays.
    const out = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
    if (start) out.searchParams.set('start', String(start))
    const list = u.searchParams.get('list')
    if (list) out.searchParams.set('list', list)
    if (props.autoplay) {
      out.searchParams.set('autoplay', '1')
      out.searchParams.set('mute', '1') // browsers block unmuted autoplay
    }
    if (props.loop) {
      out.searchParams.set('loop', '1')
      out.searchParams.set('playlist', id) // required for single-video loop
    }
    return { kind: 'iframe', url: out.toString() }
  }

  // Vimeo: vimeo.com/<id> and player.vimeo.com/video/<id>
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(?:\/video)?\/(\d+)/)
    if (!m) return { kind: 'unknown', url: raw }
    const out = new URL(`https://player.vimeo.com/video/${m[1]}`)
    if (props.autoplay) {
      out.searchParams.set('autoplay', '1')
      out.searchParams.set('muted', '1')
    }
    if (props.loop) out.searchParams.set('loop', '1')
    if (start) out.hash = `t=${start}s`
    return { kind: 'iframe', url: out.toString() }
  }

  // Already an embeddable player URL from somewhere else — pass it through.
  if (/\/embed\/|\/player\//.test(u.pathname)) return { kind: 'iframe', url: raw }

  return { kind: 'unknown', url: raw }
})

const label = computed(() => props.title || props.caption || 'Embedded video')
// Autoplay without sound is the only kind browsers permit.
const isMuted = computed(() => props.muted || props.autoplay)
</script>

<template>
  <figure class="video-embed">
    <video
      v-if="resolved.kind === 'file'"
      class="video-embed-player"
      :src="resolved.url"
      :poster="poster"
      :controls="controls"
      :autoplay="autoplay"
      :loop="loop"
      :muted="isMuted"
      :playsinline="true"
      preload="metadata"
    >
      Your browser can't play this video.
      <a :href="resolved.url" download>Download it instead.</a>
    </video>

    <div
      v-else-if="resolved.kind === 'iframe'"
      class="video-embed-frame"
      :style="{ aspectRatio: aspect }"
    >
      <iframe
        :src="resolved.url"
        :title="label"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowfullscreen
      />
    </div>

    <p v-else class="video-embed-fallback">
      Unrecognised video source —
      <a :href="resolved.url" target="_blank" rel="noopener noreferrer">{{ resolved.url }}</a>
    </p>

    <figcaption v-if="caption" class="video-embed-caption">{{ caption }}</figcaption>
  </figure>
</template>
