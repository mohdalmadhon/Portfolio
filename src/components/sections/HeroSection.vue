<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PixelIcon from '../ui/PixelIcon.vue'
import SkinPortrait from '../ui/SkinPortrait.vue'
import { site } from '../../config/site'
import { useGithub } from '../../composables/useGithub'
import { useWorld } from '../../composables/useWorld'

const emit = defineEmits<{ go: [id: string] }>()
const { state, data, derived, displayName, profileUrl } = useGithub()
const world = useWorld()
const cvUrl = ref<string | null>(null)

const login = computed(() => data.value?.login ?? site.githubUsername)
const since = computed(() => (data.value?.profile.createdAt ? new Date(data.value.profile.createdAt).getFullYear() : null))
const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

onMounted(async () => {
  if (!site.cv.path) return
  const url = `${import.meta.env.BASE_URL}${site.cv.path}`
  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (res.ok && (res.headers.get('content-type') || '').includes('pdf')) cvUrl.value = url
  } catch {
    cvUrl.value = null
  }
})
</script>

<template>
  <section id="hero" class="hero" aria-labelledby="hero-title" data-section="hero">
    <div class="hero-inner wrap">
      <div class="hero-card panel">
        <p class="eyebrow pixel">
          <span class="dot" aria-hidden="true" />
          <span v-if="login">Player · @{{ login }}</span>
          <span v-else>Player profile</span>
        </p>
        <h1 id="hero-title" class="name pixel">
          <span v-if="displayName">{{ displayName }}</span>
          <span v-else-if="state.status === 'loading' || state.status === 'idle'" class="skeleton-line name-skel" aria-label="Loading name" />
          <span v-else>Developer Portfolio</span>
        </h1>
        <p class="role pixel">{{ site.title }}<span class="caret" aria-hidden="true" /></p>
        <p class="intro">{{ site.heroIntro }}</p>
        <div class="actions">
          <button type="button" class="btn btn-primary" @click="emit('go', 'projects')">
            <PixelIcon name="chest" :size="18" /> Explore my projects
          </button>
          <a v-if="profileUrl" class="btn" :href="profileUrl" target="_blank" rel="noopener noreferrer">
            <PixelIcon name="code" :size="18" /> View GitHub
          </a>
          <button type="button" class="btn btn-ghost" @click="emit('go', 'contact')">
            <PixelIcon name="envelope" :size="18" /> Contact me
          </button>
          <a v-if="cvUrl" class="btn btn-diamond" :href="cvUrl" download>
            <PixelIcon name="book" :size="18" /> {{ site.cv.label }}
          </a>
        </div>
        <ul v-if="derived" class="facts" aria-label="Quick facts from GitHub">
          <li class="chip"><span class="chip-dot" style="background: var(--emerald)" />{{ derived.totals.ownRepos }} public projects</li>
          <li class="chip"><span class="chip-dot" style="background: var(--diamond)" />{{ derived.languages.length }} languages</li>
          <li v-if="since" class="chip"><span class="chip-dot" style="background: var(--gold)" />On GitHub since {{ since }}</li>
        </ul>
      </div>

      <div class="hero-side">
        <SkinPortrait v-if="world.status !== 'ready' && world.status !== 'loading'" class="portrait" />
        <div v-if="world.status === 'ready'" class="xray-hint" :class="{ active: world.lensActive }">
          <button
            type="button"
            class="btn btn-sm btn-ghost xray-btn"
            :aria-pressed="world.xray"
            @click="world.xray = !world.xray"
          >
            <PixelIcon name="skull" :size="18" />
            {{ world.xray ? 'Stop X-ray' : 'X-ray vision' }}
          </button>
          <span class="hint-text">{{ canHover ? 'or hover over my character' : 'or tap my character' }}</span>
        </div>
      </div>
    </div>
    <button type="button" class="scroll-cue" @click="emit('go', 'about')">
      <span class="pixel">Scroll to explore</span>
      <PixelIcon name="chevron" :size="22" />
    </button>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  align-items: center;
  padding: 96px 0 140px;
  pointer-events: none;
}
.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 600px) 1fr;
  gap: 32px;
  align-items: center;
}
.hero-card {
  pointer-events: auto;
  padding: clamp(22px, 3.4vw, 40px);
  display: grid;
  gap: 14px;
  animation: pop 0.6s ease both;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.06em;
}
.dot {
  width: 10px;
  height: 10px;
  background: var(--emerald);
  box-shadow: 0 0 12px var(--emerald);
}
.name {
  margin: 0;
  font-size: clamp(34px, 6.2vw, 68px);
  line-height: 1.02;
  font-weight: 700;
  color: var(--heading);
  text-shadow: 4px 4px 0 var(--hshadow);
  overflow-wrap: anywhere;
}
.name-skel {
  display: block;
  width: min(420px, 80%);
  height: 52px;
}
.role {
  margin: 0;
  font-size: clamp(16px, 2.2vw, 22px);
  color: var(--accent);
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}
.caret {
  display: inline-block;
  width: 0.55em;
  height: 0.9em;
  margin-left: 6px;
  vertical-align: -0.08em;
  background: var(--emerald);
  animation: blink 1.1s steps(1) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.intro {
  margin: 0;
  max-width: 54ch;
  font-size: clamp(15.5px, 1.6vw, 18px);
  color: var(--body);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}
.facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}
.hero-side {
  display: grid;
  justify-items: center;
  align-self: end;
  gap: 16px;
  min-height: 200px;
}
.portrait {
  pointer-events: none;
}
.xray-hint {
  pointer-events: auto;
  position: absolute;
  right: max(20px, 3vw);
  bottom: calc(var(--hotbar-h) + 40px);
  display: grid;
  justify-items: end;
  gap: 6px;
}
.hint-text {
  font-size: 13px;
  color: #fff;
  text-shadow: 1px 1px 0 #000, 0 0 8px rgba(0, 0, 0, 0.8);
}
.xray-btn[aria-pressed='true'] {
  --b-bg: #1fa7a0;
  --b-top: #8ef8ef;
  --b-bot: #0c5a56;
  --b-fg: #04201e;
}
.scroll-cue {
  pointer-events: auto;
  position: absolute;
  left: 50%;
  bottom: calc(var(--hotbar-h) + 34px);
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: none;
  border: 0;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.6);
}
.scroll-cue :deep(svg) {
  animation: float 1.6s ease-in-out infinite;
}
@media (max-width: 900px) {
  .hero {
    align-items: end;
    padding-top: 52vh;
  }
  .hero-inner {
    grid-template-columns: 1fr;
  }
  .hero-side {
    position: absolute;
    top: 76px;
    left: 0;
    right: 0;
    align-self: start;
    min-height: 0;
  }
  .xray-hint {
    position: absolute;
    top: calc(44vh - 70px);
    right: 16px;
    bottom: auto;
  }
  .scroll-cue {
    display: none;
  }
}
</style>
