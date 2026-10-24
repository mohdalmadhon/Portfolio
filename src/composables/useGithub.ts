import { computed, reactive, shallowRef } from 'vue'
import { site } from '../config/site'
import { GithubLoadError, loadGithubData } from '../services/github'
import { deriveStats, type DerivedStats } from '../services/github/derive'
import type { GithubData, LoadResult } from '../services/github/types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const data = shallowRef<GithubData | null>(null)
const derived = shallowRef<DerivedStats | null>(null)
const state = reactive({
  status: 'idle' as Status,
  origin: null as LoadResult['origin'] | null,
  warnings: [] as string[],
  error: null as { kind: string; message: string; reset: number | null } | null,
})

let inflight: Promise<void> | null = null

async function load(forceLive = false) {
  if (inflight && !forceLive) return inflight
  state.status = 'loading'
  state.error = null
  inflight = (async () => {
    try {
      const res = await loadGithubData(site.githubUsername, { forceLive })
      data.value = res.data
      derived.value = deriveStats(res.data, site.hiddenRepos)
      state.origin = res.origin
      state.warnings = res.warnings
      state.status = 'ready'
    } catch (err) {
      const e = err instanceof GithubLoadError ? err : new GithubLoadError('http', 'Something went wrong while loading GitHub data.')
      state.error = { kind: e.kind, message: e.message, reset: e.reset }
      state.status = 'error'
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useGithub() {
  return {
    state,
    data,
    derived,
    load,
    profileUrl: computed(() => data.value?.profile.htmlUrl ?? (site.githubUsername ? `https://github.com/${site.githubUsername}` : null)),
    displayName: computed(() => site.displayNameOverride || data.value?.profile.name || data.value?.login || site.githubUsername || ''),
  }
}

export function rateLimitText(reset: number | null): string {
  if (!reset) return ''
  const mins = Math.max(1, Math.ceil((reset * 1000 - Date.now()) / 60000))
  return `It resets in about ${mins} minute${mins === 1 ? '' : 's'}.`
}
