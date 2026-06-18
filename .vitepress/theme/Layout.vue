<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import SiteHeader from './components/SiteHeader.vue'
import PostList from './components/PostList.vue'
import PostArticle from './components/PostArticle.vue'
import ProjectsGrid from './components/ProjectsGrid.vue'
import ProjectPage from './components/ProjectPage.vue'

const { frontmatter, page } = useData()

const layout = computed(() => {
  if (frontmatter.value.layout) return frontmatter.value.layout
  if (page.value.relativePath.startsWith('project/')) return 'project'
  return 'post'
})
</script>

<template>
  <SiteHeader />
  <main id="main-container">
    <div v-if="layout === 'home'" class="home"><Content /></div>
    <div v-else-if="layout === 'page'" class="page-content"><Content /></div>
    <PostList v-else-if="layout === 'list'" />
    <ProjectsGrid v-else-if="layout === 'projects'" />
    <ProjectPage v-else-if="layout === 'project'" />
    <PostArticle v-else />
  </main>
</template>
