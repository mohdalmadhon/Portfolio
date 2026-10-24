<script setup lang="ts">
import PixelIcon from './PixelIcon.vue'

defineProps<{ icon: string; value: string; label: string; hint?: string; loading?: boolean }>()
</script>

<template>
  <div v-tilt="{ max: 10, lift: 3 }" v-reveal class="inv slot" :title="hint">
    <PixelIcon :name="icon" :size="30" />
    <div class="inv-body">
      <span v-if="loading" class="skeleton-line" style="width: 56px; height: 20px" />
      <span v-else class="inv-value pixel">{{ value }}</span>
      <span class="inv-label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.inv {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  min-width: 0;
}
.inv-body {
  display: grid;
  min-width: 0;
}
.inv-value {
  font-size: clamp(20px, 2.4vw, 26px);
  line-height: 1.2;
  color: var(--heading);
  text-shadow: 2px 2px 0 var(--hshadow);
}
.inv-label {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.35;
}
</style>
