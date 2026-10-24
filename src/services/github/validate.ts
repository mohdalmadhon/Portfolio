import { isoOrNull, num, safeUrl, str } from '../safe'
import type { Contributor, ActivityEvent, CommitMetric, CommitSample, Contributions, GhProfile, GhRepo, GithubData, PushStats, TechEvidence } from './types'

const CATS = new Set(['frontend', 'backend', 'database', 'framework', 'tooling', 'devops', 'mobile', 'testing'])
const SRC = new Set(['manifest', 'file', 'topic'])

function obj(v: unknown): Record<string, any> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : null
}

function arr(v: unknown): any[] {
  return Array.isArray(v) ? v : []
}

function profile(v: unknown): GhProfile | null {
  const p = obj(v)
  if (!p || !str(p.login)) return null
  return {
    login: str(p.login, 100)!,
    name: str(p.name, 120),
    avatarUrl: safeUrl(p.avatarUrl),
    htmlUrl: safeUrl(p.htmlUrl) ?? `https://github.com/${p.login}`,
    bio: str(p.bio, 600),
    blog: safeUrl(p.blog),
    location: str(p.location, 120),
    company: str(p.company, 120),
    email: str(p.email, 200),
    twitter: str(p.twitter, 60),
    publicRepos: num(p.publicRepos),
    followers: num(p.followers),
    following: num(p.following),
    createdAt: isoOrNull(p.createdAt),
  }
}

function tech(v: unknown): TechEvidence | null {
  const t = obj(v)
  if (!t || !str(t.name) || !CATS.has(t.category) || !SRC.has(t.source)) return null
  return { name: str(t.name, 80)!, category: t.category, source: t.source, evidence: str(t.evidence, 300) ?? '' }
}

export function contributor(v: unknown): Contributor | null {
  const c = obj(v)
  if (!c || !str(c.login)) return null
  return { login: str(c.login, 100)!, avatarUrl: safeUrl(c.avatarUrl), htmlUrl: safeUrl(c.htmlUrl) ?? `https://github.com/${c.login}`, commits: num(c.commits) }
}

function repo(v: unknown): GhRepo | null {
  const r = obj(v)
  if (!r || !str(r.name) || !str(r.fullName)) return null
  const htmlUrl = safeUrl(r.htmlUrl)
  if (!htmlUrl) return null
  let languages: Record<string, number> | null = null
  const l = obj(r.languages)
  if (l) {
    languages = {}
    for (const [k, n] of Object.entries(l)) if (typeof n === 'number' && n > 0) languages[k.slice(0, 60)] = n
  }
  const parent = obj(r.parent)
  return {
    id: num(r.id),
    name: str(r.name, 200)!,
    fullName: str(r.fullName, 300)!,
    description: str(r.description, 500),
    htmlUrl,
    homepage: safeUrl(r.homepage),
    pagesUrl: safeUrl(r.pagesUrl),
    language: str(r.language, 60),
    languages,
    stars: num(r.stars),
    forks: num(r.forks),
    openIssues: num(r.openIssues),
    isFork: !!r.isFork,
    isArchived: !!r.isArchived,
    topics: arr(r.topics).filter((t) => typeof t === 'string').slice(0, 20),
    createdAt: isoOrNull(r.createdAt) ?? new Date(0).toISOString(),
    updatedAt: isoOrNull(r.updatedAt) ?? new Date(0).toISOString(),
    pushedAt: isoOrNull(r.pushedAt),
    sizeKb: num(r.sizeKb),
    defaultBranch: str(r.defaultBranch, 120) ?? 'main',
    parent: parent && str(parent.fullName) && safeUrl(parent.htmlUrl) ? { fullName: str(parent.fullName, 300)!, htmlUrl: safeUrl(parent.htmlUrl)! } : null,
    techs: arr(r.techs).map(tech).filter((t): t is TechEvidence => !!t),
    contributors: Array.isArray(r.contributors) ? r.contributors.map(contributor).filter((c: Contributor | null): c is Contributor => !!c) : null,
    previewImage: safeUrl(r.previewImage),
    previewKind: r.previewKind === 'screenshot' || r.previewKind === 'social' ? r.previewKind : null,
  }
}

function metric(v: unknown): CommitMetric | null {
  const m = obj(v)
  if (!m || (m.id !== 'search-authored' && m.id !== 'own-repos-authored')) return null
  const counts: CommitMetric['counts'] = {}
  const c = obj(m.counts) ?? {}
  for (const k of ['30d', '12m', 'all'] as const) counts[k] = typeof c[k] === 'number' ? c[k] : null
  return {
    id: m.id,
    title: str(m.title, 120) ?? '',
    definition: str(m.definition, 600) ?? '',
    counts,
    incomplete: !!m.incomplete,
    notes: arr(m.notes).filter((n) => typeof n === 'string').map((n) => n.slice(0, 400)),
  }
}

function commit(v: unknown): CommitSample | null {
  const c = obj(v)
  if (!c || !str(c.sha) || !isoOrNull(c.date)) return null
  return { sha: str(c.sha, 64)!, message: str(c.message, 200) ?? '', repo: str(c.repo, 300) ?? '', url: safeUrl(c.url) ?? '', date: c.date }
}

function event(v: unknown): ActivityEvent | null {
  const e = obj(v)
  if (!e || !str(e.type) || !isoOrNull(e.createdAt)) return null
  return {
    id: str(e.id, 40) ?? '',
    type: str(e.type, 60)!,
    repo: str(e.repo, 300) ?? '',
    createdAt: e.createdAt,
    commits: typeof e.commits === 'number' ? e.commits : null,
    ref: str(e.ref, 200),
    action: str(e.action, 60),
  }
}

function pushStats(v: unknown): PushStats | null {
  const p = obj(v)
  if (!p) return null
  return {
    pushes: num(p.pushes),
    commitsInPushes: typeof p.commitsInPushes === 'number' ? p.commitsInPushes : null,
    windowStart: isoOrNull(p.windowStart),
    windowEnd: isoOrNull(p.windowEnd),
    eventsSeen: num(p.eventsSeen),
    capped: !!p.capped,
  }
}

function contributions(v: unknown): Contributions | null {
  const c = obj(v)
  if (!c || (c.source !== 'graphql' && c.source !== 'events')) return null
  const days = arr(c.days)
    .map((d) => obj(d))
    .filter((d): d is Record<string, any> => !!d && /^\d{4}-\d{2}-\d{2}$/.test(String(d.date)))
    .map((d) => ({ date: String(d.date), count: Math.max(0, num(d.count)) }))
  if (!days.length) return null
  return { source: c.source, label: str(c.label, 400) ?? '', from: days[0].date, to: days[days.length - 1].date, total: num(c.total), days }
}

export function validateGithubData(v: unknown): GithubData | null {
  const d = obj(v)
  if (!d || d.schema !== 1) return null
  const p = profile(d.profile)
  if (!p) return null
  return {
    schema: 1,
    generatedAt: isoOrNull(d.generatedAt) ?? new Date().toISOString(),
    source: d.source === 'snapshot' ? 'snapshot' : 'live',
    login: p.login,
    profile: p,
    repos: arr(d.repos).map(repo).filter((r): r is GhRepo => !!r),
    commitMetrics: arr(d.commitMetrics).map(metric).filter((m): m is CommitMetric => !!m),
    recentCommits: arr(d.recentCommits).map(commit).filter((c): c is CommitSample => !!c),
    events: arr(d.events).map(event).filter((e): e is ActivityEvent => !!e),
    pushStats: pushStats(d.pushStats),
    contributions: contributions(d.contributions),
    notes: arr(d.notes).filter((n) => typeof n === 'string').map((n) => n.slice(0, 400)),
  }
}
