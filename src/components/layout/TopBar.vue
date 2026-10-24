<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import PixelIcon from '../ui/PixelIcon.vue'
import type { SectionDef } from '../../config/sections'
import { useSettings } from '../../composables/useSettings'
import { useWorld } from '../../composables/useWorld'

defineProps<{ sections: SectionDef[]; active: string; name: string }>()
const emit = defineEmits<{ go: [id: string] }>()
const { settings, theme } = useSettings()
function toggleTheme() {
  settings.theme = theme.value === 'dark' ? 'light' : 'dark'
}
const world = useWorld()
const scrolled = ref(false)
const open = ref<'menu' | 'settings' | null>(null)
const root = ref<HTMLElement | null>(null)

function onScroll() {
  scrolled.value = window.scrollY > 24
}
function onDoc(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = null
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = null
}
function toggle(which: 'menu' | 'settings') {
  open.value = open.value === which ? null : which
}
function go(id: string) {
  open.value = null
  emit('go', id)
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onDoc)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDoc)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <header ref="root" class="topbar" :class="{ scrolled }">
    <div class="tb-inner">
      <button type="button" class="brand" @click="go('hero')">
        <span class="brand-face slot"><PixelIcon name="face" :size="22" /></span>
        <span class="pixel brand-name">{{ name || 'Portfolio' }}</span>
      </button>
      <nav class="tb-links" aria-label="Primary">
        <button
          v-for="s in sections.filter((x) => ['about', 'skills', 'projects', 'activity', 'contact'].includes(x.id))"
          :key="s.id"
          type="button"
          class="tb-link"
          :class="{ active: active === s.id }"
          :aria-current="active === s.id ? 'true' : undefined"
          @click="go(s.id)"
        >
          {{ s.title }}
        </button>
      </nav>
      <div class="tb-actions">
        <button type="button" class="btn btn-sm btn-ghost" :aria-expanded="open === 'menu'" aria-controls="tb-menu" @click="toggle('menu')">
          <span class="burger" aria-hidden="true"><i /><i /><i /></span>
          <span class="hide-sm">Sections</span>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          :aria-label="theme === 'dark' ? 'Switch to light mode (overworld)' : 'Switch to dark mode (Ancient City)'"
          :title="theme === 'dark' ? 'Light mode · Overworld' : 'Dark mode · Ancient City'"
          @click="toggleTheme"
        >
          <PixelIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
        </button>
        <button type="button" class="btn btn-sm btn-ghost" :aria-expanded="open === 'settings'" aria-controls="tb-settings" aria-label="Display settings" @click="toggle('settings')">
          <PixelIcon name="gear" :size="18" />
        </button>
      </div>
    </div>
    <div v-show="open === 'menu'" id="tb-menu" class="pop panel panel-solid">
      <ul class="menu-list">
        <li v-for="s in sections" :key="s.id">
          <button type="button" class="menu-item" :class="{ active: active === s.id }" @click="go(s.id)">
            <PixelIcon :name="s.icon" :size="18" />
            <span>{{ s.title }}</span>
          </button>
        </li>
      </ul>
    </div>
    <div v-show="open === 'settings'" id="tb-settings" class="pop panel panel-solid settings">
      <p class="pixel set-title">Video settings</p>
      <label class="set-row">
        <span>
          <strong>Theme</strong>
          <small class="dim">Light shows the overworld, dark shows the Ancient City.</small>
        </span>
        <select v-model="settings.theme" class="input set-select">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label class="set-row">
        <span>
          <strong>Font</strong>
          <small class="dim">Blocky pixel lettering or a clean, normal typeface.</small>
        </span>
        <select v-model="settings.font" class="input set-select">
          <option value="pixel">Pixel</option>
          <option value="normal">Normal</option>
        </select>
      </label>
      <label class="set-row">
        <span>
          <strong>3D world</strong>
          <small class="dim">Turn off to save battery or on slower devices.</small>
        </span>
        <input v-model="settings.world" type="checkbox" class="toggle" />
      </label>
      <label class="set-row">
        <span>
          <strong>Graphics</strong>
          <small class="dim">Auto keeps motion smooth and uses a lighter world on phones.</small>
        </span>
        <select v-model="settings.quality" class="input set-select" :disabled="!settings.world">
          <option value="auto">Auto</option>
          <option value="high">Fancy</option>
          <option value="low">Fast</option>
        </select>
      </label>
      <label class="set-row">
        <span>
          <strong>Motion</strong>
          <small class="dim">Follows your system preference by default.</small>
        </span>
        <select v-model="settings.motion" class="input set-select">
          <option value="system">System</option>
          <option value="full">Full</option>
          <option value="reduce">Reduced</option>
        </select>
      </label>
      <p v-if="world.status === 'unsupported'" class="note">WebGL isn’t available in this browser, so a static backdrop is shown.</p>
      <p v-else-if="world.status === 'error'" class="note">The 3D world stopped unexpectedly. Toggle it off and on to retry.</p>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 45;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}
.topbar.scrolled {
  background: var(--topbar-bg);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 0 #000, 0 6px 24px rgba(0, 0, 0, 0.35);
}
.tb-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  width: min(1320px, 100% - 24px);
  margin-inline: auto;
  height: 64px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
  min-width: 0;
}
.brand-face {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
}
.brand-name {
  font-size: 15px;
  color: var(--heading);
  text-shadow: 2px 2px 0 var(--hshadow);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tb-links {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.tb-link {
  padding: 8px 12px;
  background: none;
  border: 0;
  color: var(--muted);
  font-family: var(--pixel);
  font-size: 12px;
  letter-spacing: 0.04em;
  cursor: pointer;
  text-shadow: 1px 1px 0 var(--hshadow);
}
.tb-link:hover,
.tb-link.active {
  color: var(--heading);
}
.tb-link.active {
  box-shadow: inset 0 -3px 0 var(--emerald);
}
.tb-actions {
  display: flex;
  gap: 8px;
}
.tb-links + .tb-actions {
  margin-left: 8px;
}
.burger {
  display: grid;
  gap: 3px;
}
.burger i {
  display: block;
  width: 14px;
  height: 2px;
  background: currentColor;
}
.pop {
  position: absolute;
  right: max(12px, calc((100vw - 1320px) / 2));
  top: 64px;
  width: min(340px, calc(100vw - 24px));
  padding: 10px;
}
.menu-list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: 0;
  text-align: left;
  cursor: pointer;
  color: var(--text);
}
.menu-item:hover,
.menu-item.active {
  background: var(--panel-3);
}
.settings {
  display: grid;
  gap: 12px;
  padding: 16px;
}
.set-title {
  margin: 0;
  font-size: 13px;
  color: var(--accent);
}
.set-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.set-row span {
  display: grid;
}
.set-row small {
  font-size: 12px;
  line-height: 1.35;
}
.set-select {
  width: 120px;
  min-height: 38px;
  padding: 6px 30px 6px 10px;
}
.toggle {
  appearance: none;
  width: 48px;
  height: 26px;
  flex: none;
  background: #3a3550;
  border: 2px solid #000;
  position: relative;
  cursor: pointer;
}
.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #c9c4d6;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease;
}
.toggle:checked {
  background: var(--emerald-deep);
}
.toggle:checked::after {
  transform: translateX(22px);
  background: #b9ffd6;
}
.note {
  margin: 0;
  font-size: 13px;
  color: var(--warn);
}
@media (max-width: 960px) {
  .tb-links {
    display: none;
  }
  .tb-actions {
    margin-left: auto;
  }
}
@media (max-width: 520px) {
  .hide-sm {
    display: none;
  }
}
</style>
