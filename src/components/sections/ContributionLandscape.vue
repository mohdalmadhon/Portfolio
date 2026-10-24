<script setup lang="ts">
import { computed } from 'vue'
import type { Contributions } from '../../services/github/types'

const props = defineProps<{ contributions: Contributions }>()

const S = 12
const SHEAR = 5
const DEPTH = 6.2
const LEVEL_H = 6

const palette = [
  { top: '#5a4632', side: '#3f3022', front: '#4a3a29' },
  { top: '#4f8f34', side: '#2f5a1f', front: '#3d7228' },
  { top: '#22b45f', side: '#0f6a36', front: '#178a48' },
  { top: '#2fdc7a', side: '#148a47', front: '#1fb15e' },
  { top: '#5ff2e4', side: '#1d938a', front: '#33c4b8' },
]

const grid = computed(() => {
  const days = props.contributions.days
  if (!days.length) return { cells: [], weeks: 0, max: 0, thresholds: [0, 0, 0] }
  const first = new Date(`${days[0].date}T00:00:00Z`)
  const offset = first.getUTCDay()
  const nonzero = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b)
  const q = (p: number) => nonzero.length ? nonzero[Math.min(nonzero.length - 1, Math.floor(p * nonzero.length))] : 0
  const thresholds = [q(0.25), q(0.5), q(0.8)]
  const level = (c: number) => (c <= 0 ? 0 : c <= thresholds[0] ? 1 : c <= thresholds[1] ? 2 : c <= thresholds[2] ? 3 : 4)
  const cells = days.map((d, i) => {
    const idx = i + offset
    return { ...d, w: Math.floor(idx / 7), d: idx % 7, level: level(d.count) }
  })
  return { cells, weeks: Math.ceil((days.length + offset) / 7), max: nonzero[nonzero.length - 1] ?? 0, thresholds }
})

const width = computed(() => grid.value.weeks * S + 7 * SHEAR + 10)
const height = computed(() => 7 * DEPTH + 4 * LEVEL_H + S + 16)
const ordered = computed(() => [...grid.value.cells].sort((a, b) => a.d - b.d || a.w - b.w))

function shapes(c: { w: number; d: number; level: number }) {
  const x = c.w * S + c.d * SHEAR + 4
  const baseY = 4 * LEVEL_H + 8 + c.d * DEPTH
  const h = 2 + c.level * LEVEL_H
  const topY = baseY - h
  const top = `${x},${topY} ${x + S},${topY} ${x + S + SHEAR},${topY + DEPTH} ${x + SHEAR},${topY + DEPTH}`
  const front = `${x + SHEAR},${topY + DEPTH} ${x + S + SHEAR},${topY + DEPTH} ${x + S + SHEAR},${baseY + DEPTH} ${x + SHEAR},${baseY + DEPTH}`
  const side = `${x + S},${topY} ${x + S + SHEAR},${topY + DEPTH} ${x + S + SHEAR},${baseY + DEPTH} ${x + S},${baseY}`
  return { top, front, side }
}

const summary = computed(() => {
  const cells = grid.value.cells
  const active = cells.filter((c) => c.count > 0).length
  const best = cells.reduce((m, c) => (c.count > (m?.count ?? 0) ? c : m), null as null | (typeof cells)[number])
  return { active, best }
})

const monthLabels = computed(() => {
  const out: { x: number; label: string }[] = []
  let last = ''
  for (const c of grid.value.cells) {
    if (c.d !== 0) continue
    const m = c.date.slice(0, 7)
    if (m === last) continue
    last = m
    const x = c.w * S + 4
    if (out.length && x - out[out.length - 1].x < 30) continue
    out.push({ x, label: new Date(`${c.date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }) })
  }
  return out
})
</script>

<template>
  <div class="land">
    <div class="scroller">
      <svg :viewBox="`0 0 ${width} ${height + 14}`" :width="width * 1.6" role="img" :aria-label="`Activity landscape: ${contributions.total} contributions between ${contributions.from} and ${contributions.to}, ${summary.active} active days.`">
        <g v-for="c in ordered" :key="c.date">
          <title>{{ c.count }} contribution{{ c.count === 1 ? '' : 's' }} on {{ c.date }}</title>
          <polygon :points="shapes(c).front" :fill="palette[c.level].front" />
          <polygon :points="shapes(c).side" :fill="palette[c.level].side" />
          <polygon :points="shapes(c).top" :fill="palette[c.level].top" stroke="rgba(0,0,0,0.28)" stroke-width="0.4" />
        </g>
        <text v-for="m in monthLabels" :key="m.x" :x="m.x" :y="height + 10" class="mlabel">{{ m.label }}</text>
      </svg>
    </div>
    <div class="legend">
      <span class="dim">Less</span>
      <span v-for="(p, i) in palette" :key="i" class="sw" :style="{ background: p.top, boxShadow: `inset 0 -4px 0 ${p.front}` }" :title="i === 0 ? 'No activity' : `Level ${i}`" />
      <span class="dim">More</span>
      <span class="sep" />
      <span class="dim">{{ summary.active }} active days<template v-if="summary.best"> · busiest {{ summary.best.date }} ({{ summary.best.count }})</template></span>
    </div>
  </div>
</template>

<style scoped>
.land {
  display: grid;
  gap: 10px;
}
.scroller {
  overflow-x: auto;
  padding-bottom: 4px;
}
svg {
  display: block;
  min-width: 640px;
  max-width: 100%;
  height: auto;
}
.mlabel {
  font-family: var(--pixel);
  font-size: 6px;
  fill: var(--dim);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}
.sw {
  width: 14px;
  height: 14px;
  border: 1px solid #000;
}
.sep {
  width: 12px;
}
</style>
