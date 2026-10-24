<script setup lang="ts">
import TechLogo from '../ui/TechLogo.vue'
import { computed, ref } from 'vue'
import SectionHeader from '../ui/SectionHeader.vue'
import StatusState from '../ui/StatusState.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import techMapJson from '../../../shared/tech-map.json'
import { useGithub, rateLimitText } from '../../composables/useGithub'
import { useProjectFilter } from '../../composables/useProjectFilter'
import { formatBytes } from '../../services/github/derive'
import type { TechCategory, TechSource } from '../../services/github/types'

const emit = defineEmits<{ go: [id: string] }>()
const { state, data, derived, load } = useGithub()
const { filter, reset } = useProjectFilter()
const showTrace = ref(false)

const categories = techMapJson.categories as Record<TechCategory, string>
const order: TechCategory[] = ['frontend', 'backend', 'database', 'framework', 'devops', 'tooling', 'testing', 'mobile']
const techGroups = computed(() => (derived.value ? order.map((k) => ({ key: k, label: categories[k], items: derived.value!.techs[k] })).filter((g) => g.items.length) : []))
const sourceInfo: Record<TechSource, { label: string; icon: string; color: string }> = {
  manifest: { label: 'Dependency files', icon: 'book', color: 'var(--emerald)' },
  file: { label: 'Project files', icon: 'pickaxe', color: 'var(--diamond)' },
  topic: { label: 'Repository topics', icon: 'map', color: 'var(--gold)' },
}
const maxRepos = computed(() => Math.max(1, ...(derived.value?.languages.map((l) => l.repos.length) ?? [1])))

function pickLanguage(name: string) {
  reset()
  filter.language = name
  emit('go', 'projects')
}
function pickTech(name: string) {
  reset()
  filter.tech = name
  emit('go', 'projects')
}
function strongest(sources: TechSource[]): TechSource {
  return sources.includes('manifest') ? 'manifest' : sources.includes('file') ? 'file' : 'topic'
}
</script>

<template>
  <section id="skills" class="section" aria-labelledby="skills-title" data-section="skills">
    <div class="wrap">
      <SectionHeader
        id="skills-title"
        kicker="Chapter 02 · The workshop"
        title="Skills & technologies"
        icon="crafting"
        lead="Built from my public repositories, not typed in by hand. Select any language or technology to see the projects that use it."
      />

      <div v-if="state.status === 'loading' || state.status === 'idle'" class="inv-grid" aria-busy="true">
        <div v-for="i in 8" :key="i" class="lang slot"><span class="skeleton-line" style="width: 70%" /><span class="skeleton-line" style="width: 40%" /></div>
      </div>
      <StatusState
        v-else-if="state.status === 'error'"
        kind="error"
        title="Couldn’t load skills from GitHub"
        :message="`${state.error?.message ?? ''} ${rateLimitText(state.error?.reset ?? null)}`"
        :action-label="state.error?.kind === 'config' ? undefined : 'Try again'"
        @action="load(true)"
      />
      <template v-else-if="derived && data">
        <div v-reveal class="panel panel-pad block">
          <div class="block-head">
            <h3 class="pixel">Programming languages</h3>
            <span class="badge pixel">Detected by GitHub</span>
          </div>
          <p class="explain muted">
            GitHub’s language analysis of {{ derived.languagesTotalRepos }} public, non-fork repositories. A language counts for a repository
            only when it makes up at least 5% of that repository’s code (and 1.5 KB), so a single stray file doesn’t count. The percentage is the
            language’s share of all code bytes — a measure of volume, not proficiency.
          </p>
          <p v-if="derived.languagesMeasured < derived.languagesTotalRepos" class="explain warn">
            Byte statistics were available for {{ derived.languagesMeasured }} of {{ derived.languagesTotalRepos }} repositories; the others count
            their primary language only.
          </p>
          <div v-if="derived.languages.length" class="bar" role="img" :aria-label="`Code share: ${derived.languages.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(', ')}`">
            <span v-for="l in derived.languages.filter((x) => x.share > 0.004)" :key="l.name" :style="{ flexGrow: l.share, background: l.color }" :title="`${l.name} ${(l.share * 100).toFixed(1)}%`" />
          </div>
          <ul class="inv-grid">
            <li v-for="(l, i) in derived.languages" :key="l.name" v-reveal="i % 6">
              <button v-tilt="{ max: 10, lift: 3 }" type="button" class="lang slot" :aria-label="`${l.name}: used in ${l.repos.length} repositories. Show projects`" @click="pickLanguage(l.name)">
                <span class="cube"><TechLogo :name="l.name" :color="l.color" :size="30" /></span>
                <span class="lang-name">{{ l.name }}</span>
                <span class="lang-meta">
                  <span class="pixel count">{{ l.repos.length }}</span> repo{{ l.repos.length === 1 ? '' : 's' }}
                  <template v-if="l.bytes"> · {{ (l.share * 100).toFixed(1) }}%</template>
                </span>
                <span class="meter" aria-hidden="true"><span :style="{ width: `${(l.repos.length / maxRepos) * 100}%`, background: l.color }" /></span>
              </button>
            </li>
          </ul>
          <p v-if="!derived.languages.length" class="muted">No public repositories with detectable languages yet.</p>
          <div v-if="derived.traceLanguages.length" class="trace">
            <button type="button" class="link-btn" :aria-expanded="showTrace" @click="showTrace = !showTrace">
              {{ showTrace ? 'Hide' : 'Show' }} {{ derived.traceLanguages.length }} language{{ derived.traceLanguages.length === 1 ? '' : 's' }} found only in small amounts
            </button>
            <ul v-if="showTrace" class="trace-list">
              <li v-for="l in derived.traceLanguages" :key="l.name" class="chip">
                <TechLogo :name="l.name" :color="l.color" :size="16" />{{ l.name }} · {{ formatBytes(l.bytes) }}
              </li>
            </ul>
          </div>
        </div>

        <div v-reveal class="panel panel-pad block">
          <div class="block-head">
            <h3 class="pixel">Technologies & tools</h3>
            <span class="badge pixel alt">Inferred from repositories</span>
          </div>
          <p class="explain muted">
            Detected from evidence inside each repository. The marker on every item shows its strongest evidence:
          </p>
          <ul class="legend">
            <li v-for="(s, key) in sourceInfo" :key="key"><span class="mark" :style="{ background: s.color }" />{{ s.label }}</li>
          </ul>
          <p v-if="data.source === 'live'" class="explain warn">
            Live mode: only repository topics are used here. Dependency and file detection runs when the site is built by the included GitHub
            Action, which reads package.json, go.mod and project files.
          </p>
          <div v-if="techGroups.length" class="tech-grid">
            <div v-for="(g, i) in techGroups" :key="g.key" v-tilt="{ max: 4, lift: 2 }" v-reveal="i" class="tech-group slot">
              <h4 class="pixel">{{ g.label }}</h4>
              <ul>
                <li v-for="t in g.items" :key="t.name">
                  <button
                    type="button"
                    class="tech"
                    :title="t.repos.map((r) => `${r.name}: ${r.evidence}`).join('\n')"
                    :aria-label="`${t.name}, found in ${t.repos.length} repositories via ${sourceInfo[strongest(t.sources)].label}. Show projects`"
                    @click="pickTech(t.name)"
                  >
                    <span class="mark" :style="{ background: sourceInfo[strongest(t.sources)].color }" aria-hidden="true" />
                    <TechLogo :name="t.name" kind="tech" :size="16" />
                    {{ t.name }}
                    <span class="n">{{ t.repos.length }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <p v-else class="muted">
            No technologies could be inferred yet. Add topics to your repositories on GitHub, or deploy with the GitHub Action to scan source files.
          </p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.block {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
}
.block-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.block-head h3 {
  margin: 0;
  font-size: 18px;
  color: var(--heading);
}
.badge {
  padding: 4px 10px;
  font-size: 11px;
  color: #062414;
  background: var(--emerald);
  border: 2px solid var(--edge);
}
.badge.alt {
  background: var(--diamond);
  color: #052421;
}
.explain {
  margin: 0;
  font-size: 14.5px;
  max-width: 90ch;
}
.warn {
  color: var(--warn);
}
.bar {
  display: flex;
  height: 14px;
  border: 2px solid var(--edge);
  overflow: hidden;
}
.bar span {
  min-width: 3px;
  box-shadow: inset -2px 0 0 rgba(0, 0, 0, 0.3);
}
.inv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 176px), 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.lang {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas: 'cube name' 'cube meta' 'bar bar';
  column-gap: 12px;
  row-gap: 2px;
  align-items: center;
  width: 100%;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.12s ease;
}
.lang:hover {
  background: var(--hover);
  transform: translateY(-2px);
}
.cube {
  grid-area: cube;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.18);
  border: 2px solid var(--edge);
  box-shadow: inset 2px 2px 0 rgba(255, 255, 255, 0.08);
}
.lang-name {
  grid-area: name;
  font-weight: 600;
  color: var(--heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lang-meta {
  grid-area: meta;
  font-size: 13px;
  color: var(--muted);
}
.count {
  color: var(--heading);
}
.meter {
  grid-area: bar;
  height: 4px;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.4);
}
.meter span {
  display: block;
  height: 100%;
}
.trace {
  display: grid;
  gap: 10px;
}
.link-btn {
  justify-self: start;
  padding: 0;
  background: none;
  border: 0;
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font-size: 14px;
}
.trace-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13.5px;
  color: var(--muted);
}
.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mark {
  width: 10px;
  height: 10px;
  flex: none;
  border: 1px solid rgba(0, 0, 0, 0.6);
}
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 10px;
}
.tech-group {
  padding: 14px;
}
.tech-group h4 {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--accent);
}
.tech-group ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tech {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  background: var(--panel-2);
  border: 1px solid var(--line-hi);
  color: var(--text);
  font-size: 13.5px;
  cursor: pointer;
}
.tech:hover {
  border-color: var(--link);
}
.tech .n {
  padding-left: 6px;
  border-left: 1px solid var(--line-hi);
  color: var(--dim);
  font-size: 12px;
}
</style>
