<script setup lang="ts">
import TechLogo from '../ui/TechLogo.vue'
import ContributorStack from '../ui/ContributorStack.vue'
import { computed, ref, watch } from 'vue'
import SectionHeader from '../ui/SectionHeader.vue'
import StatusState from '../ui/StatusState.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import ProjectModal from './ProjectModal.vue'
import { site } from '../../config/site'
import { useGithub, rateLimitText } from '../../composables/useGithub'
import { useProjectFilter, type SortKey } from '../../composables/useProjectFilter'
import { languageColor, relativeTime } from '../../services/github/derive'
import type { GhRepo } from '../../services/github/types'

const { state, data, derived, load } = useGithub()
const { filter, reset } = useProjectFilter()
const selected = ref<GhRepo | null>(null)
const pageSize = 12
const limit = ref(pageSize)

const featured = computed(() => new Set(site.featuredRepos.map((n) => n.toLowerCase())))
const pool = computed(() => {
  if (!derived.value) return []
  const list = filter.showForks ? [...derived.value.ownRepos, ...derived.value.forks] : derived.value.ownRepos
  return filter.showArchived ? list : list.filter((r) => !r.isArchived)
})
const languageOptions = computed(() => {
  const set = new Map<string, number>()
  for (const r of pool.value) {
    const names = r.languages ? Object.keys(r.languages) : r.language ? [r.language] : []
    for (const n of names) set.set(n, (set.get(n) ?? 0) + 1)
  }
  return [...set.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => ({ name: n, count: c }))
})

const sorters: Record<SortKey, (a: GhRepo, b: GhRepo) => number> = {
  pushed: (a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''),
  stars: (a, b) => b.stars - a.stars || (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''),
  forks: (a, b) => b.forks - a.forks || b.stars - a.stars,
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
}

const results = computed(() => {
  const q = filter.query.trim().toLowerCase()
  const list = pool.value.filter((r) => {
    if (filter.language && !(r.languages ? filter.language in r.languages : r.language === filter.language)) return false
    if (filter.tech && !r.techs.some((t) => t.name === filter.tech)) return false
    if (!q) return true
    const hay = [r.name, r.description ?? '', r.language ?? '', ...r.topics, ...r.techs.map((t) => t.name), ...Object.keys(r.languages ?? {})].join(' ').toLowerCase()
    return q.split(/\s+/).every((w) => hay.includes(w))
  })
  return list.sort(sorters[filter.sort])
})
const pinned = computed(() => (filter.query || filter.language || filter.tech ? [] : results.value.filter((r) => featured.value.has(r.name.toLowerCase()))))
const rest = computed(() => results.value.filter((r) => !pinned.value.includes(r)))
const shown = computed(() => rest.value.slice(0, limit.value))
const active = computed(() => !!(filter.query || filter.language || filter.tech))

watch(() => [filter.query, filter.language, filter.tech, filter.sort, filter.showForks, filter.showArchived], () => (limit.value = pageSize))

function open(r: GhRepo) {
  selected.value = r
}
function demo(r: GhRepo) {
  return r.homepage || r.pagesUrl
}
</script>

<template>
  <section id="projects" class="section" aria-labelledby="projects-title" data-section="projects">
    <div class="wrap">
      <SectionHeader
        id="projects-title"
        kicker="Chapter 03 · The chests"
        title="Projects"
        icon="chest"
        lead="Every public repository, pulled straight from GitHub. Open a chest to see languages, detected technologies and links."
      />

      <div v-reveal class="toolbar panel">
        <label class="search">
          <span class="sr-only">Search projects</span>
          <input v-model="filter.query" class="input" type="search" placeholder="Search by name, description or technology…" autocomplete="off" />
        </label>
        <label class="ctl">
          <span class="sr-only">Filter by language</span>
          <select v-model="filter.language" class="input">
            <option value="">All languages</option>
            <option v-for="l in languageOptions" :key="l.name" :value="l.name">{{ l.name }} ({{ l.count }})</option>
          </select>
        </label>
        <label class="ctl">
          <span class="sr-only">Sort projects</span>
          <select v-model="filter.sort" class="input">
            <option value="pushed">Recently pushed</option>
            <option value="created">Newest</option>
            <option value="stars">Most stars</option>
            <option value="forks">Most forks</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <div class="toggles">
          <label class="check"><input v-model="filter.showForks" type="checkbox" /> Include forks<span v-if="derived" class="dim"> ({{ derived.forks.length }})</span></label>
          <label class="check"><input v-model="filter.showArchived" type="checkbox" /> Include archived</label>
        </div>
      </div>

      <div v-if="filter.tech || filter.language" class="active-filters" role="status">
        <span class="dim">Filtered by</span>
        <button v-if="filter.language" type="button" class="chip removable" @click="filter.language = ''">
          <span class="chip-dot" :style="{ background: languageColor(filter.language) }" />{{ filter.language }} <span aria-hidden="true">✕</span><span class="sr-only">Remove language filter</span>
        </button>
        <button v-if="filter.tech" type="button" class="chip removable" @click="filter.tech = ''">
          {{ filter.tech }} <span aria-hidden="true">✕</span><span class="sr-only">Remove technology filter</span>
        </button>
      </div>

      <div v-if="state.status === 'loading' || state.status === 'idle'" class="grid" aria-busy="true">
        <div v-for="i in 6" :key="i" class="card panel"><span class="skeleton-line" style="width: 50%" /><span class="skeleton-line" /><span class="skeleton-line" style="width: 80%" /></div>
      </div>
      <StatusState
        v-else-if="state.status === 'error'"
        kind="error"
        title="Projects couldn’t be loaded"
        :message="`${state.error?.message ?? ''} ${rateLimitText(state.error?.reset ?? null)}`"
        :action-label="state.error?.kind === 'config' ? undefined : 'Try again'"
        @action="load(true)"
      >
        <a v-if="data?.profile.htmlUrl" :href="data.profile.htmlUrl" target="_blank" rel="noopener noreferrer">Open the GitHub profile instead</a>
      </StatusState>
      <template v-else-if="derived">
        <StatusState
          v-if="!results.length"
          kind="empty"
          :title="active ? 'No projects match' : 'No public projects yet'"
          :message="active ? 'Try a different search or clear the filters.' : 'Public repositories will appear here automatically.'"
          :action-label="active ? 'Clear filters' : undefined"
          @action="reset()"
        />
        <template v-else>
          <p class="count dim" aria-live="polite">{{ results.length }} project{{ results.length === 1 ? '' : 's' }}</p>
          <div v-if="pinned.length" class="pinned">
            <h3 class="pixel sub">Pinned by me</h3>
            <div class="grid">
              <button v-for="r in pinned" :key="r.id" v-tilt v-reveal type="button" class="card panel pinned-card" @click="open(r)">
                <span class="card-top"><PixelIcon name="chest" :size="28" /><span class="pin pixel">Pinned</span></span>
                <span class="pixel name">{{ r.name }}</span>
                <span class="desc">{{ r.description || 'No description provided.' }}</span>
              </button>
            </div>
          </div>
          <ul class="grid">
            <li v-for="(r, i) in shown" :key="r.id" v-reveal="i % 3">
              <button v-tilt type="button" class="card panel" :aria-label="`Open details for ${r.name}`" @click="open(r)">
                <span class="card-top">
                  <span class="chest" :style="{ '--lc': r.language ? languageColor(r.language) : '#8c85a3' }" aria-hidden="true"><PixelIcon name="chest" :size="30" /></span>
                  <span class="flags">
                    <span v-if="r.isFork" class="flag">Fork</span>
                    <span v-if="r.isArchived" class="flag">Archived</span>
                    <span v-if="demo(r)" class="flag live">Live</span>
                  </span>
                </span>
                <span class="pixel name">{{ r.name }}</span>
                <span class="desc">{{ r.description || 'No description provided.' }}</span>
                <span v-if="r.topics.length || r.techs.length" class="tags">
                  <span v-for="t in (r.topics.length ? r.topics : r.techs.map((x) => x.name)).slice(0, 3)" :key="t" class="chip">{{ t }}</span>
                </span>
                <ContributorStack v-if="r.contributors?.length" :contributors="r.contributors" :owner="data?.login ?? ''" />
                <span class="meta">
                  <span v-if="r.language" class="m"><TechLogo :name="r.language" :color="languageColor(r.language)" :size="16" />{{ r.language }}</span>
                  <span class="m" :title="`${r.stars} stars`"><PixelIcon name="star" :size="13" />{{ r.stars }}</span>
                  <span class="m" :title="`${r.forks} forks`"><PixelIcon name="fork" :size="13" />{{ r.forks }}</span>
                  <span class="m dim">{{ relativeTime(r.pushedAt) }}</span>
                </span>
              </button>
            </li>
          </ul>
          <div v-if="rest.length > limit" class="more">
            <button type="button" class="btn" @click="limit += pageSize">Show more ({{ rest.length - limit }} left)</button>
          </div>
        </template>
      </template>
    </div>
    <ProjectModal :repo="selected" @close="selected = null" />
  </section>
</template>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
  margin-bottom: 14px;
}
.toggles {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  font-size: 14px;
}
.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.check input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}
.removable {
  cursor: pointer;
  color: var(--text);
}
.removable:hover {
  border-color: var(--redstone);
}
.count {
  margin: 0 0 10px;
  font-size: 13px;
}
.sub {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--warn);
}
.pinned {
  margin-bottom: 18px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.grid > li {
  display: flex;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-height: 210px;
  padding: 18px;
  text-align: left;
  color: var(--text);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--bevel), 0 0 0 2px var(--emerald), var(--shadow);
}
.pinned-card {
  box-shadow: var(--bevel), 0 0 0 2px var(--gold), var(--shadow);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.chest {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  background: radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--lc) 45%, transparent), transparent 70%), var(--slot-bg);
  border: 2px solid var(--edge);
}
.flags {
  display: flex;
  gap: 4px;
}
.flag {
  padding: 2px 7px;
  font-family: var(--pixel);
  font-size: 10px;
  background: var(--panel-3);
  border: 1px solid var(--line-hi);
  color: var(--muted);
}
.flag.live {
  color: #052421;
  background: var(--diamond);
  border-color: #000;
}
.pin {
  font-size: 10px;
  color: var(--warn);
}
.name {
  font-size: 16px;
  color: var(--heading);
  overflow-wrap: anywhere;
  line-height: 1.3;
}
.desc {
  color: var(--body);
  font-size: 14.5px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}
.m {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.more {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}
@media (max-width: 760px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
  .search {
    grid-column: 1 / -1;
  }
}
</style>
