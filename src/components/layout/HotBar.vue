<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PixelIcon from '../ui/PixelIcon.vue'
import type { SectionDef } from '../../config/sections'
import { useSettings } from '../../composables/useSettings'

const props = defineProps<{ sections: SectionDef[]; active: string }>()
const emit = defineEmits<{ go: [id: string] }>()

const { theme } = useSettings()
const iconFor = (name: string) => (name === 'home' && theme.value === 'dark' ? 'sculk' : name)
const slots = computed(() => props.sections.filter((s) => s.hotbar).slice(0, 9))
const activeTitle = computed(() => props.sections.find((s) => s.id === props.active)?.title ?? '')
const showName = ref(false)
let timer = 0

watch(
  () => props.active,
  () => {
    showName.value = true
    clearTimeout(timer)
    timer = window.setTimeout(() => (showName.value = false), 1800)
  },
)

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
  const n = Number(e.key)
  if (n >= 1 && n <= slots.value.length) {
    e.preventDefault()
    emit('go', slots.value[n - 1].id)
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(timer)
})
</script>

<template>
  <nav class="hotbar-wrap" aria-label="Section hotbar">
    <div class="item-name pixel" :class="{ on: showName }" aria-hidden="true">{{ activeTitle }}</div>
    <ol class="hotbar">
      <li v-for="(s, i) in slots" :key="s.id">
        <button
          type="button"
          class="hb-slot"
          :class="{ active: s.id === active || (active === 'achievements' && s.id === 'experience') }"
          :aria-current="s.id === active ? 'true' : undefined"
          :aria-label="`${s.title} (key ${i + 1})`"
          :title="`${s.title} · ${i + 1}`"
          @click="emit('go', s.id)"
        >
          <PixelIcon :name="iconFor(s.icon)" :size="26" />
          <span class="hb-num pixel" aria-hidden="true">{{ i + 1 }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.hotbar-wrap {
  position: fixed;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 40;
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: calc(100vw - 24px);
  pointer-events: none;
}
.item-name {
  font-size: 14px;
  color: #fff;
  text-shadow: 2px 2px 0 #3f3f3f;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.item-name.on {
  opacity: 1;
  transform: none;
}
.hotbar {
  display: flex;
  margin: 0;
  padding: 3px;
  list-style: none;
  background: rgba(14, 12, 20, 0.88);
  border: 2px solid #000;
  box-shadow: inset 0 0 0 2px #3b3b3b, 0 10px 30px rgba(0, 0, 0, 0.45);
  pointer-events: auto;
  overflow-x: auto;
  scrollbar-width: none;
}
.hb-slot {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 0;
  background: rgba(139, 139, 139, 0.18);
  border: 2px solid #1b1b1b;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.5), inset -2px -2px 0 rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.12s ease;
}
.hb-slot:hover {
  background: rgba(200, 200, 200, 0.26);
}
.hb-slot.active {
  outline: 3px solid #f4f4f4;
  outline-offset: -1px;
  box-shadow: inset 0 0 0 2px #1a1a1a, 0 0 0 3px #000;
  z-index: 1;
}
.hb-slot:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: -1px;
}
.hb-num {
  position: absolute;
  right: 3px;
  bottom: 0;
  font-size: 10px;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
}
@media (max-width: 720px) {
  .hb-slot {
    width: 42px;
    height: 42px;
  }
  .hb-num {
    display: none;
  }
}
</style>
