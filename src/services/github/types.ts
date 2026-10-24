export type TechCategory = 'frontend' | 'backend' | 'database' | 'framework' | 'tooling' | 'devops' | 'mobile' | 'testing'
export type TechSource = 'manifest' | 'file' | 'topic'

export interface TechEvidence {
  name: string
  category: TechCategory
  source: TechSource
  evidence: string
}

export interface GhProfile {
  login: string
  name: string | null
  avatarUrl: string | null
  htmlUrl: string
  bio: string | null
  blog: string | null
  location: string | null
  company: string | null
  email: string | null
  twitter: string | null
  publicRepos: number
  followers: number
  following: number
  createdAt: string | null
}

export interface Contributor {
  login: string
  avatarUrl: string | null
  htmlUrl: string
  commits: number
}

export interface GhRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  homepage: string | null
  pagesUrl: string | null
  language: string | null
  languages: Record<string, number> | null
  stars: number
  forks: number
  openIssues: number
  isFork: boolean
  isArchived: boolean
  topics: string[]
  createdAt: string
  updatedAt: string
  pushedAt: string | null
  sizeKb: number
  defaultBranch: string
  parent: { fullName: string; htmlUrl: string } | null
  techs: TechEvidence[]
  contributors: Contributor[] | null
  previewImage: string | null
  previewKind: 'screenshot' | 'social' | null
}

export interface CommitSample {
  sha: string
  message: string
  repo: string
  url: string
  date: string
}

export type CommitPeriod = '30d' | '12m' | 'all'

export interface CommitMetric {
  id: 'search-authored' | 'own-repos-authored'
  title: string
  definition: string
  counts: Partial<Record<CommitPeriod, number | null>>
  incomplete: boolean
  notes: string[]
}

export interface ActivityEvent {
  id: string
  type: string
  repo: string
  createdAt: string
  commits: number | null
  ref: string | null
  action: string | null
}

export interface PushStats {
  pushes: number
  commitsInPushes: number | null
  windowStart: string | null
  windowEnd: string | null
  eventsSeen: number
  capped: boolean
}

export interface ContributionDay {
  date: string
  count: number
}

export interface Contributions {
  source: 'graphql' | 'events'
  label: string
  from: string
  to: string
  total: number
  days: ContributionDay[]
}

export interface GithubData {
  schema: 1
  generatedAt: string
  source: 'snapshot' | 'live'
  login: string
  profile: GhProfile
  repos: GhRepo[]
  commitMetrics: CommitMetric[]
  recentCommits: CommitSample[]
  events: ActivityEvent[]
  pushStats: PushStats | null
  contributions: Contributions | null
  notes: string[]
}

export interface LoadResult {
  data: GithubData
  origin: 'snapshot' | 'live' | 'cache' | 'stale-cache'
  warnings: string[]
}
