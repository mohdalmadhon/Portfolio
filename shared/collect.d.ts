import type { GithubData } from '../src/services/github/types'
import type { TechMap } from './detect'

export interface ApiResponse {
  status: number
  data: unknown
  remaining: number | null
  reset: number | null
}

export class GithubError extends Error {
  kind: 'network' | 'rate-limit' | 'forbidden' | 'not-found' | 'http'
  reset: number | null
  status: number | null
}

export interface CollectOptions {
  login: string
  mode: 'snapshot' | 'live'
  techMap: TechMap
  api: (path: string) => Promise<ApiResponse>
  raw: (fullName: string, branch: string, path: string) => Promise<string | null>
  graphql?: (query: string, variables: Record<string, unknown>) => Promise<any>
  log?: (msg: string) => void
}

export function collectGithubData(opts: CollectOptions): Promise<GithubData>
