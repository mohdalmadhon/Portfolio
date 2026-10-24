import type { TechEvidence } from '../src/services/github/types'

export interface TechMap {
  categories: Record<string, string>
  npm: Record<string, [string, string]>
  go: Record<string, [string, string]>
  pip: Record<string, [string, string]>
  files: [string, string, string][]
  topics: Record<string, [string, string]>
}

export function techsFromTopics(map: TechMap, topics: string[]): TechEvidence[]
export function techsFromPaths(map: TechMap, paths: string[]): TechEvidence[]
export function techsFromPackageJson(map: TechMap, text: string, path: string): TechEvidence[]
export function techsFromGoMod(map: TechMap, text: string, path: string): TechEvidence[]
export function techsFromRequirements(map: TechMap, text: string, path: string): TechEvidence[]
export function mergeTechs(list: TechEvidence[]): TechEvidence[]
export const SCREENSHOT_RE: RegExp
export const SCREENSHOT_DIR_RE: RegExp
