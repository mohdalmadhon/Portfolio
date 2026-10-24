<script setup lang="ts">
import { computed } from 'vue'
import PixelIcon from '../ui/PixelIcon.vue'
import type { SectionDef } from '../../config/sections'
import { site } from '../../config/site'
import { useGithub } from '../../composables/useGithub'
import { safeUrl } from '../../services/safe'

defineProps<{ sections: SectionDef[] }>()
const emit = defineEmits<{ go: [id: string] }>()
const { displayName, profileUrl } = useGithub()
const year = new Date().getFullYear()
const social = computed(() => [
  ...(profileUrl.value ? [{ label: 'GitHub', url: profileUrl.value }] : []),
  ...site.contact.links.map((l) => ({ label: l.label, url: safeUrl(l.url, true) })).filter((l): l is { label: string; url: string } => !!l.url),
])
</script>

<template>
  <footer class="footer" data-section="footer" data-scope="dark">
    <div class="grass" aria-hidden="true" />
    <div class="wrap inner">
      <div class="col brand">
        <p class="pixel name">{{ displayName || 'Portfolio' }}</p>
        <p class="dim">{{ site.title }}</p>
        <p class="dim small">© {{ year }} {{ displayName || 'All rights reserved' }}. Built with Vue, TypeScript and Three.js.</p>
      </div>
      <nav class="col" aria-label="Footer">
        <p class="pixel head">Quick travel</p>
        <ul>
          <li v-for="s in sections" :key="s.id"><button type="button" class="fl" @click="emit('go', s.id)">{{ s.title }}</button></li>
        </ul>
      </nav>
      <div class="col">
        <p class="pixel head">Elsewhere</p>
        <ul>
          <li v-for="l in social" :key="l.url"><a :href="l.url" target="_blank" rel="noopener noreferrer">{{ l.label }}</a></li>
        </ul>
        <button type="button" class="btn btn-sm top" @click="emit('go', 'hero')"><PixelIcon name="chevron" :size="14" style="transform: rotate(180deg)" /> Back to top</button>
      </div>
    </div>
    <p class="wrap disclaimer dim">A fan-made, Minecraft-inspired design with original artwork. Not affiliated with Mojang Studios or Microsoft.</p>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  margin-top: 40px;
  padding-bottom: calc(var(--hotbar-h) + 40px);
  background: linear-gradient(180deg, #4a3a29 0 8px, #2c241b 8px 40px, #18151d 40px);
}
.grass {
  position: absolute;
  top: -14px;
  left: 0;
  right: 0;
  height: 16px;
  background: repeating-linear-gradient(90deg, #5f9e3f 0 16px, #6aa94a 16px 32px, #58923a 32px 48px);
  border-bottom: 2px solid #3a6a26;
}
.inner {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 28px;
  padding-top: 64px;
}
.name {
  margin: 0;
  font-size: 18px;
  color: var(--heading);
}
.col p {
  margin: 4px 0;
}
.small {
  font-size: 13px;
}
.head {
  font-size: 12px;
  color: var(--accent);
}
.col ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 4px 12px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}
.fl {
  padding: 2px 0;
  background: none;
  border: 0;
  color: var(--muted);
  cursor: pointer;
  text-align: left;
}
.fl:hover {
  color: var(--heading);
}
.top {
  margin-top: 16px;
}
.disclaimer {
  margin-top: 36px;
  font-size: 12px;
}
@media (max-width: 760px) {
  .inner {
    grid-template-columns: 1fr;
  }
}
</style>
