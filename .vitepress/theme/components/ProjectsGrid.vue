<script setup lang="ts">
import { useData } from 'vitepress'
import { data as projects } from '../../data/project.data'

const { frontmatter } = useData()
</script>

<template>
  <h1 class="list-heading">{{ frontmatter.title }}</h1>
  <p v-if="frontmatter.subtitle" class="list-sub">{{ frontmatter.subtitle }}</p>
  <div class="projects-grid">
    <a v-for="p in projects" :key="p.url" class="project-card" :href="p.url">
      <img v-if="p.thumbnail" class="thumb" :src="p.thumbnail" :alt="p.title" loading="lazy" />
      <div class="card-body">
        <h2 class="card-title">{{ p.title }}</h2>
        <p v-if="p.subtitle" class="card-subtitle">{{ p.subtitle }}</p>
      </div>
    </a>
  </div>
</template>
