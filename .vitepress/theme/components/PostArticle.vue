<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as blog } from '../../data/blog.data'
import { data as cve } from '../../data/cve.data'
import { data as writeup } from '../../data/writeup.data'

const { frontmatter, page } = useData()

const meta: Record<string, { label: string; base: string; set: any[] }> = {
  blog: { label: 'My Thoughts', base: '/blog/', set: blog },
  cve: { label: 'My CVEs', base: '/cve/', set: cve },
  writeup: { label: 'Writeups', base: '/writeup/', set: writeup },
}

const category = computed(() => page.value.relativePath.split('/')[0])
const info = computed(() => meta[category.value])
const cleanUrl = computed(() =>
  ('/' + page.value.relativePath).replace(/\.md$/, '').replace(/\/\d{4}_/, '/'),
)
const idx = computed(() =>
  info.value ? info.value.set.findIndex((p) => p.url === cleanUrl.value) : -1,
)
// list is newest-first: newer = idx-1, older = idx+1
const newer = computed(() => (idx.value > 0 ? info.value!.set[idx.value - 1] : null))
const older = computed(() =>
  info.value && idx.value >= 0 && idx.value < info.value.set.length - 1
    ? info.value.set[idx.value + 1]
    : null,
)
</script>

<template>
  <article>
    <header>
      <h1 class="post-title">{{ frontmatter.title }}</h1>
      <p v-if="frontmatter.subtitle" class="post-subtitle">{{ frontmatter.subtitle }}</p>
      <time class="post-date">{{ frontmatter.date }}</time>
      <ul v-if="frontmatter.tags && frontmatter.tags.length" class="post-tags">
        <li v-for="t in frontmatter.tags" :key="t">#{{ t }}</li>
      </ul>
    </header>

    <div class="post-content"><Content /></div>

    <nav v-if="newer || older" class="post-nav">
      <a v-if="newer" :href="newer.url"><span class="label">← Newer</span>{{ newer.title }}</a>
      <a v-if="older" :href="older.url" class="nav-older"><span class="label">Older →</span>{{ older.title }}</a>
    </nav>

    <div v-if="info" class="back-link-wrap">
      <a class="back-link" :href="info.base">← All {{ info.label }}</a>
    </div>
  </article>
</template>
