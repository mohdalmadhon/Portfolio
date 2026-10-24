import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSettings } from './useSettings'

export function useNavigation() {
  const router = useRouter()
  const { reducedMotion } = useSettings()

  async function go(id: string) {
    if (router.currentRoute.value.path !== '/') {
      await router.push('/')
      await nextTick()
    }
    const el = document.getElementById(id)
    if (!el) return
    const top = id === 'hero' ? 0 : el.getBoundingClientRect().top + window.scrollY - 56
    window.scrollTo({ top, behavior: reducedMotion.value ? 'auto' : 'smooth' })
    const heading = el.querySelector<HTMLElement>('h1, h2')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }

  return { go }
}
