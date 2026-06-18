<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

const links = [
  { href: '/about', label: 'About' },
  { href: '/project/', label: 'Projects' },
  { href: '/blog/', label: 'My Thoughts' },
  { href: '/cve/', label: 'My CVEs' },
  { href: '/writeup/', label: 'Writeups' },
]

const path = computed(() => '/' + page.value.relativePath)
function isActive(href: string) {
  const section = href.replace(/\/$/, '')
  if (section === '/about') return path.value.startsWith('/about')
  return path.value.startsWith(section + '/')
}
</script>

<template>
  <header id="top-container" role="navigation">
    <a class="logo-link" href="/">
      <h1>uhg's corner</h1>
      <span>ctf_writeups | security_research | cs_stuff</span>
    </a>
    <nav class="nav-links">
      <template v-for="(l, i) in links" :key="l.href">
        <span v-if="i > 0" class="nav-sep">/</span>
        <a :href="l.href" :class="{ active: isActive(l.href) }">{{ l.label }}</a>
      </template>
    </nav>
  </header>
</template>
