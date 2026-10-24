import techMap from '../../../shared/tech-map.json'
import { collectGithubData, GithubError } from '../../../shared/collect.js'
import type { TechMap } from '../../../shared/detect'
import type { GithubData, LoadResult } from './types'
import { contributor, validateGithubData } from './validate'
import type { Contributor } from './types'

const CACHE_TTL = 30 * 60 * 1000
const cacheKey = (login: string) => `gh-portfolio:v1:${login.toLowerCase()}`

export class GithubLoadError extends Error {
  constructor(public kind: 'config' | 'rate-limit' | 'not-found' | 'network' | 'http', message: string, public reset: number | null = null) {
    super(message)
  }
}

export function parseUsername(input: string): string {
  const s = input.trim()
  if (!s) return ''
  const m = s.match(/github\.com\/([A-Za-z0-9-]+)/i)
  const name = m ? m[1] : s.replace(/^@/, '')
  return /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(name) ? name : ''
}

export function usernameFromHost(): string {
  try {
    const m = window.location.hostname.match(/^([A-Za-z0-9-]+)\.github\.io$/i)
    return m ? m[1] : ''
  } catch {
    return ''
  }
}

function readCache(login: string): { data: GithubData; at: number } | null {
  try {
    const raw = localStorage.getItem(cacheKey(login))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const data = validateGithubData(parsed.data)
    return data ? { data, at: Number(parsed.at) || 0 } : null
  } catch {
    return null
  }
}

function writeCache(login: string, data: GithubData) {
  try {
    localStorage.setItem(cacheKey(login), JSON.stringify({ at: Date.now(), data }))
  } catch {
    return
  }
}

async function loadSnapshot(): Promise<GithubData | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/github.json`, { cache: 'no-cache' })
    if (!res.ok) return null
    const type = res.headers.get('content-type') || ''
    if (!type.includes('json')) return null
    return validateGithubData(await res.json())
  } catch {
    return null
  }
}

async function liveApi(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  })
  const remaining = res.headers.get('x-ratelimit-remaining')
  const reset = res.headers.get('x-ratelimit-reset')
  let data: unknown = null
  if (res.status !== 204) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  }
  return {
    status: res.status,
    data,
    remaining: remaining == null ? null : Number(remaining),
    reset: reset == null ? null : Number(reset),
  }
}

export async function loadGithubData(configured: string, opts: { forceLive?: boolean } = {}): Promise<LoadResult> {
  const warnings: string[] = []
  const wanted = parseUsername(configured)
  if (!opts.forceLive) {
    const snap = await loadSnapshot()
    if (snap && (!wanted || snap.login.toLowerCase() === wanted.toLowerCase())) {
      return { data: snap, origin: 'snapshot', warnings }
    }
    if (snap && wanted) warnings.push(`The pre-built snapshot is for @${snap.login}, not @${wanted}; loading live data instead.`)
  }
  const login = wanted || usernameFromHost()
  if (!login) throw new GithubLoadError('config', 'No GitHub username is configured yet. Set githubUsername in src/config/site.ts, or deploy with the included GitHub Action.')

  const cached = readCache(login)
  if (cached && Date.now() - cached.at < CACHE_TTL && !opts.forceLive) {
    return { data: cached.data, origin: 'cache', warnings }
  }
  try {
    const raw = await collectGithubData({
      login,
      mode: 'live',
      techMap: techMap as unknown as TechMap,
      api: liveApi,
      raw: async () => null,
    })
    const data = validateGithubData(raw)
    if (!data) throw new GithubLoadError('http', 'GitHub returned data in an unexpected format.')
    writeCache(login, data)
    return { data, origin: 'live', warnings }
  } catch (err) {
    const e = err as GithubError
    let wrapped: GithubLoadError
    if (e instanceof GithubLoadError) wrapped = e
    else if (e?.kind === 'rate-limit') wrapped = new GithubLoadError('rate-limit', 'The GitHub API rate limit for your network has been reached.', e.reset)
    else if (e?.kind === 'not-found') wrapped = new GithubLoadError('not-found', `GitHub user @${login} was not found.`)
    else if (e?.kind === 'network') wrapped = new GithubLoadError('network', 'GitHub could not be reached. Check your connection.')
    else wrapped = new GithubLoadError('http', 'GitHub is temporarily unavailable.')
    if (cached) {
      warnings.push(`${wrapped.message} Showing data saved ${new Date(cached.at).toLocaleString()}.`)
      return { data: cached.data, origin: 'stale-cache', warnings }
    }
    throw wrapped
  }
}

export async function fetchContributors(fullName: string): Promise<Contributor[] | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/contributors?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    })
    if (res.status === 204) return []
    if (!res.ok) return null
    const list = await res.json()
    if (!Array.isArray(list)) return null
    return list
      .filter((c) => c && c.type !== 'Bot' && typeof c.login === 'string' && !/\[bot\]$/.test(c.login))
      .slice(0, 40)
      .map((c) => contributor({ login: c.login, avatarUrl: c.avatar_url, htmlUrl: c.html_url, commits: c.contributions }))
      .filter((c): c is Contributor => !!c)
  } catch {
    return null
  }
}
