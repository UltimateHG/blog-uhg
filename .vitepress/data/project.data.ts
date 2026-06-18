import { createContentLoader } from 'vitepress'

const clean = (u: string) => u.replace(/\.html$/, '').replace(/\/\d{4}_/, '/')

export default createContentLoader('project/[0-9]*.md', {
  transform(raw) {
    return raw
      .filter((p) => !p.frontmatter.draft)
      .map((p) => ({
        title: p.frontmatter.title ?? '',
        subtitle: p.frontmatter.subtitle ?? '',
        thumbnail: p.frontmatter.thumbnail ?? '',
        repo: p.frontmatter.repo ?? '',
        url: clean(p.url),
      }))
      // projects sort by id prefix ascending (oldest first), matches old order
      .sort((a, b) => a.url.localeCompare(b.url))
  },
})
