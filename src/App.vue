<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import WorldBackdrop from './components/layout/WorldBackdrop.vue'
import TopBar from './components/layout/TopBar.vue'
import HotBar from './components/layout/HotBar.vue'
import FooterBar from './components/layout/FooterBar.vue'
import WelcomeDialog from './components/layout/WelcomeDialog.vue'
import { getSections, showDrafts } from './config/sections'
import { site } from './config/site'
import { useGithub } from './composables/useGithub'
import { useWorld } from './composables/useWorld'
import { useNavigation } from './composables/useNavigation'

const sections = getSections()
const { load, displayName } = useGithub()
const world = useWorld()
const route = useRoute()
const { go } = useNavigation()

watch(displayName, (n) => {
  if (route.name === 'home') document.title = n ? `${n} · ${site.title}` : `${site.title} Portfolio`
})

onMounted(() => load())
</script>

<template>
  <a href="#main" class="skip-link" @click.prevent="go('about')">Skip to content</a>
  <WorldBackdrop @select="go" />
  <TopBar :sections="sections" :active="world.section" :name="displayName" @go="go" />
  <div class="content">
    <div v-if="showDrafts" class="draft-note pixel" role="note">Draft preview · items marked DRAFT are hidden on the live site</div>
    <RouterView v-slot="{ Component }">
      <component :is="Component" :sections="sections" />
    </RouterView>
    <FooterBar :sections="sections" @go="go" />
  </div>
  <HotBar :sections="sections" :active="world.section" @go="go" />
  <WelcomeDialog />
</template>

<style scoped>
.content {
  position: relative;
  z-index: 1;
  pointer-events: none;
}
.content > :deep(*) {
  pointer-events: auto;
}
.content > :deep(main) {
  pointer-events: none;
}
.content > :deep(main > *:not(#hero)) {
  pointer-events: auto;
}
.content > :deep(main.article-wrap) {
  pointer-events: auto;
}
.draft-note {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 41;
  max-width: 280px;
  padding: 6px 10px;
  font-size: 10px;
  color: #2a1f05;
  background: var(--gold);
  border: 2px solid var(--edge);
}
@media (max-width: 900px) {
  .draft-note {
    top: 70px;
    bottom: auto;
  }
}
</style>
