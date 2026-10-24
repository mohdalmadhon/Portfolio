<script setup lang="ts">
import { computed } from 'vue'
import type { MonthBucket } from '../../services/github/derive'

const props = defineProps<{ months: MonthBucket[] }>()
const max = computed(() => Math.max(1, ...props.months.map((m) => Math.max(m.created, m.pushed))))
const H = 90
const W = 14
</script>

<template>
  <div class="tl">
    <div class="scroller">
      <svg :viewBox="`0 0 ${months.length * W * 2 + 8} ${H + 24}`" role="img" :aria-label="`Repository timeline over the last 24 months`">
        <line x1="0" :y1="H" :x2="months.length * W * 2 + 8" :y2="H" stroke="#4d4466" stroke-width="1" />
        <g v-for="(m, i) in months" :key="m.key" :transform="`translate(${i * W * 2 + 4},0)`">
          <title>{{ m.label }}: {{ m.created }} created, {{ m.pushed }} last pushed</title>
          <rect :x="1" :y="H - (m.created / max) * (H - 6)" :width="W - 3" :height="(m.created / max) * (H - 6)" fill="#2fdc7a" />
          <rect :x="W - 1" :y="H - (m.pushed / max) * (H - 6)" :width="W - 3" :height="(m.pushed / max) * (H - 6)" fill="#5ff2e4" />
          <text v-if="i % 3 === 0" :x="2" :y="H + 14" class="lbl">{{ m.label }}</text>
        </g>
      </svg>
    </div>
    <div class="legend">
      <span><i style="background: #2fdc7a" />Repositories created</span>
      <span><i style="background: #5ff2e4" />Repositories whose latest push was that month</span>
    </div>
  </div>
</template>

<style scoped>
.scroller {
  overflow-x: auto;
}
svg {
  display: block;
  width: 100%;
  min-width: 560px;
  height: auto;
  shape-rendering: crispEdges;
}
.lbl {
  font-family: var(--pixel);
  font-size: 8px;
  fill: var(--dim);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.legend i {
  width: 12px;
  height: 12px;
  border: 1px solid #000;
}
</style>
