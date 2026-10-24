<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'

const items = published(site.interests)
</script>

<template>
  <section id="interests" class="section" aria-labelledby="interests-title" data-section="interests">
    <div class="wrap">
      <SectionHeader id="interests-title" kicker="Hidden loot" title="Interests" icon="diamond" />
      <ul class="loot">
        <li v-for="(it, i) in items" :key="it.title" v-tilt="{ max: 8 }" v-reveal="i % 3" class="item slot">
          <span v-if="it.draft" class="draft-badge">Draft</span>
          <PixelIcon :name="it.icon" :size="48" />
          <strong class="pixel name">{{ it.title }}</strong>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.loot {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.item {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 12px;
  min-height: 150px;
  padding: 18px 14px;
  text-align: center;
}
.name {
  font-size: 15px;
  color: var(--heading);
  line-height: 1.3;
}
</style>
