import { computed, reactive, watch } from 'vue'
import type { Quality } from '../three/engine'

const KEY = 'mc-portfolio:settings'

interface Settings {
  world: boolean
  quality: Quality
  motion: 'system' | 'reduce' | 'full'
  theme: 'system' | 'light' | 'dark'
  font: 'pixel' | 'normal'
}

function read(): Partial<Settings> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

const saved = read()
const settings = reactive<Settings>({
  world: saved.world ?? true,
  quality: saved.quality ?? 'auto',
  motion: saved.motion ?? 'system',
  theme: saved.theme ?? 'system',
  font: saved.font === 'normal' ? 'normal' : 'pixel',
})

const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
const systemReduce = reactive({ value: media?.matches ?? false })
media?.addEventListener?.('change', (e) => (systemReduce.value = e.matches))

watch(settings, (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    return
  }
})

const darkMedia = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
const systemDark = reactive({ value: darkMedia?.matches ?? true })
darkMedia?.addEventListener?.('change', (e) => (systemDark.value = e.matches))

const theme = computed<'light' | 'dark'>(() => (settings.theme === 'system' ? (systemDark.value ? 'dark' : 'light') : settings.theme))

watch(
  theme,
  (t) => {
    document.documentElement.dataset.theme = t
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#05080b' : '#8fc6f2')
  },
  { immediate: true },
)

watch(
  () => settings.font,
  (f) => (document.documentElement.dataset.font = f),
  { immediate: true },
)

const WELCOME_KEY = 'mc-portfolio:welcomed'
let welcomedMemory = false

export function hasBeenWelcomed(): boolean {
  if (welcomedMemory) return true
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomed() {
  welcomedMemory = true
  try {
    localStorage.setItem(WELCOME_KEY, '1')
  } catch {
    return
  }
}

const reducedMotion = computed(() => settings.motion === 'reduce' || (settings.motion === 'system' && systemReduce.value))

watch(reducedMotion, (v) => document.documentElement.classList.toggle('reduce-motion', v), { immediate: true })

export function useSettings() {
  return { settings, reducedMotion, theme }
}
