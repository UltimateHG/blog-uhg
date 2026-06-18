<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as blog } from '../../data/blog.data'
import { data as cve } from '../../data/cve.data'
import { data as writeup } from '../../data/writeup.data'

const { frontmatter } = useData()
const sets: Record<string, any[]> = { blog, cve, writeup }
const posts = computed(() => sets[frontmatter.value.category] ?? [])
</script>

<template>
  <h1 class="list-heading">{{ frontmatter.title }}</h1>
  <p v-if="frontmatter.subtitle" class="list-sub">{{ frontmatter.subtitle }}</p>
  <ul class="post-list">
    <li v-for="p in posts" :key="p.url" class="post-list-item">
      <a :href="p.url">
        <span class="pl-title">{{ p.title }}</span>
        <span v-if="p.subtitle"> — <span class="pl-subtitle">{{ p.subtitle }}</span></span>
        <time class="pl-date">{{ p.date }}</time>
        <ul v-if="p.tags && p.tags.length" class="pl-tags">
          <li v-for="t in p.tags" :key="t">#{{ t }}</li>
        </ul>
      </a>
    </li>
  </ul>
  <p v-if="!posts.length" class="list-sub">Nothing here yet.</p>
</template>
