<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { posts } from '../../content/blog'
import { formatDate } from '../../services/github/derive'
</script>

<template>
  <section id="blog" class="section" aria-labelledby="blog-title" data-section="blog">
    <div class="wrap">
      <SectionHeader id="blog-title" kicker="Chapter 07 · The library" title="Writing" icon="book" lead="Articles, tutorials and project breakdowns." />
      <ul class="books">
        <li v-for="p in posts" :key="p.slug">
          <RouterLink v-tilt v-reveal :to="`/blog/${p.slug}`" class="book panel">
            <span v-if="p.sample" class="draft-badge">Sample</span>
            <span class="spine" aria-hidden="true"><PixelIcon name="book" :size="34" /></span>
            <span class="meta pixel">{{ p.category }} · {{ p.readingMinutes }} min read</span>
            <span class="title">{{ p.title }}</span>
            <span class="excerpt">{{ p.excerpt }}</span>
            <span class="foot">
              <time :datetime="p.date" class="dim">{{ formatDate(p.date) }}</time>
              <span class="tags"><span v-for="t in p.tags.slice(0, 3)" :key="t" class="chip">#{{ t }}</span></span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.books {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.book {
  display: grid;
  gap: 8px;
  height: 100%;
  padding: 20px;
  color: var(--text);
  text-decoration: none;
  transition: transform 0.15s ease;
}
.book:hover {
  transform: translateY(-3px);
}
.meta {
  font-size: 11px;
  color: var(--accent);
}
.title {
  font-size: 19px;
  font-weight: 700;
  color: var(--heading);
  line-height: 1.3;
}
.excerpt {
  color: var(--body);
  font-size: 14.5px;
}
.foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
}
.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
