import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const CATEGORIES = ['blog', 'cve', 'writeup', 'project']

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
  rewrites: buildRewrites(),

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: "uhg's corner" }],
    ['meta', { property: 'og:description', content: 'vulnerability research, exploits and CVEs, CTF writeups' }],
    ['meta', { property: 'og:image', content: 'https://i.ibb.co/4pRxk6j/trashthumbsup-c-websitethumb.png' }],
    ['meta', { property: 'og:url', content: 'https://blog.uhg.sg' }],
  ],

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
    // posts: old /article/<globalId>.html -> /<cat>/<slug>
    for (const cat of ['blog', 'cve', 'writeup']) {
      for (const p of listPosts(cat)) {
        if (isDraft(cat, p.file)) continue
        write(`article/${p.id}.html`, `/${cat}/${p.slug}`)
      }
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
