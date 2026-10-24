<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { site } from '../../config/site'

const canvas = ref<HTMLCanvasElement | null>(null)
const failed = ref(false)

onMounted(() => {
  const img = new Image()
  img.onload = () => {
    const c = canvas.value
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.imageSmoothingEnabled = false
    const s = 10
    const draw = (sx: number, sy: number, w: number, h: number, dx: number, dy: number) => ctx.drawImage(img, sx, sy, w, h, dx * s, dy * s, w * s, h * s)
    draw(4, 20, 4, 12, 4, 20)
    draw(20, 52, 4, 12, 8, 20)
    draw(20, 20, 8, 12, 4, 8)
    draw(44, 20, 4, 12, 0, 8)
    draw(36, 52, 4, 12, 12, 8)
    draw(8, 8, 8, 8, 4, 0)
    if (img.height >= 64) {
      draw(4, 36, 4, 12, 4, 20)
      draw(4, 52, 4, 12, 8, 20)
      draw(20, 36, 8, 12, 4, 8)
      draw(44, 36, 4, 12, 0, 8)
      draw(52, 52, 4, 12, 12, 8)
    }
    draw(40, 8, 8, 8, 4, 0)
  }
  img.onerror = () => (failed.value = true)
  img.src = `${import.meta.env.BASE_URL}${site.skin.path}`
})
</script>

<template>
  <div class="portrait">
    <canvas v-if="!failed" ref="canvas" width="160" height="320" role="img" aria-label="Pixel-art character" />
  </div>
</template>

<style scoped>
.portrait {
  display: grid;
  place-items: center;
}
canvas {
  width: min(180px, 40vw);
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(8px 10px 0 rgba(0, 0, 0, 0.35));
  animation: float 4s ease-in-out infinite;
}
</style>
