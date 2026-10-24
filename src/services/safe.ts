export function safeUrl(input: unknown, allowMailto = false): string | null {
  if (typeof input !== 'string' || !input.trim()) return null
  let s = input.trim()
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) s = `https://${s}`
  try {
    const u = new URL(s)
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString()
    if (allowMailto && u.protocol === 'mailto:') return u.toString()
    return null
  } catch {
    return null
  }
}

export function str(v: unknown, max = 2000): string | null {
  return typeof v === 'string' ? v.slice(0, max) : null
}

export function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export function isoOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return Number.isFinite(Date.parse(v)) ? v : null
}
