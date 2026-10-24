<script setup lang="ts">
import PixelIcon from './PixelIcon.vue'

defineProps<{ kind: 'loading' | 'error' | 'empty'; title: string; message?: string; actionLabel?: string }>()
const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="state panel" :role="kind === 'error' ? 'alert' : 'status'" :aria-busy="kind === 'loading' ? 'true' : undefined">
    <div class="icon" :class="kind">
      <PixelIcon :name="kind === 'error' ? 'skull' : kind === 'empty' ? 'chest' : 'pickaxe'" :size="34" />
    </div>
    <p class="pixel title">{{ title }}</p>
    <p v-if="message" class="muted msg">{{ message }}</p>
    <slot />
    <button v-if="actionLabel" type="button" class="btn btn-sm" @click="emit('action')">{{ actionLabel }}</button>
  </div>
</template>

<style scoped>
.title {
  margin: 0;
  font-size: 15px;
}
.msg {
  margin: 0;
  max-width: 56ch;
}
.icon.loading {
  animation: mine 0.9s steps(4) infinite;
  transform-origin: 60% 80%;
}
@keyframes mine {
  0%,
  100% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(18deg);
  }
}
</style>
