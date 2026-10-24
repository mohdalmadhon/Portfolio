<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'

const entries = published(site.experience)
const icon = { work: 'pickaxe', education: 'book', course: 'emerald' } as const
const kindLabel = { work: 'Work', education: 'Education', course: 'Course' } as const
</script>

<template>
  <section id="experience" class="section" aria-labelledby="experience-title" data-section="experience">
    <div class="wrap">
      <SectionHeader id="experience-title" kicker="Chapter 05 · The road" title="Experience & education" icon="map" lead="Each stop on the road so far." />
      <ol class="path">
        <li v-for="(e, i) in entries" :key="i" class="stop">
          <span class="marker slot" aria-hidden="true"><PixelIcon :name="icon[e.kind]" :size="24" /></span>
          <article v-tilt="{ max: 3 }" v-reveal class="panel panel-pad entry">
            <span v-if="e.draft" class="draft-badge">Draft</span>
            <p class="when pixel">{{ e.start }} — {{ e.end }} <span class="kind">{{ kindLabel[e.kind] }}</span></p>
            <h3>{{ e.role }}</h3>
            <p class="org">{{ e.organization }}<span v-if="e.location" class="dim"> · {{ e.location }}</span></p>
            <p class="desc">{{ e.description }}</p>
            <ul v-if="e.achievements?.length" class="ach">
              <li v-for="a in e.achievements" :key="a">{{ a }}</li>
            </ul>
            <ul v-if="e.skills.length" class="skills">
              <li v-for="s in e.skills" :key="s" class="chip">{{ s }}</li>
            </ul>
          </article>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.path {
  position: relative;
  display: grid;
  gap: 22px;
  margin: 0;
  padding: 0 0 0 64px;
  list-style: none;
}
.path::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 10px;
  bottom: 10px;
  width: 8px;
  background: repeating-linear-gradient(180deg, #9a7b4f 0 12px, #8e7046 12px 24px);
  border: 2px solid var(--edge);
}
.stop {
  position: relative;
}
.marker {
  position: absolute;
  left: -64px;
  top: 14px;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  background: #2a2538;
}
.entry {
  display: grid;
  gap: 6px;
}
.when {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}
.kind {
  margin-left: 8px;
  color: var(--dim);
}
h3 {
  margin: 0;
  font-size: 20px;
  color: var(--heading);
}
.org {
  margin: 0;
  font-weight: 600;
  color: var(--muted);
}
.desc {
  margin: 4px 0 0;
}
.ach {
  margin: 0;
  padding-left: 20px;
  color: var(--body);
}
.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}
@media (max-width: 560px) {
  .path {
    padding-left: 48px;
  }
  .path::before {
    left: 16px;
  }
  .marker {
    left: -48px;
    width: 40px;
    height: 40px;
  }
}
</style>
