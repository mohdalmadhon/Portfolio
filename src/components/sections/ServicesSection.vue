<script setup lang="ts">
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { published } from '../../config/drafts'

const emit = defineEmits<{ go: [id: string] }>()
const items = published(site.services)
</script>

<template>
  <section id="services" class="section" aria-labelledby="services-title" data-section="services">
    <div class="wrap">
      <SectionHeader id="services-title" kicker="Chapter 06 · The toolbelt" title="What I can build for you" icon="pickaxe" />
      <ul class="svc-grid">
        <li v-for="(s, i) in items" :key="s.title" v-tilt v-reveal="i % 3" class="svc panel">
          <span v-if="s.draft" class="draft-badge">Draft</span>
          <span class="frame" aria-hidden="true"><PixelIcon :name="s.icon" :size="40" /></span>
          <h3 class="pixel">{{ s.title }}</h3>
          <p>{{ s.description }}</p>
        </li>
      </ul>
      <div class="cta">
        <button type="button" class="btn btn-primary" @click="emit('go', 'contact')"><PixelIcon name="envelope" :size="18" /> Start a conversation</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.svc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.svc {
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 22px;
  transition: transform 0.15s ease;
}
.svc:hover {
  transform: translateY(-3px);
}
.frame {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #8a6236, #6b4527);
  border: 2px solid var(--edge);
  box-shadow: inset 0 0 0 6px #a57a45, inset 0 0 0 8px #4a2e14;
}
h3 {
  margin: 4px 0 0;
  font-size: 16px;
  color: var(--heading);
  line-height: 1.35;
}
p {
  margin: 0;
  color: var(--body);
  font-size: 15px;
}
.cta {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
