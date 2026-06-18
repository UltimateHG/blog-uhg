<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <article>
    <img
      v-if="frontmatter.thumbnail"
      class="project-hero"
      :src="frontmatter.thumbnail"
      :alt="frontmatter.title"
    />
    <h1 class="post-title">{{ frontmatter.title }}</h1>
    <p v-if="frontmatter.subtitle" class="post-subtitle">{{ frontmatter.subtitle }}</p>

    <div class="post-content"><Content /></div>

    <div class="back-button-wrap">
      <a class="back-button" href="/project/" title="All Projects">🔥</a>
    </div>
  </article>
</template>
