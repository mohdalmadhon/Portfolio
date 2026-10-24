<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSettings } from '../../composables/useSettings'
import { useWorld } from '../../composables/useWorld'
import { site } from '../../config/site'
import type { WorldEngine } from '../../three/engine'

const emit = defineEmits<{ select: [section: string] }>()
const { settings, reducedMotion, theme } = useSettings()
const world = useWorld()
const canvas = ref<HTMLCanvasElement | null>(null)
const tip = ref<{ label: string; x: number; y: number } | null>(null)
let engine: WorldEngine | null = null
const canvasKey = ref(0)

async function restart() {
  teardown()
  token++
  world.status = settings.world ? 'loading' : 'off'
  world.lensActive = false
  canvasKey.value++
  await nextTick()
  if (settings.world) requestAnimationFrame(() => boot())
}
let token = 0

async function boot() {
  const my = ++token
  if (!settings.world) {
    world.status = 'off'
    return
  }
  world.status = 'loading'
  try {
    const mod = await import('../../three/engine')
    if (my !== token || !canvas.value) return
    if (!mod.isWebGLAvailable()) {
      world.status = 'unsupported'
      return
    }
    const base = import.meta.env.BASE_URL
    engine = new mod.WorldEngine(canvas.value, {
      quality: settings.quality,
      reducedMotion: reducedMotion.value,
      skinUrl: `${base}${site.skin.path}`,
      skeletonUrl: `${base}textures/skeleton.png`,
      capeUrl: site.skin.cape ? `${base}textures/cape.png` : null,
      biome: theme.value === 'dark' ? 'ancient' : 'overworld',
      onHover: (label, x, y) => (tip.value = label ? { label, x, y } : null),
      onSelect: (s) => emit('select', s),
      onCharacterHover: (a) => (world.lensActive = a),
      onContextLost: () => {
        if (my === token) world.status = 'error'
      },
    })
    engine.setSection(world.section)
    engine.setTimeOfDay(world.timeOfDay)
    engine.setXray(world.xray ? 'auto' : 'off')
    await engine.init()
    if (my !== token) return
    world.status = 'ready'
  } catch (err) {
    console.error(err)
    if (my === token) world.status = 'error'
    teardown()
  }
}

function teardown() {
  engine?.dispose()
  engine = null
  tip.value = null
}

watch(() => world.section, (s) => engine?.setSection(s))
watch(() => world.timeOfDay, (t) => engine?.setTimeOfDay(t))
watch(() => world.xray, (x) => engine?.setXray(x ? 'auto' : 'off'))
watch(() => settings.quality, (q) => engine?.setQuality(q))
watch(reducedMotion, (v) => engine?.setReducedMotion(v))
watch(theme, () => {
  if (settings.world) restart()
})
watch(
  () => settings.world,
  () => restart(),
)

onMounted(() => {
  const start = () => boot()
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(start, { timeout: 600 })
  else setTimeout(start, 50)
})
onBeforeUnmount(() => {
  token++
  teardown()
})
</script>

<template>
  <div class="backdrop" :class="[`is-${world.status}`, `biome-${theme}`]" aria-hidden="true">
    <canvas v-if="settings.world" :key="canvasKey" ref="canvas" class="world-canvas" />
    <div class="fallback">
      <div class="sky" />
      <div class="hills hills-back" />
      <div class="hills hills-front" />
    </div>
    <div v-if="tip" class="tip pixel" :style="{ left: `${tip.x + 16}px`, top: `${tip.y + 18}px` }">{{ tip.label }}</div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #0b0a10;
}
.world-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 0.9s ease;
  touch-action: pan-y;
}
.is-ready .world-canvas {
  opacity: 1;
}
.fallback {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transition: opacity 0.9s ease;
}
.is-ready .fallback {
  opacity: 0;
  pointer-events: none;
}
.sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #2b5da8 0%, #6e9fd8 35%, #e9a77c 70%, #2a2350 100%);
}
.hills {
  position: absolute;
  left: -5%;
  right: -5%;
  bottom: 0;
  height: 40%;
  image-rendering: pixelated;
}
.hills-back {
  height: 46%;
  background:
    linear-gradient(180deg, transparent 0 40%, #3f6e2c 40% 44%, #4c3a2a 44%),
    repeating-linear-gradient(90deg, transparent 0 48px, rgba(0, 0, 0, 0.08) 48px 96px);
  clip-path: polygon(0 40%, 8% 40%, 8% 28%, 20% 28%, 20% 36%, 34% 36%, 34% 20%, 46% 20%, 46% 32%, 60% 32%, 60% 24%, 74% 24%, 74% 38%, 88% 38%, 88% 30%, 100% 30%, 100% 100%, 0 100%);
  opacity: 0.75;
}
.hills-front {
  background: linear-gradient(180deg, #5f9e3f 0 8%, #866043 8% 30%, #5c5c62 30%);
  clip-path: polygon(0 30%, 12% 30%, 12% 18%, 26% 18%, 26% 26%, 42% 26%, 42% 12%, 56% 12%, 56% 22%, 72% 22%, 72% 16%, 86% 16%, 86% 28%, 100% 28%, 100% 100%, 0 100%);
}
.biome-dark .sky {
  background: radial-gradient(ellipse at 50% 70%, #0e3440 0%, #061018 45%, #02050a 100%);
}
.biome-dark .hills-back {
  background: linear-gradient(180deg, transparent 0 40%, #1c3a44 40% 44%, #23252a 44%);
}
.biome-dark .hills-front {
  background: linear-gradient(180deg, #0f2a33 0 8%, #2c2c31 8% 40%, #1d1d21 40%);
}
.tip {
  position: fixed;
  z-index: 5;
  padding: 6px 10px;
  font-size: 12px;
  color: #fff;
  background: rgba(16, 0, 16, 0.92);
  border: 2px solid #28045a;
  box-shadow: inset 0 0 0 1px #5000ff55;
  pointer-events: none;
  white-space: nowrap;
}
</style>
