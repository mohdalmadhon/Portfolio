<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PixelIcon from '../components/ui/PixelIcon.vue'
import { posts } from '../content/blog'
import { renderMarkdown } from '../services/markdown'
import { formatDate } from '../services/github/derive'
import { useWorld } from '../composables/useWorld'
import { useNavigation } from '../composables/useNavigation'

const route = useRoute()
const world = useWorld()
const { go } = useNavigation()
const post = computed(() => posts.find((p) => p.slug === route.params.slug))
const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ''))
const index = computed(() => posts.findIndex((p) => p.slug === route.params.slug))

function setTitle() {
  document.title = post.value ? `${post.value.title} · Writing` : 'Article not found'
}
onMounted(() => {
  world.section = 'blog'
  world.timeOfDay = 0.6
  window.scrollTo(0, 0)
  setTitle()
})
watch(post, setTitle)
</script>

<template>
  <main id="main" class="article-wrap">
    <div class="wrap narrow">
      <button type="button" class="btn btn-sm btn-ghost back" @click="go('blog')"><PixelIcon name="chevron" :size="14" style="transform: rotate(90deg)" /> All articles</button>
      <article v-if="post" class="panel panel-solid article">
        <header>
          <p class="pixel meta">{{ post.category }} · {{ post.readingMinutes }} min read<span v-if="post.sample" class="sample">Sample content</span></p>
          <h1 class="pixel">{{ post.title }}</h1>
          <p class="dim">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <span v-if="post.tags.length"> · {{ post.tags.map((t) => `#${t}`).join(' ') }}</span>
          </p>
        </header>
        <div class="prose" v-html="html" />
        <nav class="pager" aria-label="More articles">
          <RouterLink v-if="index > 0" :to="`/blog/${posts[index - 1].slug}`" class="btn btn-sm">Newer: {{ posts[index - 1].title }}</RouterLink>
          <RouterLink v-if="index >= 0 && index < posts.length - 1" :to="`/blog/${posts[index + 1].slug}`" class="btn btn-sm">Older: {{ posts[index + 1].title }}</RouterLink>
        </nav>
      </article>
      <div v-else class="panel panel-pad">
        <h1 class="pixel">Article not found</h1>
        <p class="muted">This page may have moved. Head back to the library for all articles.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.article-wrap {
  position: relative;
  padding: 96px 0 120px;
  min-height: 100vh;
}
.narrow {
  max-width: 820px;
}
.back {
  margin-bottom: 16px;
}
.article {
  padding: clamp(22px, 5vw, 52px);
}
.meta {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}
.sample {
  margin-left: 10px;
  padding: 2px 8px;
  background: var(--gold);
  color: #2a1f05;
}
h1 {
  margin: 10px 0;
  font-size: clamp(26px, 4.4vw, 42px);
  line-height: 1.15;
  color: var(--heading);
}
.prose {
  margin-top: 28px;
  font-size: 17px;
  line-height: 1.75;
  color: var(--body);
}
.prose :deep(h2),
.prose :deep(h3) {
  font-family: var(--pixel);
  color: var(--heading);
  line-height: 1.3;
  margin: 1.8em 0 0.6em;
}
.prose :deep(h2) {
  font-size: 22px;
}
.prose :deep(h3) {
  font-size: 18px;
}
.prose :deep(pre) {
  padding: 16px;
  overflow-x: auto;
  background: #0b0910;
  border: 2px solid var(--edge);
  font-size: 14px;
}
.prose :deep(code) {
  font-family: var(--mono);
  font-size: 0.9em;
}
.prose :deep(p > code),
.prose :deep(li > code) {
  padding: 1px 6px;
  background: var(--panel-3);
}
.prose :deep(blockquote) {
  margin: 1.4em 0;
  padding: 4px 18px;
  border-left: 4px solid var(--emerald);
  color: var(--muted);
}
.pager {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-top: 40px;
}
</style>
