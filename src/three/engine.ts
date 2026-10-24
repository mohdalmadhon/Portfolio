import * as THREE from 'three'
import { BlockTextures } from './blockTextures'
import { buildWorld, type Biome, type WorldBuild } from './world'

export type { Biome }
import { createPlayer, detectSlimSkin, type PlayerRig } from './playerModel'
import { createRevealUniforms, type RevealUniforms } from './reveal'

export type Quality = 'auto' | 'high' | 'low'
export type XrayMode = 'off' | 'auto'

export interface EngineCallbacks {
  onHover?: (label: string | null, x: number, y: number) => void
  onSelect?: (section: string) => void
  onCharacterHover?: (active: boolean) => void
  onReady?: () => void
  onError?: (err: unknown) => void
  onContextLost?: () => void
}

export interface EngineOptions extends EngineCallbacks {
  quality: Quality
  reducedMotion: boolean
  skinUrl: string
  skeletonUrl: string
  capeUrl: string | null
  biome: Biome
  lite?: boolean
}

interface View { pos: THREE.Vector3; target: THREE.Vector3 }

const SKY = {
  day: { sky: new THREE.Color('#8cc8ff'), fog: new THREE.Color('#b6dcff'), sun: 2.6, hemi: 1.15 },
  dusk: { sky: new THREE.Color('#f29a62'), fog: new THREE.Color('#e9a77c'), sun: 1.3, hemi: 0.75 },
  night: { sky: new THREE.Color('#0b1030'), fog: new THREE.Color('#141a3c'), sun: 0.35, hemi: 0.42 },
  deep: { sky: new THREE.Color('#03070b'), fog: new THREE.Color('#05121a'), sun: 1.05, hemi: 0.75 },
}

function loadTexture(url: string): Promise<{ tex: THREE.Texture; image: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      const tex = new THREE.Texture(img)
      tex.magFilter = THREE.NearestFilter
      tex.minFilter = THREE.NearestFilter
      tex.generateMipmaps = false
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
      resolve({ tex, image: img })
    }
    img.onerror = () => reject(new Error(`Failed to load texture ${url}`))
    img.src = url
  })
}

export function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

export class WorldEngine {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private textures: BlockTextures
  private world!: WorldBuild
  private rig!: PlayerRig
  private uniforms: RevealUniforms = createRevealUniforms()
  private sun = new THREE.DirectionalLight('#fff4dc', 2.4)
  private hemi = new THREE.HemisphereLight('#cfe8ff', '#5c4a32', 1)
  private stars!: THREE.Points
  private particles!: THREE.Points
  private particleSeeds: Float32Array = new Float32Array()
  private sunMesh!: THREE.Mesh
  private moonMesh!: THREE.Mesh
  private lastTime = 0
  private elapsed = 0
  private raf = 0
  private running = false
  private disposed = false
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2(9, 9)
  private pointerCss = new THREE.Vector2(-9999, -9999)
  private pointerInside = false
  private pointerDirty = false
  private pointerType = 'mouse'
  private touchUntil = 0
  private hoverCharacter = false
  private lensCenter = new THREE.Vector2(-9999, -9999)
  private lensRadius = 0
  private lensActive = false
  private xray: XrayMode = 'off'
  private section = 'hero'
  private timeOfDay = 0
  private viewTarget: View = { pos: new THREE.Vector3(), target: new THREE.Vector3() }
  private currentTarget = new THREE.Vector3()
  private quality: Quality
  private reducedMotion: boolean
  private pixelRatio = 1
  private maxPixelRatio = 1.5
  private fpsFrames = 0
  private fpsTime = 0
  private hovered: string | null = null
  private cb: EngineCallbacks
  private size = { w: 1, h: 1 }
  private shadowsEnabled: boolean
  private lite: boolean
  private headLook = new THREE.Vector2()
  private cleanup: (() => void)[] = []
  private extraDisposables: { dispose(): void }[] = []
  private biome: Biome
  private fillLight = new THREE.PointLight('#fff1e2', 0, 12, 1.4)

  constructor(private canvas: HTMLCanvasElement, private opts: EngineOptions) {
    this.quality = opts.quality
    this.reducedMotion = opts.reducedMotion
    this.biome = opts.biome
    this.cb = opts
    this.lite = !!opts.lite
    this.shadowsEnabled = opts.quality !== 'low' && !this.lite
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: opts.quality !== 'low' && !opts.lite,
      powerPreference: opts.lite ? 'low-power' : 'high-performance',
      alpha: false,
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = this.shadowsEnabled
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
    this.textures = new BlockTextures(Math.min(4, this.renderer.capabilities.getMaxAnisotropy()))
    this.applyQuality()
    const onLost = (e: Event) => {
      e.preventDefault()
      this.stop()
      this.cb.onContextLost?.()
    }
    canvas.addEventListener('webglcontextlost', onLost)
    this.cleanup.push(() => canvas.removeEventListener('webglcontextlost', onLost))
  }

  async init() {
    const [skin, skeleton, cape] = await Promise.all([
      loadTexture(this.opts.skinUrl),
      loadTexture(this.opts.skeletonUrl),
      this.opts.capeUrl ? loadTexture(this.opts.capeUrl) : Promise.resolve(null),
    ])
    if (this.disposed) return
    this.extraDisposables.push(skin.tex, skeleton.tex)
    if (cape) this.extraDisposables.push(cape.tex)
    this.buildScene(skin.tex, skeleton.tex, cape?.tex ?? null, detectSlimSkin(skin.image))
    this.bindEvents()
    this.resize()
    this.computeView(true)
    this.camera.position.copy(this.viewTarget.pos)
    this.currentTarget.copy(this.viewTarget.target)
    this.camera.lookAt(this.currentTarget)
    this.start()
    this.cb.onReady?.()
  }

  private buildScene(skin: THREE.Texture, skeleton: THREE.Texture, cape: THREE.Texture | null, slim: boolean) {
    this.scene.background = SKY.day.sky.clone()
    this.scene.fog = new THREE.Fog(SKY.day.fog.clone(), 34, 120)
    this.scene.add(this.hemi)
    this.sun.position.set(18, 30, 14)
    this.sun.castShadow = this.shadowsEnabled
    this.sun.shadow.mapSize.set(this.quality === 'high' ? 2048 : 1024, this.quality === 'high' ? 2048 : 1024)
    const sc = this.sun.shadow.camera
    sc.left = -28; sc.right = 28; sc.top = 28; sc.bottom = -28; sc.near = 1; sc.far = 90
    this.sun.shadow.bias = -0.0006
    this.sun.shadow.normalBias = 0.02
    this.scene.add(this.sun, this.sun.target)

    this.world = buildWorld(this.textures, this.shadowsEnabled, this.biome, this.lite)
    if (this.lite) {
      this.world.beaconLight.visible = false
      this.world.torchLight.visible = false
    }
    this.scene.add(this.world.group)
    if (this.biome === 'ancient') {
      this.hemi.color.set('#5a6e7a')
      this.hemi.groundColor.set('#0a0c0e')
      ;(this.scene.fog as THREE.Fog).near = 10
      ;(this.scene.fog as THREE.Fog).far = 58
      this.fillLight.position.set(1.6, 3.2, 3.4)
      this.fillLight.intensity = 8
      this.scene.add(this.fillLight)
    }

    this.rig = createPlayer(skin, skeleton, cape, this.uniforms, slim)
    this.rig.root.position.set(0, 0, 0)
    this.rig.root.rotation.y = 0.25
    this.scene.add(this.rig.root)

    const starCount = 700
    const sp = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const u = Math.random() * 2 - 1
      const t = Math.random() * Math.PI * 2
      const r = 180
      const s = Math.sqrt(1 - u * u)
      sp.set([r * s * Math.cos(t), Math.abs(r * u) * 0.9 + 10, r * s * Math.sin(t)], i * 3)
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    const sm = new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })
    this.stars = new THREE.Points(sg, sm)
    this.scene.add(this.stars)
    this.extraDisposables.push(sg, sm)

    const disc = new THREE.PlaneGeometry(10, 10)
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fff3b0', fog: false })
    const moonMat = new THREE.MeshBasicMaterial({ color: '#e8ecff', fog: false, transparent: true })
    this.sunMesh = new THREE.Mesh(disc, sunMat)
    this.moonMesh = new THREE.Mesh(disc, moonMat)
    this.scene.add(this.sunMesh, this.moonMesh)
    this.extraDisposables.push(disc, sunMat, moonMat)

    const count = this.lite ? 36 : this.quality === 'low' ? 60 : 160
    const pp = new Float32Array(count * 3)
    this.particleSeeds = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40
      const z = (Math.random() - 0.5) * 34
      const y = 0.5 + Math.random() * 5
      pp.set([x, y, z], i * 3)
      this.particleSeeds.set([x, y, z, Math.random() * Math.PI * 2], i * 4)
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3))
    const pm = new THREE.PointsMaterial({ color: '#fff7c2', size: 0.09, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })
    this.particles = new THREE.Points(pg, pm)
    this.scene.add(this.particles)
    this.extraDisposables.push(pg, pm)

    this.applyTimeOfDay(0)
  }

  private bindEvents() {
    const onMove = (e: PointerEvent) => {
      this.pointerType = e.pointerType
      const onCanvas = e.target === this.canvas
      this.pointerInside = onCanvas
      this.pointerCss.set(e.clientX, e.clientY)
      this.pointer.set((e.clientX / this.size.w) * 2 - 1, -(e.clientY / this.size.h) * 2 + 1)
      this.pointerDirty = true
      if (!onCanvas && this.hovered) {
        this.hovered = null
        this.cb.onHover?.(null, 0, 0)
      }
    }
    const onLeave = () => {
      this.pointerInside = false
      this.pointerDirty = true
    }
    const onDown = (e: PointerEvent) => {
      if (e.target !== this.canvas) return
      onMove(e)
      if (e.pointerType !== 'mouse') {
        this.updateHover()
        if (this.hoverCharacter) this.touchUntil = performance.now() + 2600
      }
    }
    const onClick = (e: MouseEvent) => {
      if (e.target !== this.canvas) return
      this.updateHover()
      if (this.hovered && !this.hoverCharacter) {
        const hit = this.world.interactives.find((i) => i.label === this.hovered)
        if (hit) this.cb.onSelect?.(hit.section)
      }
    }
    const onResize = () => this.resize()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
    this.cleanup.push(() => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    })
  }

  private resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.size = { w, h }
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.computeView(false)
  }

  private applyQuality() {
    const dpr = window.devicePixelRatio || 1
    if (this.lite) this.maxPixelRatio = this.quality === 'high' ? Math.min(dpr, 1.5) : this.quality === 'low' ? 0.75 : Math.min(dpr, 1.25)
    else if (this.quality === 'high') this.maxPixelRatio = Math.min(dpr, 2)
    else if (this.quality === 'low') this.maxPixelRatio = Math.min(dpr, 1) * 0.8
    else this.maxPixelRatio = Math.min(dpr, 1.5)
    this.pixelRatio = this.maxPixelRatio
    this.renderer.setPixelRatio(this.pixelRatio)
  }

  setQuality(q: Quality) {
    this.quality = q
    this.applyQuality()
    this.resize()
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v
  }

  setXray(mode: XrayMode) {
    this.xray = mode
  }

  setSection(id: string) {
    if (id === this.section) return
    this.section = id
    this.computeView(false)
  }

  setTimeOfDay(t: number) {
    this.timeOfDay = THREE.MathUtils.clamp(t, 0, 1) * (this.biome === 'overworld' ? 0.62 : 1)
  }

  private computeView(_snap: boolean) {
    const aspect = this.size.w / Math.max(1, this.size.h)
    const portrait = aspect < 0.9
    const pull = portrait ? 1.55 : aspect < 1.3 ? 1.2 : 1
    const a = this.world?.anchors
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
    let pos: THREE.Vector3
    let target: THREE.Vector3
    switch (this.section) {
      case 'hero': {
        if (portrait) {
          pos = v(0.7, 2.1, 9.2)
          target = v(0.1, -0.25, 0)
        } else {
          const shift = aspect > 1.3 ? -1.25 : -0.7
          pos = v(0.2 + shift * 0.4, 1.55, 5.6)
          target = v(shift, 1.05, 0)
        }
        break
      }
      case 'about': pos = v(-1, 6.5, 8); target = a ? a.about.clone() : v(-8, 2, -6); break
      case 'skills': pos = v(16, 5.5, 6); target = a ? a.skills.clone() : v(9, 1, -2); break
      case 'projects': pos = v(10.5, 3.6, 12.5); target = a ? a.projects.clone() : v(7, 0.5, 6); break
      case 'activity': pos = v(22, 9, -2); target = a ? a.activity.clone().add(v(0, 3, 0)) : v(13, 4, -10); break
      case 'blog': case 'learning': pos = v(-9, 4.5, 11); target = a ? a.blog.clone() : v(-15, 1, 5); break
      case 'contact':
        if (this.biome === 'ancient') { pos = v(3, 6.5, 6); target = a ? a.contact.clone() : v(-0.5, 5.5, -15) }
        else { pos = v(1.5, 3.2, -7); target = a ? a.contact.clone() : v(-1, 2.4, -14) }
        break
      case 'footer': pos = v(0, 30, 48); target = v(0, -2, 0); break
      default: pos = v(-26, 18, 26); target = v(0, 0, -2)
    }
    if (this.section !== 'hero') pos = target.clone().add(pos.clone().sub(target).multiplyScalar(pull))
    this.viewTarget = { pos, target }
  }

  private applyTimeOfDay(t: number) {
    if (this.biome === 'ancient') {
      ;(this.scene.background as THREE.Color).copy(SKY.deep.sky)
      ;(this.scene.fog as THREE.Fog).color.copy(SKY.deep.fog)
      this.sun.intensity = SKY.deep.sun
      this.sun.color.set('#d9ecff')
      this.sun.position.set(10, 26, 22)
      this.hemi.intensity = SKY.deep.hemi
      this.sunMesh.visible = false
      this.moonMesh.visible = false
      ;(this.stars.material as THREE.PointsMaterial).opacity = 0
      const pm = this.particles.material as THREE.PointsMaterial
      pm.color.set('#5ff2ff')
      pm.size = 0.11
      pm.opacity = 0.85
      this.world.torchLight.intensity = 5
      this.world.beaconLight.intensity = 6
      this.world.portalLight.intensity = 10
      ;(this.world.beam.material as THREE.MeshBasicMaterial).opacity = 0.28
      return
    }
    const mix = (k: 'sky' | 'fog') => {
      if (t < 0.5) return SKY.day[k].clone().lerp(SKY.dusk[k], t / 0.5)
      return SKY.dusk[k].clone().lerp(SKY.night[k], (t - 0.5) / 0.5)
    }
    const num = (k: 'sun' | 'hemi') => (t < 0.5
      ? THREE.MathUtils.lerp(SKY.day[k], SKY.dusk[k], t / 0.5)
      : THREE.MathUtils.lerp(SKY.dusk[k], SKY.night[k], (t - 0.5) / 0.5))
    ;(this.scene.background as THREE.Color).copy(mix('sky'))
    ;(this.scene.fog as THREE.Fog).color.copy(mix('fog'))
    this.sun.intensity = num('sun')
    this.hemi.intensity = num('hemi')
    const night = THREE.MathUtils.smoothstep(t, 0.45, 0.9)
    this.sun.color.set('#fff4dc').lerp(new THREE.Color('#9fb4ff'), night)
    const angle = THREE.MathUtils.lerp(0.95, -0.25, t)
    this.sun.position.set(Math.cos(angle) * 30, Math.sin(angle) * 34 + 8, 14)
    this.sunMesh.position.set(Math.cos(angle) * 160, Math.sin(angle) * 120, -120)
    this.sunMesh.lookAt(0, 0, 0)
    this.moonMesh.position.set(-Math.cos(angle) * 160, 40 + night * 70, -140)
    this.moonMesh.lookAt(0, 0, 0)
    ;(this.moonMesh.material as THREE.MeshBasicMaterial).opacity = night
    ;(this.stars.material as THREE.PointsMaterial).opacity = night * 0.95
    const pm = this.particles.material as THREE.PointsMaterial
    pm.color.set('#fff7c2').lerp(new THREE.Color('#c8ff6b'), night)
    pm.size = THREE.MathUtils.lerp(0.07, 0.14, night)
    pm.opacity = THREE.MathUtils.lerp(0.55, 1, night)
    this.world.torchLight.intensity = night * 7
    this.world.beaconLight.intensity = 2 + night * 6
    this.world.portalLight.intensity = 4 + night * 6
    ;(this.world.beam.material as THREE.MeshBasicMaterial).opacity = 0.18 + night * 0.4
  }

  private updateHover() {
    if (!this.rig) return
    if (!this.pointerInside) {
      this.hoverCharacter = false
      if (this.hovered) {
        this.hovered = null
        this.canvas.style.cursor = ''
        this.cb.onHover?.(null, 0, 0)
      }
      return
    }
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.section === 'hero' ? this.raycaster.intersectObjects(this.rig.hitMeshes, false) : []
    this.hoverCharacter = hits.length > 0
    let label: string | null = null
    if (!this.hoverCharacter) {
      const objs = this.world.interactives.map((i) => i.object)
      const ih = this.raycaster.intersectObjects(objs, false)
      if (ih.length) label = this.world.interactives.find((i) => i.object === ih[0].object)?.label ?? null
    }
    if (label !== this.hovered) {
      this.hovered = label
      this.canvas.style.cursor = label ? 'pointer' : ''
    }
    if (label) this.cb.onHover?.(label, this.pointerCss.x, this.pointerCss.y)
    else this.cb.onHover?.(null, 0, 0)
  }

  private projectedCharacter() {
    const top = new THREE.Vector3(0, 2.05, 0).applyMatrix4(this.rig.root.matrixWorld).project(this.camera)
    const bottom = new THREE.Vector3(0, 0, 0).applyMatrix4(this.rig.root.matrixWorld).project(this.camera)
    const mid = new THREE.Vector3(0, 1.1, 0).applyMatrix4(this.rig.root.matrixWorld).project(this.camera)
    const h = Math.abs(top.y - bottom.y) * 0.5 * this.size.h
    const cx = (mid.x * 0.5 + 0.5) * this.size.w
    const cy = (1 - (mid.y * 0.5 + 0.5)) * this.size.h
    return { h, cx, cy, visible: mid.z < 1 }
  }

  private updateReveal(dt: number, time: number) {
    const proj = this.projectedCharacter()
    const R = THREE.MathUtils.clamp(proj.h * 0.16, 34, 130)
    let targetCenter: THREE.Vector2 | null = null
    let want = 0
    const touching = performance.now() < this.touchUntil
    if (this.section === 'hero' && proj.visible) {
      if (this.xray === 'auto') {
        const s = this.reducedMotion ? 0.25 : 0.7
        targetCenter = new THREE.Vector2(
          proj.cx + Math.sin(time * s * 1.3) * proj.h * 0.16,
          proj.cy + Math.sin(time * s) * proj.h * 0.36,
        )
        want = R
      } else if (this.hoverCharacter && (this.pointerType === 'mouse' || this.pointerType === 'pen' || touching)) {
        targetCenter = this.pointerCss.clone()
        want = R
      } else if (touching) {
        targetCenter = this.pointerCss.clone()
        want = R
      }
    }
    if (targetCenter) {
      if (this.lensRadius < 1) this.lensCenter.copy(targetCenter)
      else this.lensCenter.lerp(targetCenter, 1 - Math.exp(-dt * 22))
    }
    this.lensRadius = THREE.MathUtils.lerp(this.lensRadius, want, 1 - Math.exp(-dt * (want > 0 ? 12 : 9)))
    if (this.lensRadius < 0.75 && want === 0) this.lensRadius = 0
    const scaleX = this.renderer.domElement.width / this.size.w
    const scaleY = this.renderer.domElement.height / this.size.h
    this.uniforms.uRevealCenter.value.set(this.lensCenter.x * scaleX, (this.size.h - this.lensCenter.y) * scaleY)
    this.uniforms.uRevealRadius.value = this.lensRadius * scaleX
    this.uniforms.uRevealSoft.value = Math.max(4, 9 * scaleX)
    this.uniforms.uRevealPixel.value = Math.max(2, Math.round(2.5 * scaleX))
    const active = this.lensRadius > 1
    if (active !== this.lensActive) {
      this.lensActive = active
      this.cb.onCharacterHover?.(active)
    }
  }

  private animateRig(time: number, dt: number) {
    const r = this.rig
    const m = this.reducedMotion ? 0.15 : 1
    const breathe = Math.sin(time * 1.6) * m
    r.body.scale.set(1, 1 + breathe * 0.008, 1 + breathe * 0.012)
    r.rightArm.rotation.z = -0.045 - (Math.sin(time * 1.6) * 0.035 + 0.01) * m
    r.leftArm.rotation.z = 0.045 + (Math.sin(time * 1.6) * 0.035 + 0.01) * m
    r.rightArm.rotation.x = Math.sin(time * 0.8) * 0.05 * m
    r.leftArm.rotation.x = -Math.sin(time * 0.8) * 0.05 * m
    r.cape.rotation.x = 0.12 + (Math.sin(time * 1.3) * 0.05 + Math.sin(time * 3.1) * 0.015) * m
    let yaw = Math.sin(time * 0.35) * 0.25 * m
    let pitch = Math.sin(time * 0.5) * 0.05 * m
    if (this.section === 'hero' && this.pointerInside) {
      const proj = this.projectedCharacter()
      const dx = (this.pointerCss.x - proj.cx) / Math.max(200, this.size.w * 0.5)
      const dy = (this.pointerCss.y - (proj.cy - proj.h * 0.35)) / Math.max(200, this.size.h * 0.5)
      yaw = THREE.MathUtils.clamp(dx * 0.9, -0.6, 0.6)
      pitch = THREE.MathUtils.clamp(dy * 0.6, -0.35, 0.4)
    }
    this.headLook.x = THREE.MathUtils.lerp(this.headLook.x, yaw, 1 - Math.exp(-dt * 5))
    this.headLook.y = THREE.MathUtils.lerp(this.headLook.y, pitch, 1 - Math.exp(-dt * 5))
    r.head.rotation.y = this.headLook.x
    r.head.rotation.x = this.headLook.y
  }

  private animateWorld(time: number, dt: number) {
    const w = this.world
    const m4 = new THREE.Matrix4()
    const speed = this.reducedMotion ? 0 : 0.8
    w.cloudData.forEach((c, i) => {
      c.x += dt * speed
      if (c.x > 100) c.x = -100
      m4.compose(new THREE.Vector3(c.x, c.y, c.z), new THREE.Quaternion(), new THREE.Vector3(c.sx, 1, c.sz))
      w.clouds.setMatrixAt(i, m4)
    })
    w.clouds.instanceMatrix.needsUpdate = true
    if (!this.reducedMotion) this.textures.tick(dt)
    const flicker = this.reducedMotion ? 0 : Math.sin(time * 9) * 0.4 + Math.sin(time * 23) * 0.2
    w.torchLight.intensity = Math.max(0, w.torchLight.intensity + flicker * (w.torchLight.intensity > 0 ? 0.3 : 0))
    const pos = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute
    if (!this.reducedMotion) {
      const s = this.particleSeeds
      for (let i = 0; i < pos.count; i++) {
        const ph = s[i * 4 + 3]
        pos.setXYZ(
          i,
          s[i * 4] + Math.sin(time * 0.3 + ph) * 1.2,
          s[i * 4 + 1] + Math.sin(time * 0.5 + ph * 2) * 0.6,
          s[i * 4 + 2] + Math.cos(time * 0.27 + ph) * 1.2,
        )
      }
      pos.needsUpdate = true
    }
  }

  private updateCamera(time: number, dt: number) {
    const snap = this.reducedMotion
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.2)
    const desired = this.viewTarget.pos.clone()
    if (!this.reducedMotion) {
      if (this.section === 'hero') {
        desired.x += Math.sin(time * 0.22) * 0.35
        desired.y += Math.sin(time * 0.31) * 0.08
        if (this.pointerInside && this.pointerType === 'mouse') {
          desired.x += this.pointer.x * 0.25
          desired.y += this.pointer.y * 0.12
        }
      } else {
        const off = desired.clone().sub(this.viewTarget.target)
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(time * 0.08) * 0.12)
        desired.copy(this.viewTarget.target).add(off)
      }
    }
    this.camera.position.lerp(desired, k)
    this.currentTarget.lerp(this.viewTarget.target, k)
    this.camera.lookAt(this.currentTarget)
  }

  private adaptQuality(dt: number) {
    if (this.quality !== 'auto') return
    this.fpsFrames++
    this.fpsTime += dt
    if (this.fpsTime < 2) return
    const fps = this.fpsFrames / this.fpsTime
    this.fpsFrames = 0
    this.fpsTime = 0
    let next = this.pixelRatio
    const target = this.lite ? 30 : 60
    if (fps < target * 0.7) next = Math.max(this.lite ? 0.55 : 0.6, this.pixelRatio - 0.2)
    else if (fps > target * 0.95) next = Math.min(this.maxPixelRatio, this.pixelRatio + 0.1)
    if (Math.abs(next - this.pixelRatio) > 0.01) {
      this.pixelRatio = next
      this.renderer.setPixelRatio(next)
      this.renderer.setSize(this.size.w, this.size.h, false)
    }
  }

  private frame = () => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.frame)
    const nowMs = performance.now()
    if (this.lite) {
      const interval = this.section === 'hero' || this.lensRadius > 0 ? 1000 / 30 : 1000 / 15
      if (nowMs - this.lastTime < interval - 2) return
    }
    const dt = Math.min(this.lite ? 0.1 : 0.05, Math.max(0, (nowMs - this.lastTime) / 1000))
    this.lastTime = nowMs
    this.elapsed += dt
    const time = this.elapsed
    this.uniforms.uTime.value = time
    if (this.pointerDirty) {
      this.updateHover()
      this.pointerDirty = false
    }
    this.applyTimeOfDay(this.timeOfDay)
    this.animateRig(time, dt)
    this.animateWorld(time, dt)
    this.updateCamera(time, dt)
    this.rig.root.updateMatrixWorld()
    this.updateReveal(dt, time)
    this.renderer.render(this.scene, this.camera)
    this.adaptQuality(dt)
  }

  start() {
    if (this.running || this.disposed) return
    this.running = true
    this.lastTime = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  renderOnce() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.stop()
    this.cleanup.forEach((f) => f())
    this.world?.disposables.forEach((d) => d.dispose())
    this.rig?.geometries.forEach((g) => g.dispose())
    this.rig?.materials.forEach((m) => m.dispose())
    this.extraDisposables.forEach((d) => d.dispose())
    this.textures.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
