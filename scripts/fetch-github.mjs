import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectGithubData } from '../shared/collect.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = resolve(root, 'public/data/github.json')
const techMap = JSON.parse(readFileSync(resolve(root, 'shared/tech-map.json'), 'utf8'))

function configuredUsername() {
  if (process.env.GH_USERNAME) return process.env.GH_USERNAME.trim()
  if (process.env.VITE_GITHUB_USERNAME) return process.env.VITE_GITHUB_USERNAME.trim()
  for (const f of ['.env.local', '.env']) {
    const p = resolve(root, f)
    if (!existsSync(p)) continue
    const m = readFileSync(p, 'utf8').match(/^VITE_GITHUB_USERNAME=(.+)$/m)
    if (m && m[1].trim()) return m[1].trim()
  }
  const site = readFileSync(resolve(root, 'src/config/site.ts'), 'utf8')
  const m = site.match(/githubUsername:\s*(?:import\.meta\.env\.VITE_GITHUB_USERNAME\s*(?:\?\?|\|\|)\s*)?'([^']+)'/)
  if (m) return m[1]
  return process.env.GITHUB_REPOSITORY_OWNER || ''
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const login = configuredUsername()

if (!login) {
  console.warn('[github-data] No GitHub username configured. Set VITE_GITHUB_USERNAME or GH_USERNAME. Skipping snapshot.')
  process.exit(0)
}

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'minecraft-portfolio-snapshot',
}
if (token) headers.Authorization = `Bearer ${token}`

async function api(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://api.github.com${path}`, { headers })
    const remaining = res.headers.get('x-ratelimit-remaining')
    const reset = res.headers.get('x-ratelimit-reset')
    if ((res.status === 403 || res.status === 429) && remaining === '0' && reset) {
      const wait = Number(reset) * 1000 - Date.now() + 1000
      if (wait > 0 && wait < 90_000) {
        console.warn(`[github-data] rate limited, waiting ${Math.ceil(wait / 1000)}s`)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
    }
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
      continue
    }
    let data = null
    if (res.status !== 204) {
      try {
        data = await res.json()
      } catch {
        data = null
      }
    }
    return { status: res.status, data, remaining: remaining == null ? null : Number(remaining), reset: reset == null ? null : Number(reset) }
  }
  return { status: 503, data: null, remaining: null, reset: null }
}

async function raw(fullName, branch, path) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${fullName}/${encodeURIComponent(branch)}/${path.split('/').map(encodeURIComponent).join('/')}`)
    if (!res.ok) return null
    const text = await res.text()
    return text.length > 400_000 ? null : text
  } catch {
    return null
  }
}

async function graphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GraphQL ${res.status}`)
  return res.json()
}

try {
  const data = await collectGithubData({
    login,
    mode: 'snapshot',
    techMap,
    api,
    raw,
    graphql: token ? graphql : undefined,
    log: (m) => console.log(`[github-data] ${m}`),
  })
  if (!token) data.notes.push('This snapshot was generated without a token, so the contribution calendar was not available.')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, JSON.stringify(data))
  console.log(`[github-data] wrote ${outFile} (${data.repos.length} repositories)`)
} catch (err) {
  console.warn(`[github-data] snapshot failed: ${err?.message || err}. The site will fall back to live requests from the browser.`)
  process.exit(0)
}
