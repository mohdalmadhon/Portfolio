import type { GhRepo, GithubData, TechCategory, TechSource } from './types'

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Go: '#00add8', HTML: '#e34c26', CSS: '#663399', Vue: '#41b883',
  Python: '#3572a5', Swift: '#f05138', Java: '#b07219', Kotlin: '#a97bff', Rust: '#dea584', C: '#8a8a8a',
  'C++': '#f34b7d', 'C#': '#178600', Shell: '#89e051', Dockerfile: '#4f7a99', PHP: '#4f5d95', Ruby: '#a52a2a',
  Dart: '#00b4ab', SCSS: '#c6538c', Makefile: '#427819', Lua: '#4060c0', 'Objective-C': '#438eff', Svelte: '#ff3e00',
  'Jupyter Notebook': '#da5b0b', PLpgSQL: '#336790', TSQL: '#e38c00', Astro: '#ff5a03', MDX: '#fcb32c',
}

export function languageColor(name: string): string {
  if (LANG_COLORS[name]) return LANG_COLORS[name]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return `hsl(${h} 55% 55%)`
}

export interface LanguageStat {
  name: string
  bytes: number
  share: number
  repos: string[]
  traceRepos: string[]
  color: string
}

export interface TechStat {
  name: string
  category: TechCategory
  sources: TechSource[]
  repos: { name: string; source: TechSource; evidence: string }[]
}

export interface MonthBucket {
  key: string
  label: string
  created: number
  pushed: number
}

export interface DerivedStats {
  ownRepos: GhRepo[]
  forks: GhRepo[]
  totals: { repos: number; ownRepos: number; forks: number; stars: number; forksReceived: number; followers: number; archived: number }
  languages: LanguageStat[]
  traceLanguages: LanguageStat[]
  languagesMeasured: number
  languagesTotalRepos: number
  techs: Record<TechCategory, TechStat[]>
  months: MonthBucket[]
}

const SIGNIFICANT_SHARE = 0.05
const SIGNIFICANT_BYTES = 1500

export function deriveStats(data: GithubData, hidden: string[] = []): DerivedStats {
  const hiddenSet = new Set(hidden.map((h) => h.toLowerCase()))
  const visible = data.repos.filter((r) => !hiddenSet.has(r.name.toLowerCase()))
  const own = visible.filter((r) => !r.isFork)
  const forks = visible.filter((r) => r.isFork)

  const langMap = new Map<string, LanguageStat>()
  let measured = 0
  for (const r of own) {
    const entries = r.languages ? Object.entries(r.languages) : r.language ? [[r.language, 0] as [string, number]] : []
    if (r.languages) measured++
    const total = entries.reduce((s, [, b]) => s + b, 0)
    for (const [name, bytes] of entries) {
      const stat = langMap.get(name) ?? { name, bytes: 0, share: 0, repos: [], traceRepos: [], color: languageColor(name) }
      stat.bytes += bytes
      const significant = r.languages ? total > 0 && bytes / total >= SIGNIFICANT_SHARE && bytes >= SIGNIFICANT_BYTES : true
      if (significant) stat.repos.push(r.name)
      else stat.traceRepos.push(r.name)
      langMap.set(name, stat)
    }
  }
  const totalBytes = [...langMap.values()].reduce((s, l) => s + l.bytes, 0)
  const all = [...langMap.values()].map((l) => ({ ...l, share: totalBytes ? l.bytes / totalBytes : 0 }))
  const languages = all.filter((l) => l.repos.length > 0).sort((a, b) => b.repos.length - a.repos.length || b.bytes - a.bytes)
  const traceLanguages = all.filter((l) => l.repos.length === 0).sort((a, b) => b.bytes - a.bytes)

  const techMap = new Map<string, TechStat>()
  for (const r of own) {
    for (const t of r.techs) {
      const stat = techMap.get(t.name) ?? { name: t.name, category: t.category, sources: [], repos: [] }
      if (!stat.sources.includes(t.source)) stat.sources.push(t.source)
      if (!stat.repos.some((x) => x.name === r.name)) stat.repos.push({ name: r.name, source: t.source, evidence: t.evidence })
      techMap.set(t.name, stat)
    }
  }
  const techs = { frontend: [], backend: [], database: [], framework: [], tooling: [], devops: [], mobile: [], testing: [] } as Record<TechCategory, TechStat[]>
  for (const t of techMap.values()) techs[t.category].push(t)
  for (const k of Object.keys(techs) as TechCategory[]) techs[k].sort((a, b) => b.repos.length - a.repos.length || a.name.localeCompare(b.name))

  const months: MonthBucket[] = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = d.toISOString().slice(0, 7)
    months.push({ key, label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }), created: 0, pushed: 0 })
  }
  const idx = new Map(months.map((m, i) => [m.key, i]))
  for (const r of visible) {
    const c = idx.get(r.createdAt.slice(0, 7))
    if (c !== undefined) months[c].created++
    const p = r.pushedAt ? idx.get(r.pushedAt.slice(0, 7)) : undefined
    if (p !== undefined) months[p].pushed++
  }

  return {
    ownRepos: own,
    forks,
    totals: {
      repos: visible.length,
      ownRepos: own.length,
      forks: forks.length,
      stars: visible.reduce((s, r) => s + r.stars, 0),
      forksReceived: visible.reduce((s, r) => s + r.forks, 0),
      followers: data.profile.followers,
      archived: visible.filter((r) => r.isArchived).length,
    },
    languages,
    traceLanguages,
    languagesMeasured: measured,
    languagesTotalRepos: own.length,
    techs,
    months,
  }
}

export function repoSummary(r: GhRepo): string {
  const parts: string[] = []
  const langs = r.languages ? Object.entries(r.languages).sort((a, b) => b[1] - a[1]).map(([n]) => n) : r.language ? [r.language] : []
  if (r.isFork && r.parent) parts.push(`A fork of ${r.parent.fullName}.`)
  else if (r.isFork) parts.push('A forked repository.')
  if (langs.length) parts.push(`Written mainly in ${langs[0]}${langs.length > 1 ? `, with ${langs.slice(1, 4).join(', ')}` : ''}.`)
  const named = r.techs.filter((t) => t.source !== 'topic').map((t) => t.name).slice(0, 5)
  if (named.length) parts.push(`Uses ${named.join(', ')} according to its source files.`)
  const created = new Date(r.createdAt)
  if (Number.isFinite(created.getTime()) && created.getTime() > 0) parts.push(`Created ${created.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`)
  if (r.isArchived) parts.push('This repository is archived.')
  return parts.join(' ')
}

export function relativeTime(iso: string | null): string {
  if (!iso) return 'unknown'
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 'unknown'
  const s = (Date.now() - t) / 1000
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'], [Infinity, 'year']]
  let v = s
  for (const [n, unit] of steps) {
    if (Math.abs(v) < n) return rtf.format(-Math.round(v), unit)
    v /= n
  }
  return ''
}

export function formatDate(iso: string | null, withDay = true): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  return new Date(t).toLocaleDateString(undefined, withDay ? { day: 'numeric', month: 'short', year: 'numeric' } : { month: 'short', year: 'numeric' })
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
