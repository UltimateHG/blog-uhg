import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import VideoEmbed from './components/VideoEmbed.vue'
import './custom.css'

export default {
  Layout,
  // Registered globally so posts can drop <VideoEmbed …/> straight into
  // markdown with no per-file <script setup> import.
  enhanceApp({ app }) {
    app.component('VideoEmbed', VideoEmbed)
  },
} satisfies Theme
