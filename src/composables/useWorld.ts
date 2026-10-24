import { reactive } from 'vue'

export type WorldStatus = 'off' | 'loading' | 'ready' | 'unsupported' | 'error'

const world = reactive({
  status: 'loading' as WorldStatus,
  section: 'hero',
  timeOfDay: 0,
  xray: false,
  lensActive: false,
})

export function useWorld() {
  return world
}
