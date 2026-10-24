<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'

const items = published(site.learning)
const stages = [
  { key: 'exploring', label: 'Exploring', icon: 'compass' },
  { key: 'building', label: 'Building with it', icon: 'crafting' },
  { key: 'applying', label: 'Applying in projects', icon: 'diamond' },
] as const
const stageIndex = (s: string) => stages.findIndex((x) => x.key === s)
</script>

<template>
  <section id="learning" class="section" aria-labelledby="learning-title" data-section="learning">
    <div class="wrap">
      <SectionHeader id="learning-title" kicker="Currently crafting" title="What I’m learning" icon="emerald" lead="Stages describe what I’m doing with each topic right now — not a skill rating." />
      <ul class="recipes">
        <li v-for="(it, i) in items" :key="it.name" v-tilt="{ max: 4 }" v-reveal="i" class="recipe panel">
          <span v-if="it.draft" class="draft-badge">Draft</span>
          <h3 class="pixel">{{ it.name }}</h3>
          <p class="note">{{ it.note }}</p>
          <ol class="steps" :aria-label="`Stage: ${stages[stageIndex(it.stage)]?.label}`">
            <li v-for="(s, i) in stages" :key="s.key" class="step" :class="{ done: i < stageIndex(it.stage), now: i === stageIndex(it.stage) }">
              <span class="slot cell"><PixelIcon :name="s.icon" :size="20" /></span>
              <span class="lbl">{{ s.label }}</span>
              <span v-if="i < stages.length - 1" class="arrow" aria-hidden="true" />
            </li>
          </ol>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.recipes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.recipe {
  display: grid;
  gap: 10px;
  padding: 20px;
}
h3 {
  margin: 0;
  font-size: 16px;
  color: var(--heading);
}
.note {
  margin: 0;
  color: var(--body);
  font-size: 14.5px;
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
}
.step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
  opacity: 0.4;
}
.step.done,
.step.now {
  opacity: 1;
}
.cell {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
}
.step.now .cell {
  outline: 2px solid var(--emerald);
}
.lbl {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.3;
}
.arrow {
  position: absolute;
  top: 16px;
  right: -10px;
  width: 12px;
  height: 10px;
  background: var(--dim);
  clip-path: polygon(0 30%, 50% 30%, 50% 0, 100% 50%, 50% 100%, 50% 70%, 0 70%);
}
</style>
