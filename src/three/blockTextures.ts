import * as THREE from 'three'
import { rng, seedOf, painters, type BlockTextureName } from '../art/blockPainters'

export type { BlockTextureName }


export class BlockTextures {
  private cache = new Map<string, THREE.CanvasTexture>()
  portal: THREE.CanvasTexture
  private portalCtx: CanvasRenderingContext2D
  private portalPhase = 0

  constructor(private anisotropy = 1) {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 64
    this.portalCtx = canvas.getContext('2d')!
    this.portal = new THREE.CanvasTexture(canvas)
    this.configure(this.portal)
    this.portal.wrapT = THREE.RepeatWrapping
    this.paintPortal()
  }

  private configure(tex: THREE.Texture) {
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestMipmapLinearFilter
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = this.anisotropy
    tex.generateMipmaps = true
  }

  get(name: BlockTextureName): THREE.CanvasTexture {
    const hit = this.cache.get(name)
    if (hit) return hit
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')!
    painters[name](ctx, rng(seedOf(name)))
    const tex = new THREE.CanvasTexture(canvas)
    this.configure(tex)
    this.cache.set(name, tex)
    return tex
  }

  private paintPortal() {
    const c = this.portalCtx
    const r = rng(99)
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 16; x++) {
        const swirl = Math.sin((x + y * 0.6) * 0.7) + Math.cos((y - x * 0.5) * 0.45)
        const v = (swirl + 2) / 4 + r() * 0.15
        const shades = ['#3d0f73', '#5a1aa6', '#7a2bd6', '#a050f0', '#c58aff']
        c.fillStyle = shades[Math.min(shades.length - 1, Math.floor(v * shades.length))]
        c.fillRect(x, y, 1, 1)
      }
    }
    this.portal.repeat.set(1, 0.25)
    this.portal.needsUpdate = true
  }

  tick(dt: number) {
    this.portalPhase += dt * 0.12
    this.portal.offset.y = Math.floor(this.portalPhase * 64) / 64
  }

  dispose() {
    this.cache.forEach((t) => t.dispose())
    this.cache.clear()
    this.portal.dispose()
  }
}
