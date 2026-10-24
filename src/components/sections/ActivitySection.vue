<script setup lang="ts">
import TechLogo from '../ui/TechLogo.vue'
import { computed, ref } from 'vue'
import SectionHeader from '../ui/SectionHeader.vue'
import StatusState from '../ui/StatusState.vue'
import InvSlot from '../ui/InvSlot.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import ContributionLandscape from './ContributionLandscape.vue'
import RepoTimeline from './RepoTimeline.vue'
import { useGithub, rateLimitText } from '../../composables/useGithub'
import { formatDate, relativeTime } from '../../services/github/derive'
import type { ActivityEvent, CommitPeriod } from '../../services/github/types'

const { state, data, derived, load, profileUrl } = useGithub()
const period = ref<CommitPeriod>('12m')
const periods: { key: CommitPeriod; label: string }[] = [
  { key: '30d', label: 'Last 30 days' },
  { key: '12m', label: 'Last 12 months' },
  { key: 'all', label: 'All available history' },
]
const loading = computed(() => state.status === 'loading' || state.status === 'idle')
const fmt = (n: number) => new Intl.NumberFormat().format(n)

const push = computed(() => data.value?.pushStats ?? null)
const windowDays = computed(() => {
  const p = push.value
  if (!p?.windowStart || !p.windowEnd) return 0
  return Math.max(1, Math.round((Date.parse(p.windowEnd) - Date.parse(p.windowStart)) / 86400000))
})

function describe(e: ActivityEvent): { icon: string; text: string } {
  const branch = e.ref ? e.ref.replace('refs/heads/', '') : ''
  switch (e.type) {
    case 'PushEvent':
      return { icon: 'pickaxe', text: e.commits != null ? `Pushed ${e.commits} commit${e.commits === 1 ? '' : 's'}${branch ? ` to ${branch}` : ''}` : `Pushed${branch ? ` to ${branch}` : ''}` }
    case 'CreateEvent':
      return { icon: 'emerald', text: e.action === 'repository' ? 'Created repository' : `Created ${e.action ?? 'ref'}${e.ref ? ` ${e.ref}` : ''}` }
    case 'DeleteEvent':
      return { icon: 'skull', text: `Deleted ${e.ref ?? 'a ref'}` }
    case 'PullRequestEvent':
      return { icon: 'map', text: `${e.action ? e.action[0].toUpperCase() + e.action.slice(1) : 'Updated'} a pull request` }
    case 'PullRequestReviewEvent':
      return { icon: 'book', text: 'Reviewed a pull request' }
    case 'IssuesEvent':
      return { icon: 'quote', text: `${e.action ? e.action[0].toUpperCase() + e.action.slice(1) : 'Updated'} an issue` }
    case 'IssueCommentEvent':
      return { icon: 'quote', text: 'Commented on an issue' }
    case 'WatchEvent':
      return { icon: 'star', text: 'Starred' }
    case 'ForkEvent':
      return { icon: 'fork', text: 'Forked' }
    case 'ReleaseEvent':
      return { icon: 'diamond', text: 'Published a release in' }
    case 'PublicEvent':
      return { icon: 'chest', text: 'Made public' }
    default:
      return { icon: 'compass', text: e.type.replace(/Event$/, '') }
  }
}

const origin = computed(() => {
  if (!data.value) return ''
  const when = formatDate(data.value.generatedAt)
  switch (state.origin) {
    case 'snapshot': return `Build-time snapshot generated ${when} by the GitHub Action.`
    case 'cache': return `Loaded live from the GitHub API at ${new Date(data.value.generatedAt).toLocaleTimeString()} (cached for 30 minutes).`
    case 'stale-cache': return `Showing saved data from ${when}; GitHub is currently unavailable.`
    default: return `Loaded live from the GitHub API just now.`
  }
})
</script>

<template>
  <section id="activity" class="section" aria-labelledby="activity-title" data-section="activity">
    <div class="wrap">
      <SectionHeader
        id="activity-title"
        kicker="Chapter 04 · The beacon"
        title="GitHub activity"
        icon="chart"
        lead="Public numbers only, with exactly what each one measures. Where GitHub can’t provide a reliable figure, it says so instead of guessing."
      />

      <StatusState
        v-if="state.status === 'error'"
        kind="error"
        title="Activity couldn’t be loaded"
        :message="`${state.error?.message ?? ''} ${rateLimitText(state.error?.reset ?? null)}`"
        :action-label="state.error?.kind === 'config' ? undefined : 'Try again'"
        @action="load(true)"
      />
      <template v-else>
        <div class="stats">
          <InvSlot icon="chest" :loading="loading" :value="fmt(derived?.totals.ownRepos ?? 0)" label="Public repositories" :hint="derived ? `${derived.totals.ownRepos} own, ${derived.totals.forks} forks` : ''" />
          <InvSlot icon="star" :loading="loading" :value="fmt(derived?.totals.stars ?? 0)" label="Stars received" hint="Sum of stars across all public repositories I own" />
          <InvSlot icon="fork" :loading="loading" :value="fmt(derived?.totals.forksReceived ?? 0)" label="Forks of my repos" hint="How many times my public repositories were forked" />
          <InvSlot icon="diamond" :loading="loading" :value="fmt(derived?.languages.length ?? 0)" label="Languages used" />
          <InvSlot icon="face" :loading="loading" :value="fmt(data?.profile.followers ?? 0)" label="Followers" />
          <InvSlot icon="pickaxe" :loading="loading" :value="push ? fmt(push.pushes) : '—'" :label="push && windowDays ? `Pushes · last ${windowDays} days` : 'Pushes observed'" hint="Estimate from public events; see the push panel below" />
        </div>

        <div class="cols">
          <div v-reveal class="panel panel-pad commits">
            <div class="head">
              <h3 class="pixel">Commits</h3>
              <div class="tabs" role="tablist" aria-label="Commit period">
                <button
                  v-for="p in periods"
                  :key="p.key"
                  type="button"
                  role="tab"
                  class="tab"
                  :aria-selected="period === p.key"
                  :tabindex="period === p.key ? 0 : -1"
                  @click="period = p.key"
                  @keydown.right.prevent="period = periods[(periods.findIndex((x) => x.key === period) + 1) % 3].key"
                  @keydown.left.prevent="period = periods[(periods.findIndex((x) => x.key === period) + 2) % 3].key"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>
            <div v-if="loading" class="skeleton-line" style="height: 60px" />
            <div v-else-if="data" class="metrics" role="tabpanel">
              <article v-for="m in data.commitMetrics" :key="m.id" v-tilt="{ max: 3, lift: 2 }" class="metric slot">
                <p class="metric-value pixel">
                  <template v-if="m.counts[period] != null">{{ fmt(m.counts[period]!) }}<span v-if="m.incomplete" class="plus" title="Lower bound">+</span></template>
                  <template v-else><span class="na">Unavailable</span></template>
                </p>
                <h4>{{ m.title }}</h4>
                <p class="def">{{ m.definition }}</p>
                <details>
                  <summary>How this is counted</summary>
                  <ul>
                    <li v-for="n in m.notes" :key="n">{{ n }}</li>
                  </ul>
                </details>
              </article>
              <p v-if="data.commitMetrics.length < 2" class="note dim">
                A second metric — commits in my own repositories, scanned commit by commit and de-duplicated by SHA — is added when the site is built by
                the GitHub Action.
              </p>
            </div>
          </div>

          <div v-reveal class="panel panel-pad pushes">
            <h3 class="pixel">Pushes <span class="est">Estimate</span></h3>
            <div v-if="loading" class="skeleton-line" style="height: 60px" />
            <template v-else-if="push">
              <div class="push-nums">
                <div class="slot pn"><span class="pixel big">{{ fmt(push.pushes) }}</span><span>pushes observed</span></div>
                <div class="slot pn">
                  <span class="pixel big">{{ push.commitsInPushes != null ? fmt(push.commitsInPushes) : '—' }}</span>
                  <span>{{ push.commitsInPushes != null ? 'commits in those pushes' : 'commits per push not reported' }}</span>
                </div>
              </div>
              <p class="def">
                Counted from public push events between
                <strong>{{ formatDate(push.windowStart) }}</strong> and <strong>{{ formatDate(push.windowEnd) }}</strong>
                ({{ push.eventsSeen }} events seen). GitHub only exposes about the last 90 days and at most 300 public events, so this is
                <strong>not a lifetime total</strong>.
              </p>
              <details>
                <summary>Commits vs. pushes</summary>
                <ul>
                  <li>One push can carry many commits, so the two numbers measure different things.</li>
                  <li>Commit history alone cannot reconstruct how many pushes happened, which is why pushes come from the event stream instead.</li>
                  <li v-if="push.capped">The 300-event limit was reached, so older pushes inside the window may be missing.</li>
                  <li v-if="push.commitsInPushes == null">GitHub no longer includes commit counts in every push event, so commits per push are left blank rather than estimated.</li>
                </ul>
              </details>
            </template>
            <p v-else class="muted">No public events were available.</p>
          </div>
        </div>

        <div v-reveal class="panel panel-pad block">
          <div class="head">
            <h3 class="pixel">Contribution landscape</h3>
            <span v-if="data?.contributions" class="dim small">{{ fmt(data.contributions.total) }} in this window</span>
          </div>
          <div v-if="loading" class="skeleton-line" style="height: 120px" />
          <template v-else-if="data?.contributions">
            <ContributionLandscape :contributions="data.contributions" />
            <p class="def">{{ data.contributions.label }}</p>
          </template>
          <p v-else class="muted">No public contribution data is available yet.</p>
        </div>

        <div class="cols">
          <div v-reveal class="panel panel-pad block">
            <h3 class="pixel">Repository timeline</h3>
            <div v-if="loading" class="skeleton-line" style="height: 100px" />
            <RepoTimeline v-else-if="derived" :months="derived.months" />
          </div>
          <div v-reveal class="panel panel-pad block">
            <h3 class="pixel">Code by language</h3>
            <div v-if="loading" class="skeleton-line" style="height: 100px" />
            <ul v-else-if="derived" class="langs">
              <li v-for="l in derived.languages.slice(0, 7)" :key="l.name">
                <span class="ln"><TechLogo :name="l.name" :color="l.color" :size="18" />{{ l.name }}</span>
                <span class="lb"><span :style="{ width: `${Math.max(2, l.share * 100)}%`, background: l.color }" /></span>
                <span class="lp mono">{{ l.bytes ? `${(l.share * 100).toFixed(1)}%` : `${l.repos.length} repos` }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="cols">
          <div v-reveal class="panel panel-pad block">
            <h3 class="pixel">Recent public activity</h3>
            <div v-if="loading" class="skeleton-line" style="height: 100px" />
            <ol v-else-if="data?.events.length" class="feed">
              <li v-for="e in data.events.slice(0, 10)" :key="e.id">
                <span class="slot fi"><PixelIcon :name="describe(e).icon" :size="16" /></span>
                <span class="ft">
                  {{ describe(e).text }}
                  <a :href="`https://github.com/${e.repo}`" target="_blank" rel="noopener noreferrer">{{ e.repo }}</a>
                </span>
                <time class="dim" :datetime="e.createdAt">{{ relativeTime(e.createdAt) }}</time>
              </li>
            </ol>
            <p v-else class="muted">No recent public events.</p>
          </div>
          <div v-reveal class="panel panel-pad block">
            <h3 class="pixel">Latest commits</h3>
            <div v-if="loading" class="skeleton-line" style="height: 100px" />
            <ol v-else-if="data?.recentCommits.length" class="feed">
              <li v-for="c in data.recentCommits.slice(0, 8)" :key="c.sha">
                <span class="slot fi mono sha">{{ c.sha.slice(0, 7) }}</span>
                <span class="ft">
                  <a v-if="c.url" :href="c.url" target="_blank" rel="noopener noreferrer">{{ c.message || '(no message)' }}</a>
                  <span v-else>{{ c.message }}</span>
                  <span class="dim"> · {{ c.repo }}</span>
                </span>
                <time class="dim" :datetime="c.date">{{ relativeTime(c.date) }}</time>
              </li>
            </ol>
            <p v-else class="muted">No commits found in the last 30 days through GitHub search.</p>
          </div>
        </div>

        <footer class="source panel panel-pad">
          <div>
            <p class="pixel src-title">Data source</p>
            <p class="dim">{{ origin }}</p>
            <ul v-if="data?.notes.length || state.warnings.length" class="dim notes">
              <li v-for="n in [...state.warnings, ...(data?.notes ?? [])]" :key="n">{{ n }}</li>
            </ul>
          </div>
          <div class="src-actions">
            <a v-if="profileUrl" class="btn btn-primary" :href="profileUrl" target="_blank" rel="noopener noreferrer"><PixelIcon name="code" :size="16" /> View GitHub profile</a>
            <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="load(true)">Refresh live</button>
          </div>
        </footer>
      </template>
    </div>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: 8px;
  margin-bottom: 18px;
}
.cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}
.block {
  display: grid;
  gap: 12px;
  align-content: start;
  margin-bottom: 18px;
}
.cols .block {
  margin-bottom: 0;
}
h3 {
  margin: 0;
  font-size: 17px;
  color: var(--heading);
}
.head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.small {
  font-size: 13px;
}
.commits,
.pushes {
  display: grid;
  gap: 14px;
  align-content: start;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tab {
  padding: 6px 10px;
  background: var(--panel-2);
  border: 2px solid var(--edge);
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
}
.tab[aria-selected='true'] {
  background: var(--emerald-deep);
  color: var(--heading);
}
.metrics {
  display: grid;
  gap: 10px;
}
.metric {
  padding: 14px 16px;
}
.metric-value {
  margin: 0;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.1;
  color: var(--heading);
  text-shadow: 3px 3px 0 var(--hshadow);
}
.plus {
  color: var(--warn);
}
.na {
  font-size: 18px;
  color: var(--dim);
}
.metric h4 {
  margin: 6px 0 2px;
  font-size: 15px;
}
.def {
  margin: 0;
  font-size: 13.5px;
  color: var(--muted);
}
details {
  font-size: 13.5px;
  color: var(--muted);
}
summary {
  cursor: pointer;
  color: var(--link);
  margin-top: 6px;
}
details ul {
  margin: 8px 0 0;
  padding-left: 18px;
}
.note {
  margin: 0;
  font-size: 13px;
}
.est {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 10px;
  vertical-align: middle;
  background: var(--gold);
  color: #2a1f05;
  border: 2px solid var(--edge);
}
.push-nums {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.pn {
  display: grid;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--muted);
}
.big {
  font-size: 28px;
  color: var(--heading);
  line-height: 1.2;
}
.langs {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.langs li {
  display: grid;
  grid-template-columns: 130px 1fr 60px;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.ln {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lb {
  height: 10px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #000;
}
.lb span {
  display: block;
  height: 100%;
}
.lp {
  text-align: right;
  color: var(--muted);
  font-size: 13px;
}
.feed {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.feed li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}
.fi {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
}
.sha {
  width: auto;
  padding: 0 6px;
  font-size: 11.5px;
  color: var(--link);
}
.ft {
  min-width: 0;
  overflow-wrap: anywhere;
}
.feed time {
  font-size: 12.5px;
  white-space: nowrap;
}
.source {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}
.src-title {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--accent);
}
.source p {
  margin: 0;
  font-size: 14px;
}
.notes {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 13px;
}
.src-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
@media (max-width: 900px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats :deep(.inv) {
    padding: 12px;
    gap: 10px;
  }
  .langs li {
    grid-template-columns: 100px 1fr 54px;
  }
  .push-nums {
    grid-template-columns: 1fr;
  }
}
</style>
