import { createContentLoader } from 'vitepress'

const clean = (u: string) => u.replace(/\.html$/, '').replace(/\/\d{4}_/, '/')

export default createContentLoader('writeup/[0-9]*.md', {
  transform(raw) {
    return raw
      .filter((p) => !p.frontmatter.draft)
      .map((p) => ({
        title: p.frontmatter.title ?? '',
        subtitle: p.frontmatter.subtitle ?? '',
        date: p.frontmatter.date ?? '',
        tags: p.frontmatter.tags ?? [],
        url: clean(p.url),
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  },
})
