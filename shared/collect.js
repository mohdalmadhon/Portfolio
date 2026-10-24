import {
  techsFromTopics,
  techsFromPaths,
  techsFromPackageJson,
  techsFromGoMod,
  techsFromRequirements,
  mergeTechs,
  SCREENSHOT_RE,
  SCREENSHOT_DIR_RE,
} from './detect.js'

export class GithubError extends Error {
  constructor(kind, message, extra = {}) {
    super(message)
    this.kind = kind
    this.reset = extra.reset ?? null
    this.status = extra.status ?? null
  }
}

const DAY = 86400000

function str(v, max = 2000) {
  return typeof v === 'string' ? v.slice(0, max) : null
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function isoDay(d) {
  return new Date(d).toISOString().slice(0, 10)
}

async function pool(items, size, fn) {
  const out = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return out
}

export async function collectGithubData(opts) {
  const { login: rawLogin, api, raw, graphql, mode, techMap, log = () => {} } = opts
  const full = mode === 'snapshot'
  const notes = []
  const core = { remaining: Infinity, reset: null }

  async function get(path, bucket = 'core') {
    let res
    try {
      res = await api(path)
    } catch (e) {
      throw new GithubError('network', `Network error while contacting GitHub (${path})`)
    }
    if (bucket === 'core' && res.remaining != null) {
      core.remaining = res.remaining
      core.reset = res.reset
    }
    if (res.status === 403 || res.status === 429) {
      const limited = res.status === 429 || res.remaining === 0
      throw new GithubError(limited ? 'rate-limit' : 'forbidden', limited ? 'GitHub API rate limit reached' : 'GitHub refused the request', { reset: res.reset, status: res.status })
    }
    if (res.status === 404) throw new GithubError('not-found', `Not found: ${path}`, { status: 404 })
    if (res.status === 409 || res.status === 204) return null
    if (res.status >= 400) throw new GithubError('http', `GitHub responded with ${res.status}`, { status: res.status })
    return res.data
  }

  async function soft(path, bucket) {
    try {
      return await get(path, bucket)
    } catch (e) {
      if (e.kind === 'rate-limit' && bucket !== 'search') throw e
      return null
    }
  }

  const u = await get(`/users/${encodeURIComponent(rawLogin)}`)
  if (!u) throw new GithubError('not-found', 'Profile not found')
  const login = str(u.login, 100)
  const profile = {
    login,
    name: str(u.name, 120),
    avatarUrl: str(u.avatar_url, 500),
    htmlUrl: str(u.html_url, 300) || `https://github.com/${login}`,
    bio: str(u.bio, 600),
    blog: str(u.blog, 300),
    location: str(u.location, 120),
    company: str(u.company, 120),
    email: str(u.email, 200),
    twitter: str(u.twitter_username, 60),
    publicRepos: num(u.public_repos),
    followers: num(u.followers),
    following: num(u.following),
    createdAt: str(u.created_at, 40),
  }
  log(`profile ${login}`)

  const rawRepos = []
  for (let page = 1; page <= 10; page++) {
    const batch = await get(`/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`)
    if (!Array.isArray(batch) || !batch.length) break
    rawRepos.push(...batch)
    if (batch.length < 100) break
  }
  const seen = new Set()
  const publicRepos = rawRepos.filter((r) => {
    if (!r || r.private || r.visibility === 'private' || seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
  log(`${publicRepos.length} public repositories`)

  const lowerLogin = login.toLowerCase()
  const repos = publicRepos.map((r) => {
    const name = str(r.name, 200)
    const isUserSite = name.toLowerCase() === `${lowerLogin}.github.io`
    return {
      id: num(r.id),
      name,
      fullName: str(r.full_name, 300),
      description: str(r.description, 500),
      htmlUrl: str(r.html_url, 400),
      homepage: str(r.homepage, 400) || null,
      pagesUrl: r.has_pages ? (isUserSite ? `https://${lowerLogin}.github.io/` : `https://${lowerLogin}.github.io/${name}/`) : null,
      language: str(r.language, 60),
      languages: null,
      stars: num(r.stargazers_count),
      forks: num(r.forks_count),
      openIssues: num(r.open_issues_count),
      isFork: !!r.fork,
      isArchived: !!r.archived,
      topics: Array.isArray(r.topics) ? r.topics.filter((t) => typeof t === 'string').slice(0, 20) : [],
      createdAt: str(r.created_at, 40),
      updatedAt: str(r.updated_at, 40),
      pushedAt: str(r.pushed_at, 40),
      sizeKb: num(r.size),
      defaultBranch: str(r.default_branch, 120) || 'main',
      parent: null,
      techs: [],
      contributors: null,
      previewImage: `https://opengraph.githubassets.com/1/${str(r.full_name, 300)}`,
      previewKind: 'social',
    }
  })

  const byPush = [...repos].sort((a, b) => (b.pushedAt || '').localeCompare(a.pushedAt || ''))
  const langTargets = byPush.filter((r) => r.sizeKb > 0)
  let langSkipped = 0
  await pool(langTargets, 4, async (repo) => {
    if (!full && (core.remaining < 10 || langTargets.indexOf(repo) >= 45)) {
      langSkipped++
      return
    }
    const langs = await soft(`/repos/${repo.fullName}/languages`)
    if (langs && typeof langs === 'object') {
      const clean = {}
      for (const [k, v] of Object.entries(langs)) if (typeof v === 'number' && v > 0) clean[k.slice(0, 60)] = v
      repo.languages = clean
    }
  })
  if (langSkipped) notes.push(`Language byte statistics were loaded for ${langTargets.length - langSkipped} of ${langTargets.length} repositories to stay within the unauthenticated API limit; the rest use their primary language only.`)

  let contribSkipped = 0
  await pool(langTargets, 4, async (repo, idx) => {
    if (!full && (core.remaining < 8 || idx >= 30)) {
      contribSkipped++
      return
    }
    const list = await soft(`/repos/${repo.fullName}/contributors?per_page=100`)
    if (Array.isArray(list)) {
      repo.contributors = list
        .filter((c) => c && typeof c.login === 'string' && c.type !== 'Bot' && !/\[bot\]$/.test(c.login))
        .slice(0, 40)
        .map((c) => ({ login: str(c.login, 100), avatarUrl: str(c.avatar_url, 400), htmlUrl: str(c.html_url, 300), commits: num(c.contributions) }))
    }
  })
  if (contribSkipped) notes.push(`Contributor lists were loaded for ${langTargets.length - contribSkipped} of ${langTargets.length} repositories; the rest load when you open a project.`)

  for (const repo of repos) repo.techs = techsFromTopics(techMap, repo.topics)

  if (full) {
    await pool(repos, 4, async (repo) => {
      if (repo.isFork) {
        const detail = await soft(`/repos/${repo.fullName}`)
        if (detail && detail.parent) repo.parent = { fullName: str(detail.parent.full_name, 300), htmlUrl: str(detail.parent.html_url, 400) }
      }
      if (repo.sizeKb === 0) return
      const tree = await soft(`/repos/${repo.fullName}/git/trees/${encodeURIComponent(repo.defaultBranch)}?recursive=1`)
      if (!tree || !Array.isArray(tree.tree)) return
      const paths = tree.tree.filter((t) => t && typeof t.path === 'string').map((t) => t.path).filter((p) => !/(^|\/)(node_modules|vendor|dist|build)\//.test(p))
      const found = [...techsFromTopics(techMap, repo.topics), ...techsFromPaths(techMap, paths)]
      const depth = (p) => p.split('/').length
      const pick = (re, n) => paths.filter((p) => re.test(p)).sort((a, b) => depth(a) - depth(b)).slice(0, n)
      const manifests = [
        ...pick(/(^|\/)package\.json$/, 4).map((p) => ['npm', p]),
        ...pick(/(^|\/)go\.mod$/, 3).map((p) => ['go', p]),
        ...pick(/(^|\/)requirements\.txt$/, 2).map((p) => ['pip', p]),
      ]
      for (const [kind, p] of manifests) {
        const text = await raw(repo.fullName, repo.defaultBranch, p)
        if (!text) continue
        if (kind === 'npm') found.push(...techsFromPackageJson(techMap, text, p))
        if (kind === 'go') found.push(...techsFromGoMod(techMap, text, p))
        if (kind === 'pip') found.push(...techsFromRequirements(techMap, text, p))
      }
      repo.techs = mergeTechs(found)
      const shots = paths.filter((p) => SCREENSHOT_RE.test(p) || SCREENSHOT_DIR_RE.test(p)).sort((a, b) => depth(a) - depth(b))
      if (shots.length) {
        repo.previewImage = `https://raw.githubusercontent.com/${repo.fullName}/${encodeURIComponent(repo.defaultBranch)}/${shots[0].split('/').map(encodeURIComponent).join('/')}`
        repo.previewKind = 'screenshot'
      }
    })
    log('repository details collected')
  }

  const now = Date.now()
  const since30 = isoDay(now - 30 * DAY)
  const since12 = isoDay(now - 365 * DAY)
  const commitMetrics = []
  const recentCommits = []
  const searchCounts = {}
  let searchIncomplete = false
  let searchFailed = false
  const searchQueries = [
    ['30d', `author:${login} author-date:>=${since30}`, 10],
    ['12m', `author:${login} author-date:>=${since12}`, 1],
    ['all', `author:${login}`, 1],
  ]
  for (const [key, q, per] of searchQueries) {
    const res = await soft(`/search/commits?q=${encodeURIComponent(q)}&sort=author-date&order=desc&per_page=${per}`, 'search')
    if (!res) {
      searchCounts[key] = null
      searchFailed = true
      continue
    }
    searchCounts[key] = num(res.total_count)
    if (res.incomplete_results) searchIncomplete = true
    if (key === '30d' && Array.isArray(res.items)) {
      for (const it of res.items) {
        recentCommits.push({
          sha: str(it.sha, 64),
          message: (str(it.commit?.message, 400) || '').split('\n')[0].slice(0, 140),
          repo: str(it.repository?.full_name, 300),
          url: str(it.html_url, 400),
          date: str(it.commit?.author?.date, 40),
        })
      }
    }
  }
  const searchNotes = [
    'Counted by GitHub commit search: commits whose author is linked to this account, on the default branches of public repositories GitHub has indexed.',
    'Commits authored with an email address that is not linked to the account are not counted.',
  ]
  if (searchIncomplete) searchNotes.push('GitHub reported that one or more search results were incomplete (search timed out), so the true number may be higher.')
  if (searchFailed) searchNotes.push('One or more search requests failed or hit the search rate limit; those periods show no value instead of a guess.')
  commitMetrics.push({
    id: 'search-authored',
    title: 'Commits authored across public GitHub',
    definition: 'Commits authored by this account in any public repository indexed by GitHub search (default branches). Each commit is counted once.',
    counts: searchCounts,
    incomplete: searchIncomplete || searchFailed,
    notes: searchNotes,
  })

  if (full) {
    const shas = new Map()
    let capped = false
    let scanned = 0
    await pool(repos.filter((r) => !r.isFork && r.sizeKb > 0), 3, async (repo) => {
      for (let page = 1; page <= 30; page++) {
        const list = await soft(`/repos/${repo.fullName}/commits?author=${encodeURIComponent(login)}&per_page=100&page=${page}`)
        if (!Array.isArray(list) || !list.length) break
        for (const c of list) {
          if (c && typeof c.sha === 'string' && !shas.has(c.sha)) shas.set(c.sha, str(c.commit?.author?.date, 40))
        }
        if (list.length < 100) break
        if (page === 30) capped = true
      }
      scanned++
    })
    const dates = [...shas.values()].filter(Boolean).map((d) => Date.parse(d))
    commitMetrics.push({
      id: 'own-repos-authored',
      title: 'Commits in my own repositories',
      definition: `Commits authored by this account on the default branch of the ${scanned} non-fork public repositories it owns, de-duplicated by commit SHA.`,
      counts: {
        '30d': dates.filter((d) => d >= now - 30 * DAY).length,
        '12m': dates.filter((d) => d >= now - 365 * DAY).length,
        all: shas.size,
      },
      incomplete: capped,
      notes: [
        'Only default branches are scanned; work that lives only on other branches is not included.',
        capped ? 'At least one repository has more than 3,000 commits; the scan stopped there, so the total is a lower bound.' : 'Full history of each default branch was scanned.',
      ],
    })
    log(`${shas.size} unique commits in own repositories`)
  }

  const events = []
  let eventsCapped = false
  for (let page = 1; page <= 3; page++) {
    const batch = await soft(`/users/${encodeURIComponent(login)}/events/public?per_page=100&page=${page}`)
    if (!Array.isArray(batch) || !batch.length) break
    for (const e of batch) {
      const p = e.payload || {}
      const commits = typeof p.distinct_size === 'number' ? p.distinct_size : typeof p.size === 'number' ? p.size : Array.isArray(p.commits) ? p.commits.length : null
      events.push({
        id: String(e.id).slice(0, 40),
        type: str(e.type, 60) || 'Event',
        repo: str(e.repo?.name, 300) || '',
        createdAt: str(e.created_at, 40),
        commits: e.type === 'PushEvent' ? commits : null,
        ref: str(p.ref, 200),
        action: str(p.action, 60) || (e.type === 'CreateEvent' ? str(p.ref_type, 40) : null),
      })
    }
    if (batch.length < 100) break
    if (page === 3) eventsCapped = true
  }
  const pushes = events.filter((e) => e.type === 'PushEvent')
  const pushCommitsKnown = pushes.length > 0 && pushes.every((e) => typeof e.commits === 'number')
  const times = events.map((e) => Date.parse(e.createdAt)).filter(Number.isFinite)
  const pushStats = {
    pushes: pushes.length,
    commitsInPushes: pushCommitsKnown ? pushes.reduce((s, e) => s + e.commits, 0) : null,
    windowStart: times.length ? new Date(Math.min(...times)).toISOString() : null,
    windowEnd: times.length ? new Date(Math.max(...times)).toISOString() : null,
    eventsSeen: events.length,
    capped: eventsCapped,
  }

  let contributions = null
  if (graphql) {
    try {
      const res = await graphql(
        'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}',
        { login },
      )
      const cal = res?.data?.user?.contributionsCollection?.contributionCalendar
      if (cal) {
        const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: num(d.contributionCount) }))
        contributions = {
          source: 'graphql',
          label: 'Public contributions from GitHub’s contribution calendar (last 12 months)',
          from: days[0]?.date,
          to: days[days.length - 1]?.date,
          total: num(cal.totalContributions),
          days,
        }
      }
    } catch {
      notes.push('The contribution calendar could not be loaded from the GraphQL API; showing observed public events instead.')
    }
  }
  if (!contributions && events.length) {
    const counts = new Map()
    for (const e of events) {
      const d = e.createdAt.slice(0, 10)
      const w = e.type === 'PushEvent' ? Math.max(1, e.commits ?? 1) : ['PullRequestEvent', 'IssuesEvent', 'CreateEvent', 'PullRequestReviewEvent'].includes(e.type) ? 1 : 0
      if (w) counts.set(d, (counts.get(d) || 0) + w)
    }
    const end = new Date()
    const start = new Date(Date.parse(pushStats.windowStart || end.toISOString()))
    const days = []
    for (let t = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); t <= end.getTime(); t += DAY) {
      const d = isoDay(t)
      days.push({ date: d, count: counts.get(d) || 0 })
    }
    contributions = {
      source: 'events',
      label: 'Observed public activity from the Events API (pushed commits, pull requests, issues and new repositories). Limited to the last 90 days and 300 events.',
      from: days[0]?.date,
      to: days[days.length - 1]?.date,
      total: days.reduce((s, d) => s + d.count, 0),
      days,
    }
  }

  return {
    schema: 1,
    generatedAt: new Date().toISOString(),
    source: full ? 'snapshot' : 'live',
    login,
    profile,
    repos,
    commitMetrics,
    recentCommits: recentCommits.slice(0, 10),
    events: events.slice(0, 300),
    pushStats,
    contributions,
    notes,
  }
}
