<script setup lang="ts">
import { onBeforeUnmount, onMounted, type Component } from 'vue'
import HeroSection from '../components/sections/HeroSection.vue'
import AboutSection from '../components/sections/AboutSection.vue'
import SkillsSection from '../components/sections/SkillsSection.vue'
import ProjectsSection from '../components/sections/ProjectsSection.vue'
import ActivitySection from '../components/sections/ActivitySection.vue'
import ExperienceSection from '../components/sections/ExperienceSection.vue'
import AchievementsSection from '../components/sections/AchievementsSection.vue'
import ServicesSection from '../components/sections/ServicesSection.vue'
import TestimonialsSection from '../components/sections/TestimonialsSection.vue'
import BlogSection from '../components/sections/BlogSection.vue'
import LearningSection from '../components/sections/LearningSection.vue'
import JourneySection from '../components/sections/JourneySection.vue'
import InterestsSection from '../components/sections/InterestsSection.vue'
import ContactSection from '../components/sections/ContactSection.vue'
import type { SectionDef } from '../config/sections'
import { useWorld } from '../composables/useWorld'
import { useNavigation } from '../composables/useNavigation'

const props = defineProps<{ sections: SectionDef[] }>()
const world = useWorld()
const { go } = useNavigation()

const map: Record<string, Component> = {
  hero: HeroSection,
  about: AboutSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  activity: ActivitySection,
  experience: ExperienceSection,
  achievements: AchievementsSection,
  services: ServicesSection,
  testimonials: TestimonialsSection,
  blog: BlogSection,
  learning: LearningSection,
  journey: JourneySection,
  interests: InterestsSection,
  contact: ContactSection,
}

let raf = 0
function measure() {
  raf = 0
  const line = window.innerHeight * 0.42
  let current = 'hero'
  for (const el of document.querySelectorAll<HTMLElement>('[data-section]')) {
    if (el.getBoundingClientRect().top <= line) current = el.dataset.section ?? current
  }
  world.section = current
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const p = window.scrollY / max
  world.timeOfDay = Math.min(1, Math.max(0, (p - 0.04) / 0.72))
}
function onScroll() {
  if (!raf) raf = requestAnimationFrame(measure)
}

onMounted(() => {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash && props.sections.some((s) => s.id === hash)) setTimeout(() => go(hash), 60)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <main id="main">
    <component :is="map[s.id]" v-for="s in sections" :key="s.id" @go="go" />
  </main>
</template>
