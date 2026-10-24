<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'

const items = published(site.journey)
</script>

<template>
  <section id="journey" class="section" aria-labelledby="journey-title" data-section="journey">
    <div class="wrap">
      <SectionHeader id="journey-title" kicker="The map so far" title="Development journey" icon="compass" />
      <div class="track" tabindex="0" aria-label="Journey timeline, scrollable">
        <ol class="milestones">
          <li v-for="(m, i) in items" :key="i" class="ms">
            <span v-if="m.draft" class="draft-badge">Draft</span>
            <span class="pin slot"><PixelIcon :name="m.icon ?? 'map'" :size="24" /></span>
            <span class="date pixel">{{ m.date }}</span>
            <h3>{{ m.title }}</h3>
            <p>{{ m.description }}</p>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.track {
  overflow-x: auto;
  padding: 8px 2px 16px;
  scroll-snap-type: x proximity;
}
.milestones {
  position: relative;
  display: flex;
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: min-content;
}
.milestones::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 26px;
  height: 6px;
  background: repeating-linear-gradient(90deg, #9a7b4f 0 14px, #7a5f3a 14px 28px);
  border: 2px solid var(--edge);
}
.ms {
  position: relative;
  flex: 0 0 min(280px, 78vw);
  display: grid;
  gap: 6px;
  align-content: start;
  padding: 72px 18px 18px;
  scroll-snap-align: start;
  background: var(--panel);
  border: 2px solid var(--edge);
  box-shadow: var(--bevel);
  margin-top: 0;
}
.pin {
  position: absolute;
  top: 6px;
  left: 18px;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
}
.date {
  font-size: 12px;
  color: var(--accent);
}
h3 {
  margin: 0;
  font-size: 17px;
  color: var(--heading);
}
p {
  margin: 0;
  font-size: 14.5px;
  color: var(--body);
}
</style>
