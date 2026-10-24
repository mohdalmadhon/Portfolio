<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; labelledby: string }>()
const emit = defineEmits<{ close: [] }>()
const root = ref<HTMLElement | null>(null)
let lastFocus: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!root.value) return []
  return [...root.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')]
}

function onKey(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
  if (e.key === 'Tab') {
    const f = focusables()
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      lastFocus = document.activeElement as HTMLElement
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      await nextTick()
      ;(root.value?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus()
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocus?.focus?.()
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="backdrop" @click.self="emit('close')">
        <div ref="root" class="dialog panel panel-solid" role="dialog" aria-modal="true" :aria-labelledby="labelledby">
          <button type="button" class="close btn btn-sm btn-ghost" aria-label="Close dialog" @click="emit('close')">✕</button>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(5, 4, 9, 0.72);
  backdrop-filter: blur(3px);
}
.dialog {
  width: min(880px, 100%);
  max-height: min(88vh, 100%);
  overflow: auto;
  overscroll-behavior: contain;
}
.close {
  position: sticky;
  top: 12px;
  float: right;
  margin: 12px 12px 0 0;
  z-index: 2;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .dialog {
  transform: translateY(12px) scale(0.98);
}
</style>
