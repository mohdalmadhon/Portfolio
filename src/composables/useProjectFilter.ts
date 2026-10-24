import { reactive } from 'vue'

export type SortKey = 'pushed' | 'stars' | 'forks' | 'created' | 'name'

const filter = reactive({
  query: '',
  language: '' as string,
  tech: '' as string,
  sort: 'pushed' as SortKey,
  showForks: false,
  showArchived: true,
})

export function useProjectFilter() {
  const reset = () => {
    filter.query = ''
    filter.language = ''
    filter.tech = ''
  }
  return { filter, reset }
}
