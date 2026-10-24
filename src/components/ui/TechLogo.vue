<script setup lang="ts">
import { computed, ref } from 'vue'
import { logoFor } from '../../services/logos'

const props = withDefaults(defineProps<{ name: string; kind?: 'language' | 'tech'; size?: number; color?: string }>(), { kind: 'language', size: 28 })
const failed = ref(false)
const logo = computed(() => (failed.value ? null : logoFor(props.name, props.kind)))
</script>

<template>
  <img
    v-if="logo"
    class="tech-logo"
    :class="{ 'is-dark': logo.dark }"
    :src="logo.src"
    :width="size"
    :height="size"
    :alt="`${name} logo`"
    loading="lazy"
    decoding="async"
    draggable="false"
    @error="failed = true"
  />
  <span v-else-if="color" class="cube" :style="{ '--c': color, width: `${size}px`, height: `${size}px` }" aria-hidden="true"><i /><i /><i /></span>
</template>

<style scoped>
.tech-logo {
  display: block;
  flex: none;
  object-fit: contain;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.35));
}
.cube {
  position: relative;
  display: block;
  flex: none;
}
.cube i {
  position: absolute;
  display: block;
}
.cube i:nth-child(1) {
  inset: 0 0 auto 0;
  height: 34%;
  background: color-mix(in srgb, var(--c) 100%, white 30%);
}
.cube i:nth-child(2) {
  inset: 34% auto 0 0;
  width: 50%;
  background: var(--c);
}
.cube i:nth-child(3) {
  inset: 34% 0 0 50%;
  background: color-mix(in srgb, var(--c) 100%, black 35%);
}
</style>
