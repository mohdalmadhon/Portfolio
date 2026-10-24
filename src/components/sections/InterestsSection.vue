<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'

const items = published(site.interests)
const found = ref<Set<number>>(new Set())
function discover(i: number) {
  const next = new Set(found.value)
  next.has(i) ? next.delete(i) : next.add(i)
  found.value = next
}
</script>

<template>
  <section id="interests" class="section" aria-labelledby="interests-title" data-section="interests">
    <div class="wrap">
      <SectionHeader id="interests-title" kicker="Hidden loot" title="Interests & fun facts" icon="diamond" lead="Open each block to discover something about me." />
      <p class="dim count pixel">{{ found.size }} / {{ items.length }} discovered</p>
      <ul class="loot">
        <li v-for="(it, i) in items" :key="i">
          <button type="button" class="block" :class="{ open: found.has(i) }" :aria-expanded="found.has(i)" @click="discover(i)">
            <span v-if="it.draft" class="draft-badge">Draft</span>
            <span class="face front" aria-hidden="true"><PixelIcon name="chest" :size="44" /><span class="pixel q">?</span></span>
            <span class="face back">
              <PixelIcon :name="it.icon" :size="30" />
              <strong>{{ it.title }}</strong>
              <span>{{ it.detail }}</span>
            </span>
            <span v-if="!found.has(i)" class="sr-only">Reveal: {{ it.title }}</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.count {
  margin: -20px 0 16px;
  font-size: 12px;
}
.loot {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.block {
  position: relative;
  display: block;
  width: 100%;
  min-height: 190px;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
  perspective: 800px;
  color: var(--text);
}
.face {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  border: 2px solid var(--edge);
  box-shadow: var(--bevel);
  backface-visibility: hidden;
  transition: transform 0.45s ease;
}
.front {
  background: repeating-linear-gradient(45deg, var(--slot-bg) 0 10px, var(--panel-3) 10px 20px);
}
.q {
  font-size: 22px;
  color: var(--warn);
}
.back {
  background: var(--panel-solid);
  transform: rotateY(180deg);
  font-size: 14.5px;
}
.back strong {
  color: var(--heading);
}
.block.open .front {
  transform: rotateY(-180deg);
}
.block.open .back {
  transform: rotateY(0);
}
</style>
