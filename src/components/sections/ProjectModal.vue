<script setup lang="ts">
import TechLogo from '../ui/TechLogo.vue'
import { computed, ref, watch } from 'vue'
import { fetchContributors } from '../../services/github'
import { useGithub } from '../../composables/useGithub'
import type { Contributor } from '../../services/github/types'
import ModalDialog from '../ui/ModalDialog.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import type { GhRepo } from '../../services/github/types'
import { formatBytes, formatDate, languageColor, relativeTime, repoSummary } from '../../services/github/derive'

const props = defineProps<{ repo: GhRepo | null }>()
const emit = defineEmits<{ close: [] }>()
const imgFailed = ref(false)
const { data } = useGithub()
const owner = computed(() => (data.value?.login ?? '').toLowerCase())
const people = ref<Contributor[] | null>(null)
const peopleState = ref<'idle' | 'loading' | 'error'>('idle')
watch(
  () => props.repo,
  async (r) => {
    imgFailed.value = false
    people.value = r?.contributors ?? null
    peopleState.value = 'idle'
    if (r && !r.contributors) {
      peopleState.value = 'loading'
      const list = await fetchContributors(r.fullName)
      if (props.repo !== r) return
      if (list) {
        r.contributors = list
        people.value = list
        peopleState.value = 'idle'
      } else peopleState.value = 'error'
    }
  },
)
const maxCommits = computed(() => Math.max(1, ...(people.value?.map((c) => c.commits) ?? [1])))
const totalCommits = computed(() => people.value?.reduce((s, c) => s + c.commits, 0) ?? 0)

const langs = computed(() => {
  const r = props.repo
  if (!r?.languages) return []
  const total = Object.values(r.languages).reduce((s, n) => s + n, 0)
  return Object.entries(r.languages).sort((a, b) => b[1] - a[1]).map(([name, bytes]) => ({ name, bytes, share: total ? bytes / total : 0, color: languageColor(name) }))
})
const demo = computed(() => props.repo?.homepage || props.repo?.pagesUrl || null)
const sourceLabel = { manifest: 'dependency file', file: 'project file', topic: 'topic' }
</script>

<template>
  <ModalDialog :open="!!repo" labelledby="pm-title" @close="emit('close')">
    <article v-if="repo" class="pm">
      <figure v-if="repo.previewImage && !imgFailed" class="pm-preview">
        <img :src="repo.previewImage" :alt="repo.previewKind === 'screenshot' ? `Screenshot from the ${repo.name} repository` : `GitHub preview card for ${repo.name}`" loading="lazy" referrerpolicy="no-referrer" @error="imgFailed = true" />
        <figcaption class="dim">{{ repo.previewKind === 'screenshot' ? 'Image found in the repository' : 'GitHub social preview' }}</figcaption>
      </figure>
      <div class="pm-body">
        <p class="pixel pm-kicker">
          <PixelIcon name="chest" :size="18" />
          <span>{{ repo.isFork ? 'Forked repository' : 'Public repository' }}</span>
        </p>
        <h3 id="pm-title" class="pixel pm-title">{{ repo.name }}</h3>
        <p class="pm-desc">{{ repo.description || 'No description provided on GitHub.' }}</p>
        <p class="pm-summary muted">{{ repoSummary(repo) }}</p>
        <div class="pm-actions">
          <a class="btn btn-primary btn-sm" :href="repo.htmlUrl" target="_blank" rel="noopener noreferrer"><PixelIcon name="code" :size="16" /> Repository</a>
          <a v-if="demo" class="btn btn-diamond btn-sm" :href="demo" target="_blank" rel="noopener noreferrer"><PixelIcon name="link" :size="16" /> Live demo</a>
          <a v-if="repo.parent" class="btn btn-sm" :href="repo.parent.htmlUrl" target="_blank" rel="noopener noreferrer"><PixelIcon name="fork" :size="16" /> Upstream</a>
        </div>
        <dl class="pm-stats">
          <div class="slot"><dt>Stars</dt><dd class="pixel">{{ repo.stars }}</dd></div>
          <div class="slot"><dt>Forks</dt><dd class="pixel">{{ repo.forks }}</dd></div>
          <div class="slot"><dt>Last push</dt><dd>{{ relativeTime(repo.pushedAt) }}</dd></div>
          <div class="slot"><dt>Updated</dt><dd>{{ formatDate(repo.updatedAt) }}</dd></div>
          <div class="slot"><dt>Created</dt><dd>{{ formatDate(repo.createdAt) }}</dd></div>
          <div class="slot"><dt>Open issues</dt><dd class="pixel">{{ repo.openIssues }}</dd></div>
        </dl>
        <div class="pm-block">
          <h4 class="pixel">Contributors &amp; commits</h4>
          <p v-if="peopleState === 'loading'" class="dim small">Loading contributors…</p>
          <p v-else-if="peopleState === 'error'" class="dim small">Contributor data isn’t available right now.</p>
          <p v-else-if="people && !people.length" class="dim small">No commits on the default branch yet.</p>
          <template v-else-if="people">
            <ul class="people">
              <li v-for="c in people" :key="c.login" :class="{ me: c.login.toLowerCase() === owner }">
                <img :src="c.avatarUrl ? `${c.avatarUrl}${c.avatarUrl.includes('?') ? '&' : '?'}s=64` : `https://github.com/${c.login}.png?size=64`" :alt="''" width="32" height="32" loading="lazy" referrerpolicy="no-referrer" />
                <a :href="c.htmlUrl" target="_blank" rel="noopener noreferrer">@{{ c.login }}</a>
                <span v-if="c.login.toLowerCase() === owner" class="you pixel">You</span>
                <span class="pbar"><span :style="{ width: `${(c.commits / maxCommits) * 100}%` }" /></span>
                <span class="pc mono">{{ c.commits }} commit{{ c.commits === 1 ? '' : 's' }}</span>
              </li>
            </ul>
            <p class="dim small">
              {{ totalCommits }} commits on the default branch from {{ people.length }} contributor{{ people.length === 1 ? '' : 's' }}, as counted by GitHub.
              <template v-if="repo.isFork"> Forks include the upstream project’s contributors.</template>
            </p>
          </template>
        </div>
        <div v-if="langs.length" class="pm-block">
          <h4 class="pixel">Languages</h4>
          <div class="bar"><span v-for="l in langs" :key="l.name" :style="{ flexGrow: l.share, background: l.color }" /></div>
          <ul class="chips">
            <li v-for="l in langs" :key="l.name" class="chip"><TechLogo :name="l.name" :color="l.color" :size="16" />{{ l.name }} {{ (l.share * 100).toFixed(1) }}% · {{ formatBytes(l.bytes) }}</li>
          </ul>
        </div>
        <div v-else-if="repo.language" class="pm-block">
          <h4 class="pixel">Primary language</h4>
          <span class="chip"><TechLogo :name="repo.language" :color="languageColor(repo.language)" :size="16" />{{ repo.language }}</span>
        </div>
        <div v-if="repo.techs.length" class="pm-block">
          <h4 class="pixel">Technologies detected</h4>
          <ul class="tech-list">
            <li v-for="t in repo.techs" :key="t.name">
              <TechLogo :name="t.name" kind="tech" :size="16" class="tl" />
              <strong>{{ t.name }}</strong>
              <span class="dim"> — {{ sourceLabel[t.source] }}: <code>{{ t.evidence }}</code></span>
            </li>
          </ul>
        </div>
        <div v-if="repo.topics.length" class="pm-block">
          <h4 class="pixel">Topics</h4>
          <ul class="chips">
            <li v-for="t in repo.topics" :key="t" class="chip">#{{ t }}</li>
          </ul>
        </div>
      </div>
    </article>
  </ModalDialog>
</template>

<style scoped>
.pm-preview {
  margin: 0;
  border-bottom: 2px solid var(--edge);
  background: #0d0b13;
}
.pm-preview img {
  width: 100%;
  max-height: 380px;
  object-fit: cover;
}
.pm-preview figcaption {
  padding: 6px 16px;
  font-size: 12px;
}
.pm-body {
  display: grid;
  gap: 14px;
  padding: clamp(18px, 3vw, 30px);
}
.pm-kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}
.pm-title {
  margin: 0;
  font-size: clamp(22px, 3.4vw, 32px);
  color: var(--heading);
  overflow-wrap: anywhere;
}
.pm-desc {
  margin: 0;
  font-size: 17px;
}
.pm-summary {
  margin: 0;
}
.pm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pm-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
  margin: 0;
}
.pm-stats > div {
  padding: 10px 12px;
}
.pm-stats dt {
  font-size: 12px;
  color: var(--dim);
}
.pm-stats dd {
  margin: 2px 0 0;
  color: var(--heading);
}
.pm-block h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--muted);
}
.bar {
  display: flex;
  height: 10px;
  margin-bottom: 10px;
  border: 2px solid var(--edge);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tech-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}
.tech-list li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.people {
  display: grid;
  gap: 6px;
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
}
.people li {
  display: grid;
  grid-template-columns: 32px minmax(90px, auto) auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-size: 14px;
}
.people li.me {
  border-color: var(--accent);
}
.people img {
  width: 32px;
  height: 32px;
  border: 2px solid var(--edge);
}
.you {
  padding: 1px 6px;
  font-size: 10px;
  background: var(--emerald);
  color: #062414;
}
.people li:not(.me) .pbar {
  grid-column: 3 / 5;
}
.pbar {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--edge);
}
.pbar span {
  display: block;
  height: 100%;
  background: var(--emerald);
}
.pc {
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
}
.small {
  margin: 0;
  font-size: 13px;
}
.tech-list code {
  font-family: var(--mono);
  font-size: 12.5px;
  overflow-wrap: anywhere;
}
</style>
