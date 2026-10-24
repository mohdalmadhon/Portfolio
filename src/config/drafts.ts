export const showDrafts: boolean = (() => {
  if (import.meta.env.DEV) return true
  try {
    return new URLSearchParams(window.location.search).has('drafts')
  } catch {
    return false
  }
})()

export function published<T extends { draft?: boolean }>(list: T[]): T[] {
  return list.filter((i) => showDrafts || !i.draft)
}
