import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATEGORIES = ['blog', 'cve', 'writeup', 'project']

const SITE = 'https://blog.uhg.sg'
const DEFAULT_DESC = 'vulnerability research, exploits and CVEs, CTF writeups'
const DEFAULT_IMAGE = 'https://i.ibb.co/4pRxk6j/trashthumbsup-c-websitethumb.png'

// Pull a representative image + excerpt out of a source markdown file.
function pageMeta(relativePath: string) {
  // pageData.relativePath is the rewritten path (no NNNN_ prefix); map back to
  // the real source file before reading.
  const source = REWRITE_TO_SOURCE[relativePath] || relativePath
  let raw = ''
  try {
    raw = fs.readFileSync(path.join(ROOT, source), 'utf8')
  } catch {
    return { image: null as string | null, excerpt: '' }
  }
  const body = raw.replace(/^---[\s\S]*?---\s*/, '')
  const img = body.match(/!\[[^\]]*\]\((\/images\/[^)\s"]+|https?:\/\/[^)\s"]+)/)
  let excerpt = ''
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || /^[#!>`<|-]/.test(t) || t.startsWith('```')) continue
    excerpt = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '')
    break
  }
  if (excerpt.length > 160) excerpt = excerpt.slice(0, 157).trimEnd() + '…'
  return { image: img ? img[1] : null, excerpt }
}

function cleanPath(relativePath: string) {
  const p = relativePath
    .replace(/\.md$/, '')
    .replace(/\/\d{4}_/, '/')
    .replace(/(^|\/)index$/, '$1')
  return '/' + p
}

function listPosts(cat: string): { file: string; id: number; slug: string }[] {
  const dir = path.join(ROOT, cat)
  if (!fs.existsSync(dir)) return []
  const out: { file: string; id: number; slug: string }[] = []
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(\d{4})_(.+)\.md$/)
    if (m) out.push({ file: f, id: parseInt(m[1], 10), slug: m[2] })
  }
  return out
}

// Strip the local-sort numeric prefix from URLs: writeup/0000_x.md -> /writeup/x
function buildRewrites() {
  const map: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    for (const p of listPosts(cat)) map[`${cat}/${p.file}`] = `${cat}/${p.slug}.md`
  }
  return map
}

function isDraft(cat: string, file: string) {
  return /^\s*draft:\s*true\s*$/m.test(fs.readFileSync(path.join(ROOT, cat, file), 'utf8'))
}

// Drafts: unpublished, no page generated, no redirect stub.
const DRAFTS = CATEGORIES.flatMap((cat) =>
  listPosts(cat)
    .filter((p) => isDraft(cat, p.file))
    .map((p) => `${cat}/${p.file}`),
)

const REWRITES = buildRewrites()
const REWRITE_TO_SOURCE: Record<string, string> = Object.fromEntries(
  Object.entries(REWRITES).map(([src, dst]) => [dst, src]),
)

// Old handmade-blog /article/<id>.html URLs -> new clean paths. Kept explicit
// (not derived from filename prefixes) because blog/cve filenames are
// renumbered per-category, so a file's prefix no longer equals its old global id.
const LEGACY_ARTICLE_REDIRECTS: Record<number, string> = {
  0: '/writeup/redpwn-coffer-overflow',
  1: '/writeup/pdfium-issue-933163',
  2: '/writeup/acrobat-fuzzing-part-1',
  3: '/writeup/acrobat-fuzzing-part-2',
  4: '/writeup/stackctf-android-part-1',
  5: '/writeup/stackctf-android-part-2',
  6: '/writeup/stackctf-android-part-3',
  7: '/writeup/stackctf-android-part-4',
  8: '/writeup/stackctf-osint-2',
  9: '/writeup/acrobat-fuzzing-part-3',
  10: '/writeup/acrobat-fuzzing-part-4',
  11: '/writeup/windows-fuzzing-part-1',
  12: '/writeup/windows-fuzzing-part-2',
  13: '/cve/cve-2021-33760',
  14: '/writeup/greyhats-welcome-ctf-2023',
  15: '/writeup/ecsc-2023-knife-party',
  16: '/writeup/ecsc-2023-flux-capacitor',
  17: '/writeup/ecsc-2023-lady-luck',
  18: '/blog/ecsc-2023-recap',
  19: '/blog/gcc-2024-recap',
  20: '/writeup/hackbash-2024-authors-writeup',
  21: '/writeup/windows-heap-exploration',
  22: '/writeup/greyctf-2024-quals-authors-writeup',
  23: '/writeup/cve-2023-28252',
  24: '/cve/cve-2025-52689',
}

function redirectStub(target: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="https://blog.uhg.sg${target}"><meta http-equiv="refresh" content="0; url=${target}"><title>Redirecting…</title></head><body><p>Redirecting to <a href="${target}">${target}</a>…</p></body></html>`
}

export default defineConfig({
  lang: 'en-US',
  title: "uhg's corner",
  description: 'vulnerability research, exploits and CVEs, CTF writeups',
  titleTemplate: ":title — uhg's corner",
  cleanUrls: true,
  srcExclude: DRAFTS,
  rewrites: REWRITES,

  // Global-only tags. Per-page title/description/OG/Twitter/canonical are
  // injected in transformPageData() below so every page gets a unique card.
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { property: 'og:site_name', content: "uhg's corner" }],
  ],

  transformPageData(pageData) {
    const fm = pageData.frontmatter || {}
    const rel = pageData.relativePath
    const isPost = /^(blog|cve|writeup)\//.test(rel) && !rel.endsWith('index.md')
    const isProject = rel.startsWith('project/') && !rel.endsWith('index.md')

    const { excerpt } = pageMeta(rel)
    const title = fm.title || "uhg's corner"
    const desc = fm.subtitle || fm.description || excerpt || DEFAULT_DESC
    const url = SITE + cleanPath(rel)

    // All share cards use the site default image for now (per-page title and
    // description still differ). To re-enable per-page images, derive from
    // fm.image / project thumbnail / first in-post image here.
    const image = DEFAULT_IMAGE

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { name: 'description', content: desc }],
      ['meta', { property: 'og:type', content: isPost || isProject ? 'article' : 'website' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: desc }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: desc }],
      ['meta', { name: 'twitter:image', content: image }],
    )
  },

  markdown: {
    theme: 'dracula',
    image: { lazyLoading: true },
    lineNumbers: false,
    // Keep ":)" and friends as literal text — disable markdown-it-emoji's
    // emoticon/shortcode conversion (it was turning ":)" into 😃).
    config(md) {
      md.core.ruler.disable('emoji', true)
    },
  },

  sitemap: { hostname: 'https://blog.uhg.sg' },

  // Generate static redirect stubs preserving the old live URLs.
  async buildEnd(siteConfig) {
    const outDir = siteConfig.outDir
    const write = (rel: string, target: string) => {
      const file = path.join(outDir, rel)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, redirectStub(target))
    }
    // posts: old /article/<globalId>.html -> new clean path (explicit map)
    for (const [id, target] of Object.entries(LEGACY_ARTICLE_REDIRECTS)) {
      write(`article/${id}.html`, target)
    }
    // projects: old /work/<index>.html -> /project/<slug>
    for (const p of listPosts('project')) {
      write(`work/${p.id}.html`, `/project/${p.slug}`)
    }
    // old listing pages
    write('articles.html', '/writeup/')
    write('works.html', '/project/')
  },
})
