<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'
import { safeUrl } from '../../services/safe'

const items = published(site.achievements).map((a) => ({ ...a, link: safeUrl(a.verifyUrl) }))
const icon = { certification: 'book', award: 'star', hackathon: 'pickaxe', competition: 'sword', milestone: 'diamond' } as const
</script>

<template>
  <section id="achievements" class="section" aria-labelledby="achievements-title" data-section="achievements">
    <div class="wrap">
      <SectionHeader id="achievements-title" kicker="Advancements" title="Certifications & achievements" icon="star" />
      <ul class="adv-grid">
        <li v-for="(a, i) in items" :key="i" v-tilt v-reveal="i" class="adv" data-scope="dark">
          <span v-if="a.draft" class="draft-badge">Draft</span>
          <span class="adv-icon slot"><PixelIcon :name="icon[a.kind]" :size="30" /></span>
          <div class="adv-body">
            <p class="adv-kicker pixel">Advancement made!</p>
            <h3>{{ a.title }}</h3>
            <p class="adv-desc">{{ a.description }}</p>
            <p class="adv-meta dim">
              <span v-if="a.issuer">{{ a.issuer }}</span>
              <span v-if="a.date"> · {{ a.date }}</span>
              <a v-if="a.link" :href="a.link" target="_blank" rel="noopener noreferrer"> · Verify</a>
            </p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.adv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.adv {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 16px;
  background: #212121;
  border: 2px solid #000;
  box-shadow: inset 0 0 0 2px #555, inset 0 0 0 4px #1a1a1a, var(--shadow);
}
.adv-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  flex: none;
  background: #8b8b8b33;
}
.adv-kicker {
  margin: 0;
  font-size: 11px;
  color: var(--warn);
}
h3 {
  margin: 2px 0 4px;
  font-size: 17px;
  color: var(--heading);
}
.adv-desc {
  margin: 0;
  font-size: 14.5px;
  color: var(--body);
}
.adv-meta {
  margin: 6px 0 0;
  font-size: 13px;
}
</style>
