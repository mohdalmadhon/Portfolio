const RANK = { manifest: 3, file: 2, topic: 1 }

function entry(name, category, source, evidence) {
  return { name, category, source, evidence }
}

export function techsFromTopics(map, topics) {
  const out = []
  for (const t of topics || []) {
    const hit = map.topics[String(t).toLowerCase()]
    if (hit) out.push(entry(hit[0], hit[1], 'topic', `Repository topic "${t}"`))
  }
  return out
}

export function techsFromPaths(map, paths) {
  const out = []
  for (const [pattern, name, category] of map.files) {
    const re = new RegExp(pattern, 'i')
    const match = paths.find((p) => re.test(p))
    if (match) out.push(entry(name, category, 'file', match))
  }
  return out
}

export function techsFromPackageJson(map, text, path) {
  const out = []
  let pkg
  try {
    pkg = JSON.parse(text)
  } catch {
    return out
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) }
  for (const dep of Object.keys(deps)) {
    const hit = map.npm[dep]
    if (hit) out.push(entry(hit[0], hit[1], 'manifest', `${path} → ${dep}`))
  }
  out.push(entry('Node.js / npm', 'tooling', 'manifest', path))
  return out
}

export function techsFromGoMod(map, text, path) {
  const out = []
  const lines = text.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.replace(/^require\s+/, '').trim()
    for (const [mod, [name, category]] of Object.entries(map.go)) {
      if (line.startsWith(mod)) out.push(entry(name, category, 'manifest', `${path} → ${mod}`))
    }
  }
  if (/net\/http/.test(text)) out.push(entry('net/http', 'backend', 'manifest', path))
  return out
}

export function techsFromRequirements(map, text, path) {
  const out = []
  for (const raw of text.split(/\r?\n/)) {
    const name = raw.split(/[<>=~!\[; ]/)[0].trim().toLowerCase()
    const hit = map.pip[name]
    if (hit) out.push(entry(hit[0], hit[1], 'manifest', `${path} → ${name}`))
  }
  return out
}

export function mergeTechs(list) {
  const byName = new Map()
  for (const t of list) {
    const prev = byName.get(t.name)
    if (!prev || RANK[t.source] > RANK[prev.source]) byName.set(t.name, t)
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export const SCREENSHOT_RE = /(^|\/)(screenshots?|preview|demo|banner|cover|hero|showcase)[^/]*\.(png|jpe?g|gif|webp)$/i
export const SCREENSHOT_DIR_RE = /(^|\/)(screenshots?|docs?\/images?|assets\/screenshots?)\/[^/]+\.(png|jpe?g|gif|webp)$/i
