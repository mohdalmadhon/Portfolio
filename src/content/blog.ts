import { showDrafts } from '../config/drafts'

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  category: string
  tags: string[]
  sample: boolean
  body: string
  readingMinutes: number
}

const files = import.meta.glob('./posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parse(path: string, raw: string): Post | null {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return null
  const meta: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '')
  }
  const body = m[2].trim()
  const words = body.split(/\s+/).filter(Boolean).length
  const slug = path.split('/').pop()!.replace(/\.md$/, '')
  if (!meta.title || !meta.date) return null
  return {
    slug,
    title: meta.title,
    date: meta.date,
    excerpt: meta.excerpt ?? '',
    category: meta.category ?? 'Notes',
    tags: (meta.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    sample: meta.sample === 'true',
    body,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  }
}

export const posts: Post[] = Object.entries(files)
  .map(([p, raw]) => parse(p, raw.replace(/\r\n/g, '\n')))
  .filter((p): p is Post => !!p && (showDrafts || !p.sample))
  .sort((a, b) => b.date.localeCompare(a.date))
