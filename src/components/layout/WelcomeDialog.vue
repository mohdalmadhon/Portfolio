<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ModalDialog from '../ui/ModalDialog.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { hasBeenWelcomed, markWelcomed, useSettings } from '../../composables/useSettings'

const { settings, theme } = useSettings()
const open = ref(false)

onMounted(() => {
  if (!hasBeenWelcomed()) {
    settings.theme = theme.value
    open.value = true
  }
})

function done() {
  markWelcomed()
  open.value = false
}
</script>

<template>
  <ModalDialog :open="open" labelledby="welcome-title" @close="done">
    <div class="welcome">
      <p class="kicker pixel">New visitor</p>
      <h2 id="welcome-title" class="pixel title">Create your world</h2>
      <p class="muted lead">Pick how you’d like to explore. You can change both any time from the ⚙ menu.</p>

      <fieldset class="group">
        <legend class="pixel">World &amp; theme</legend>
        <div class="choices">
          <label class="choice" :class="{ on: settings.theme === 'light' }">
            <input v-model="settings.theme" type="radio" name="welcome-theme" value="light" class="sr-only" />
            <span class="preview overworld"><PixelIcon name="grass" :size="48" /></span>
            <span class="name pixel">Light</span>
            <span class="desc">Sunny overworld island</span>
          </label>
          <label class="choice" :class="{ on: settings.theme === 'dark' }">
            <input v-model="settings.theme" type="radio" name="welcome-theme" value="dark" class="sr-only" />
            <span class="preview ancient"><PixelIcon name="sculk" :size="48" /></span>
            <span class="name pixel">Dark</span>
            <span class="desc">Ancient City in the deep dark</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="pixel">Font</legend>
        <div class="choices">
          <label class="choice" :class="{ on: settings.font === 'pixel' }">
            <input v-model="settings.font" type="radio" name="welcome-font" value="pixel" class="sr-only" />
            <span class="preview sample" style="font-family: 'Silkscreen', monospace">Aa</span>
            <span class="name" style="font-family: 'Silkscreen', monospace">Pixel</span>
            <span class="desc">Blocky, game-style headings</span>
          </label>
          <label class="choice" :class="{ on: settings.font === 'normal' }">
            <input v-model="settings.font" type="radio" name="welcome-font" value="normal" class="sr-only" />
            <span class="preview sample" style="font-family: var(--sans); font-weight: 700">Aa</span>
            <span class="name" style="font-family: var(--sans); font-weight: 700">Normal</span>
            <span class="desc">Clean and easy to read</span>
          </label>
        </div>
      </fieldset>

      <div class="actions">
        <button type="button" class="btn btn-primary" data-autofocus @click="done">
          <PixelIcon name="pickaxe" :size="18" /> Enter world
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.welcome {
  display: grid;
  gap: 16px;
  padding: clamp(20px, 4vw, 36px);
}
.kicker {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}
.title {
  margin: 0;
  font-size: clamp(24px, 4vw, 34px);
  color: var(--heading);
  text-shadow: 3px 3px 0 var(--hshadow);
}
.lead {
  margin: 0;
}
.group {
  margin: 0;
  padding: 0;
  border: 0;
  display: grid;
  gap: 10px;
}
.group legend {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--muted);
}
.choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.choice {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  background: var(--slot-bg);
  border: 2px solid var(--edge);
  box-shadow: var(--slot-bevel);
  transition: transform 0.12s ease, outline-color 0.12s ease;
  outline: 3px solid transparent;
  outline-offset: -1px;
}
.choice:hover {
  transform: translateY(-2px);
}
.choice.on {
  outline-color: var(--accent);
}
.choice:focus-within {
  outline-color: var(--gold);
}
.preview {
  display: grid;
  place-items: center;
  width: 84px;
  height: 64px;
  border: 2px solid var(--edge);
}
.overworld {
  background: linear-gradient(180deg, #8cc8ff, #cfe8ff);
}
.ancient {
  background: radial-gradient(circle at 50% 70%, #0e3440, #03070b);
}
.sample {
  font-size: 30px;
  color: var(--heading);
  background: var(--panel-2);
}
.name {
  font-size: 15px;
  color: var(--heading);
}
.desc {
  font-size: 13px;
  color: var(--muted);
}
.actions {
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 420px) {
  .preview {
    width: 64px;
    height: 52px;
  }
}
</style>
