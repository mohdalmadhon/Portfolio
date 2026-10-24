<script setup lang="ts">
import PixelIcon from './PixelIcon.vue'

defineProps<{ id: string; kicker: string; title: string; icon: string; lead?: string }>()
</script>

<template>
  <header class="sh">
    <div class="sh-kicker">
      <span class="sh-slot slot"><PixelIcon :name="icon" :size="22" /></span>
      <span class="pixel">{{ kicker }}</span>
    </div>
    <h2 :id="id" class="sh-title pixel">{{ title }}</h2>
    <p v-if="lead" class="sh-lead">{{ lead }}</p>
    <slot />
  </header>
</template>

<style scoped>
.sh {
  display: grid;
  gap: 12px;
  margin-bottom: clamp(28px, 4vw, 44px);
  max-width: 760px;
}
.sh-kicker {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--accent);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.sh-slot {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
}
.sh-title {
  margin: 0;
  font-size: clamp(30px, 5vw, 50px);
  line-height: 1.05;
  font-weight: 700;
  color: var(--heading);
  text-shadow: 3px 3px 0 var(--hshadow);
  letter-spacing: 0.01em;
}
.sh-lead {
  margin: 0;
  color: var(--muted);
  font-size: clamp(15px, 1.6vw, 18px);
  max-width: 64ch;
}
</style>
