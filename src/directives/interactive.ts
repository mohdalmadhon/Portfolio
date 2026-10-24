import type { App, Directive } from 'vue'

const reduced = () => document.documentElement.classList.contains('reduce-motion')

interface TiltEl extends HTMLElement {
  __tiltOff?: () => void
}

const tilt: Directive<TiltEl, { max?: number; lift?: number } | undefined> = {
  mounted(el, binding) {
    el.classList.add('tilt')
    const max = binding.value?.max ?? 6
    const lift = binding.value?.lift ?? 4
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${px * 100}%`)
        el.style.setProperty('--my', `${py * 100}%`)
        el.classList.add('is-hot')
        if (!reduced()) el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * max).toFixed(2)}deg) rotateY(${((px - 0.5) * max).toFixed(2)}deg) translateY(-${lift}px)`
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(frame)
      el.classList.remove('is-hot', 'is-pressed')
      el.style.transform = ''
    }
    const onDown = () => el.classList.add('is-pressed')
    const onUp = () => el.classList.remove('is-pressed')
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.__tiltOff = () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
    }
  },
  unmounted(el) {
    el.__tiltOff?.()
  },
}

let observer: IntersectionObserver | null = null
function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in')
          observer?.unobserve(e.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )
  return observer
}

const reveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const obs = getObserver()
    if (!obs || reduced()) return
    el.classList.add('rv')
    if (binding.value) el.style.transitionDelay = `${Math.min(binding.value, 8) * 60}ms`
    obs.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}

export function installInteractive(app: App) {
  app.directive('tilt', tilt)
  app.directive('reveal', reveal)
}
