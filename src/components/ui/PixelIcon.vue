<script setup lang="ts">
import { computed } from 'vue'
import { BLOCK_ICONS, ICONS } from './icons'
import { isoBlockUrl } from '../../art/isoBlock'

const props = withDefaults(defineProps<{ name: string; size?: number; color?: string; label?: string }>(), { size: 24 })

const block = computed(() => (BLOCK_ICONS[props.name] ? isoBlockUrl(props.name, BLOCK_ICONS[props.name]) : null))
const def = computed(() => ICONS[props.name] ?? ICONS.diamond)
const width = computed(() => Math.max(...def.value.rows.map((r) => r.length)))
const height = computed(() => def.value.rows.length)
const rects = computed(() => {
  const out: { x: number; y: number; w: number; fill: string }[] = []
  def.value.rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.' || !def.value.palette[ch]) {
        x++
        continue
      }
      let w = 1
      while (row[x + w] === ch) w++
      out.push({ x, y, w, fill: props.color ?? def.value.palette[ch] })
      x += w
    }
  })
  return out
})
</script>

<template>
  <img
    v-if="block"
    class="pixel-icon"
    :src="block"
    :width="size"
    :height="size"
    :alt="label ?? ''"
    :aria-hidden="label ? undefined : 'true'"
    draggable="false"
  />
  <svg
    v-else
    class="pixel-icon"
    :viewBox="`0 0 ${width} ${height}`"
    :width="size"
    :height="(size * height) / width"
    shape-rendering="crispEdges"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <rect v-for="(r, i) in rects" :key="i" :x="r.x" :y="r.y" :width="r.w" height="1" :fill="r.fill" />
  </svg>
</template>

<style scoped>
.pixel-icon {
  display: block;
  flex: none;
  image-rendering: pixelated;
}
</style>
