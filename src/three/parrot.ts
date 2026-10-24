import * as THREE from 'three'
import type { BlockTextures } from './blockTextures'

const PX = 1 / 16

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function featherTexture(bands: string[][], seed: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 8
  const ctx = c.getContext('2d')!
  const r = rng(seed)
  for (let y = 0; y < 8; y++) {
    const band = bands[Math.min(bands.length - 1, Math.floor((y / 8) * bands.length))]
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = band[Math.floor(r() * band.length)]
      ctx.fillRect(x, y, 1, 1)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const RED = ['#d6312a', '#c42a24', '#e0413a']
const YELLOW = ['#f2c534', '#e6b42a']
const BLUE = ['#2f6fd6', '#2a5fc0', '#3d7fe6']

export interface Parrot {
  group: THREE.Group
  hitMeshes: THREE.Mesh[]
  update(time: number, dt: number, look: THREE.Vector2 | null, reduced: boolean): void
  flap(): void
  dispose(): void
}

export function createParrot(textures: BlockTextures, ancient: boolean, shadows: boolean): Parrot {
  const disposables: { dispose(): void }[] = []
  const group = new THREE.Group()
  const hitMeshes: THREE.Mesh[] = []

  const mat = (tex: THREE.Texture) => {
    const m = new THREE.MeshLambertMaterial({ map: tex })
    disposables.push(m, tex)
    return m
  }
  const solid = (color: string) => {
    const m = new THREE.MeshLambertMaterial({ color })
    disposables.push(m)
    return m
  }
  const box = (w: number, h: number, d: number, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const g = new THREE.BoxGeometry(w * PX, h * PX, d * PX)
    disposables.push(g)
    const m = new THREE.Mesh(g, material)
    m.position.set(x * PX, y * PX, z * PX)
    m.castShadow = shadows
    parent.add(m)
    hitMeshes.push(m)
    return m
  }

  const postTex = textures.get(ancient ? 'polishedDeepslate' : 'logSide')
  const postMat = new THREE.MeshLambertMaterial({ map: postTex })
  disposables.push(postMat)
  const postGeo = new THREE.BoxGeometry(4 * PX, 14 * PX, 4 * PX)
  disposables.push(postGeo)
  const post = new THREE.Mesh(postGeo, postMat)
  post.position.y = 7 * PX
  post.castShadow = shadows
  post.receiveShadow = shadows
  group.add(post)
  const capGeo = new THREE.BoxGeometry(6 * PX, 1 * PX, 6 * PX)
  disposables.push(capGeo)
  const cap = new THREE.Mesh(capGeo, postMat)
  cap.position.y = 14.5 * PX
  cap.castShadow = shadows
  group.add(cap)

  const bird = new THREE.Group()
  bird.position.y = 15 * PX
  group.add(bird)

  const bodyMat = mat(featherTexture([RED], 3))
  const wingMat = mat(featherTexture([RED, YELLOW, BLUE, BLUE], 5))
  const tailMat = mat(featherTexture([RED, RED, BLUE], 7))
  const headMat = mat(featherTexture([RED], 9))
  const beakTop = solid('#e8e2d0')
  const beakLow = solid('#2b2b2b')
  const faceWhite = solid('#f4f1ea')
  const eyeBlack = solid('#141414')
  const legMat = solid('#6f6f6f')

  box(1, 2, 1, legMat, bird, -1, 1, 0)
  box(1, 2, 1, legMat, bird, 1, 1, 0)

  const body = new THREE.Group()
  body.position.y = 2 * PX
  bird.add(body)
  const torso = box(4, 6, 4, bodyMat, body, 0, 3, 0)
  torso.rotation.x = -0.18

  const tail = new THREE.Group()
  tail.position.set(0, 1 * PX, -2 * PX)
  body.add(tail)
  const tailMesh = box(3, 5, 1, tailMat, tail, 0, -2.2, -0.4)
  tailMesh.rotation.x = 0.45

  const leftWing = new THREE.Group()
  leftWing.position.set(2.4 * PX, 5.5 * PX, 0)
  body.add(leftWing)
  box(1, 5, 3, wingMat, leftWing, 0, -2.3, -0.3)
  const rightWing = new THREE.Group()
  rightWing.position.set(-2.4 * PX, 5.5 * PX, 0)
  body.add(rightWing)
  box(1, 5, 3, wingMat, rightWing, 0, -2.3, -0.3)

  const head = new THREE.Group()
  head.position.set(0, 6.5 * PX, 0.4 * PX)
  body.add(head)
  box(3, 4, 3, headMat, head, 0, 2, 0)
  box(1, 2, 1, beakTop, head, 0, 2.3, 2)
  box(1, 1, 1, beakLow, head, 0, 1, 1.9)
  for (const side of [-1, 1]) {
    box(0.4, 2, 2, faceWhite, head, side * 1.6, 2.4, 0.4)
    box(0.5, 1, 1, eyeBlack, head, side * 1.7, 2.6, 0.7)
  }
  box(1, 1, 2, headMat, head, 0, 4.4, -0.3)

  let flapUntil = 0
  let nextFlap = 4
  const headLook = new THREE.Vector2()

  return {
    group,
    hitMeshes,
    flap() {
      flapUntil = performance.now() / 1000 + 1.1
    },
    update(time, dt, look, reduced) {
      const m = reduced ? 0.2 : 1
      const now = performance.now() / 1000
      if (!reduced && time > nextFlap) {
        flapUntil = now + 0.7
        nextFlap = time + 5 + Math.random() * 6
      }
      const flapping = now < flapUntil
      const flapAngle = flapping ? Math.abs(Math.sin(now * 26)) * 1.1 : 0.04 + Math.sin(time * 2) * 0.03 * m
      leftWing.rotation.z = flapAngle
      rightWing.rotation.z = -flapAngle
      bird.position.y = 15 * PX + (flapping ? Math.abs(Math.sin(now * 13)) * 2.5 * PX : Math.abs(Math.sin(time * 2.4)) * 0.4 * PX * m)
      tail.rotation.x = Math.sin(time * 1.7) * 0.08 * m
      body.rotation.z = Math.sin(time * 1.2) * 0.04 * m
      const targetYaw = look ? THREE.MathUtils.clamp(look.x * 0.8, -0.8, 0.8) : Math.sin(time * 0.6) * 0.5 * m
      const targetTilt = look ? THREE.MathUtils.clamp(-look.y * 0.4, -0.35, 0.35) : Math.sin(time * 0.9) * 0.25 * m
      headLook.x = THREE.MathUtils.lerp(headLook.x, targetYaw, 1 - Math.exp(-dt * 6))
      headLook.y = THREE.MathUtils.lerp(headLook.y, targetTilt, 1 - Math.exp(-dt * 6))
      head.rotation.y = headLook.x
      head.rotation.z = headLook.y
    },
    dispose() {
      disposables.forEach((d) => d.dispose())
    },
  }
}
