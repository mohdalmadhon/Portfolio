<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'
import { safeUrl } from '../../services/safe'

const items = published(site.testimonials).map((t) => ({ ...t, link: safeUrl(t.url) }))
</script>

<template>
  <section id="testimonials" class="section" aria-labelledby="testimonials-title" data-section="testimonials">
    <div class="wrap">
      <SectionHeader id="testimonials-title" kicker="Signs along the way" title="What people say" icon="quote" />
      <ul class="signs">
        <li v-for="(t, i) in items" :key="i" class="sign">
          <span v-if="t.draft" class="draft-badge">Draft</span>
          <blockquote class="board">
            <p>“{{ t.quote }}”</p>
          </blockquote>
          <p class="who">
            <a v-if="t.link" :href="t.link" target="_blank" rel="noopener noreferrer">{{ t.name }}</a>
            <strong v-else>{{ t.name }}</strong>
            <span class="dim"> · {{ t.role }}</span>
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.signs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 22px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sign {
  position: relative;
}
.board {
  position: relative;
  margin: 0;
  padding: 22px;
  color: #2a1a0c;
  background: repeating-linear-gradient(180deg, #c49a5c 0 22px, #b38a4f 22px 24px);
  border: 3px solid #4a2e14;
  box-shadow: var(--shadow);
}
.board p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
.board::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -26px;
  width: 12px;
  height: 24px;
  transform: translateX(-50%);
  background: #6b4527;
  border: 2px solid #3a2410;
}
.who {
  margin: 34px 0 0;
  text-align: center;
}
</style>
