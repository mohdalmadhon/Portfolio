<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { useGithub } from '../../composables/useGithub'
import { formatDate } from '../../services/github/derive'
import { safeUrl } from '../../services/safe'

const { data, displayName } = useGithub()
const p = computed(() => data.value?.profile ?? null)
const blog = computed(() => safeUrl(p.value?.blog))

const cards = [
  { key: 'interests', title: 'What I’m into', icon: 'diamond', text: site.about.interests },
  { key: 'approach', title: 'How I solve problems', icon: 'pickaxe', text: site.about.approach },
  { key: 'philosophy', title: 'Development philosophy', icon: 'book', text: site.about.philosophy },
  { key: 'goals', title: 'Current goals', icon: 'compass', text: site.about.goals },
].filter((c) => c.text)
</script>

<template>
  <section id="about" class="section" aria-labelledby="about-title" data-section="about">
    <div class="wrap">
      <SectionHeader id="about-title" kicker="Chapter 01 · The cottage" title="About me" icon="face" />
      <div class="about-grid">
        <article v-tilt="{ max: 3 }" v-reveal class="bio panel panel-pad">
          <div class="bio-top">
            <div class="avatar slot">
              <img v-if="p?.avatarUrl" :src="p.avatarUrl" :alt="`GitHub avatar of ${displayName}`" width="96" height="96" loading="lazy" referrerpolicy="no-referrer" />
              <PixelIcon v-else name="face" :size="64" />
            </div>
            <div>
              <p class="pixel bio-name">{{ displayName || 'Your name' }}</p>
              <p class="muted bio-role">{{ site.title }}</p>
            </div>
          </div>
          <p v-if="p?.bio" class="gh-bio">“{{ p.bio }}”<span class="dim src"> — GitHub bio</span></p>
          <p class="bio-text">{{ site.about.bio }}</p>
          <dl v-if="p" class="facts">
            <div v-if="p.location"><dt>Location</dt><dd>{{ p.location }}</dd></div>
            <div v-if="p.company"><dt>Company</dt><dd>{{ p.company }}</dd></div>
            <div v-if="p.createdAt"><dt>On GitHub since</dt><dd>{{ formatDate(p.createdAt, false) }}</dd></div>
            <div><dt>Followers</dt><dd>{{ p.followers }}</dd></div>
            <div v-if="blog"><dt>Website</dt><dd><a :href="blog" target="_blank" rel="noopener noreferrer">{{ blog.replace(/^https?:\/\//, '').replace(/\/$/, '') }}</a></dd></div>
          </dl>
        </article>
        <div class="cards">
          <article v-for="(c, i) in cards" :key="c.key" v-tilt v-reveal="i" class="card panel panel-pad">
            <div class="card-head">
              <span class="slot ic"><PixelIcon :name="c.icon" :size="22" /></span>
              <h3 class="pixel">{{ c.title }}</h3>
            </div>
            <p>{{ c.text }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 18px;
}
.bio {
  display: grid;
  gap: 16px;
  align-content: start;
}
.bio-top {
  display: flex;
  gap: 16px;
  align-items: center;
}
.avatar {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  flex: none;
  overflow: hidden;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bio-name {
  margin: 0;
  font-size: 20px;
  color: var(--heading);
}
.bio-role {
  margin: 2px 0 0;
}
.gh-bio {
  margin: 0;
  padding: 12px 14px;
  background: var(--panel-2);
  border-left: 4px solid var(--emerald);
  font-style: italic;
}
.src {
  font-style: normal;
  font-size: 13px;
}
.bio-text {
  margin: 0;
  color: var(--body);
}
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin: 0;
}
.facts dt {
  font-family: var(--pixel);
  font-size: 11px;
  color: var(--dim);
  letter-spacing: 0.04em;
}
.facts dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
}
.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.card p {
  margin: 10px 0 0;
  color: var(--body);
}
.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-head h3 {
  margin: 0;
  font-size: 15px;
  color: var(--heading);
  line-height: 1.3;
}
.ic {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: none;
}
@media (max-width: 960px) {
  .about-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
