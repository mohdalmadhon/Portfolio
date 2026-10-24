import * as THREE from 'three'
import { applyReveal, type RevealUniforms } from './reveal'

const PX = 1 / 16

function boxGeometry(
  w: number, h: number, d: number,
  u: number, v: number,
  tw: number, th: number,
  uw = w, uh = h, ud = d,
): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(w * PX, h * PX, d * PX)
  const rects: [number, number, number, number][] = [
    [u + ud + uw, v + ud, ud, uh],
    [u, v + ud, ud, uh],
    [u + ud, v, uw, ud],
    [u + ud + uw, v, uw, ud],
    [u + ud, v + ud, uw, uh],
    [u + ud + uw + ud, v + ud, uw, uh],
  ]
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute
  rects.forEach(([x, y, rw, rh], face) => {
    const x0 = x / tw
    const x1 = (x + rw) / tw
    const y0 = 1 - y / th
    const y1 = 1 - (y + rh) / th
    const i = face * 4
    uv.setXY(i, x0, y0)
    uv.setXY(i + 1, x1, y0)
    uv.setXY(i + 2, x0, y1)
    uv.setXY(i + 3, x1, y1)
  })
  uv.needsUpdate = true
  return geo
}

export interface PlayerRig {
  root: THREE.Group
  head: THREE.Group
  body: THREE.Group
  rightArm: THREE.Group
  leftArm: THREE.Group
  rightLeg: THREE.Group
  leftLeg: THREE.Group
  cape: THREE.Group
  skinMeshes: THREE.Mesh[]
  hitMeshes: THREE.Mesh[]
  materials: THREE.Material[]
  geometries: THREE.BufferGeometry[]
  setSkin(tex: THREE.Texture, slim: boolean): void
}

interface PartSpec {
  w: number; h: number; d: number
  base: [number, number]
  overlay: [number, number] | null
  inflate: number
}

export function createPlayer(
  skin: THREE.Texture,
  skeleton: THREE.Texture,
  cape: THREE.Texture | null,
  uniforms: RevealUniforms,
  slim = false,
): PlayerRig {
  const geometries: THREE.BufferGeometry[] = []
  const skinBase = applyReveal(new THREE.MeshLambertMaterial({ map: skin }), 'skin', uniforms)
  const skinOverlay = applyReveal(
    new THREE.MeshLambertMaterial({ map: skin, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide }),
    'skin', uniforms,
  )
  const boneMat = applyReveal(
    new THREE.MeshLambertMaterial({ map: skeleton, alphaTest: 0.5, side: THREE.DoubleSide }),
    'skeleton', uniforms,
  )
  const materials: THREE.Material[] = [skinBase, skinOverlay, boneMat]
  const skinMeshes: THREE.Mesh[] = []
  const hitMeshes: THREE.Mesh[] = []

  const root = new THREE.Group()
  root.name = 'player'

  const makePart = (group: THREE.Group, spec: PartSpec, offset: THREE.Vector3) => {
    const baseGeo = boxGeometry(spec.w, spec.h, spec.d, spec.base[0], spec.base[1], 64, 64)
    geometries.push(baseGeo)
    const base = new THREE.Mesh(baseGeo, skinBase)
    base.position.copy(offset)
    base.castShadow = true
    group.add(base)
    skinMeshes.push(base)
    hitMeshes.push(base)
    if (spec.overlay) {
      const i = spec.inflate * 2
      const ovGeo = boxGeometry(spec.w + i, spec.h + i, spec.d + i, spec.overlay[0], spec.overlay[1], 64, 64, spec.w, spec.h, spec.d)
      geometries.push(ovGeo)
      const ov = new THREE.Mesh(ovGeo, skinOverlay)
      ov.position.copy(offset)
      ov.castShadow = true
      group.add(ov)
      skinMeshes.push(ov)
    }
    return base
  }

  const makeBone = (group: THREE.Group, w: number, h: number, d: number, u: number, v: number, scale: number, offset: THREE.Vector3) => {
    const geo = boxGeometry(w * scale, h * scale, d * scale, u, v, 64, 32, w, h, d)
    geometries.push(geo)
    const mesh = new THREE.Mesh(geo, boneMat)
    mesh.position.copy(offset)
    group.add(mesh)
    return mesh
  }

  const bodyGroup = new THREE.Group()
  root.add(bodyGroup)

  const head = new THREE.Group()
  head.position.set(0, 24 * PX, 0)
  bodyGroup.add(head)
  makePart(head, { w: 8, h: 8, d: 8, base: [0, 0], overlay: [32, 0], inflate: 0.5 }, new THREE.Vector3(0, 4 * PX, 0))
  makeBone(head, 8, 8, 8, 0, 0, 0.93, new THREE.Vector3(0, 4 * PX, 0))

  const body = new THREE.Group()
  body.position.set(0, 18 * PX, 0)
  bodyGroup.add(body)
  makePart(body, { w: 8, h: 12, d: 4, base: [16, 16], overlay: [16, 32], inflate: 0.25 }, new THREE.Vector3())
  makeBone(body, 8, 12, 4, 16, 16, 0.92, new THREE.Vector3())

  const armW = slim ? 3 : 4
  const rightArm = new THREE.Group()
  rightArm.position.set(-(4 + armW / 2) * PX, 22 * PX, 0)
  bodyGroup.add(rightArm)
  const leftArm = new THREE.Group()
  leftArm.position.set((4 + armW / 2) * PX, 22 * PX, 0)
  bodyGroup.add(leftArm)

  const rightLeg = new THREE.Group()
  rightLeg.position.set(-2 * PX, 12 * PX, 0)
  bodyGroup.add(rightLeg)
  makePart(rightLeg, { w: 4, h: 12, d: 4, base: [0, 16], overlay: [0, 32], inflate: 0.25 }, new THREE.Vector3(0, -6 * PX, 0))
  makeBone(rightLeg, 2, 12, 2, 0, 16, 1, new THREE.Vector3(0, -6 * PX, 0))

  const leftLeg = new THREE.Group()
  leftLeg.position.set(2 * PX, 12 * PX, 0)
  bodyGroup.add(leftLeg)
  makePart(leftLeg, { w: 4, h: 12, d: 4, base: [16, 48], overlay: [0, 48], inflate: 0.25 }, new THREE.Vector3(0, -6 * PX, 0))
  makeBone(leftLeg, 2, 12, 2, 0, 16, 1, new THREE.Vector3(0, -6 * PX, 0))

  const capeGroup = new THREE.Group()
  capeGroup.position.set(0, 24 * PX, -2.6 * PX)
  bodyGroup.add(capeGroup)
  if (cape) {
    const capeMat = applyReveal(new THREE.MeshLambertMaterial({ map: cape }), 'skin', uniforms)
    materials.push(capeMat)
    const capeGeo = boxGeometry(10, 16, 1, 0, 0, 64, 32)
    geometries.push(capeGeo)
    const capeMesh = new THREE.Mesh(capeGeo, capeMat)
    capeMesh.position.set(0, -8 * PX, -0.5 * PX)
    capeMesh.rotation.y = Math.PI
    capeMesh.castShadow = true
    capeGroup.add(capeMesh)
    skinMeshes.push(capeMesh)
  }

  const armMeshes: THREE.Object3D[] = []
  const buildArms = (isSlim: boolean) => {
    armMeshes.forEach((m) => {
      m.parent?.remove(m)
      const mesh = m as THREE.Mesh
      mesh.geometry.dispose()
      const idx = skinMeshes.indexOf(mesh)
      if (idx >= 0) skinMeshes.splice(idx, 1)
      const hidx = hitMeshes.indexOf(mesh)
      if (hidx >= 0) hitMeshes.splice(hidx, 1)
    })
    armMeshes.length = 0
    const w = isSlim ? 3 : 4
    rightArm.position.x = -(4 + w / 2) * PX
    leftArm.position.x = (4 + w / 2) * PX
    makePart(rightArm, { w, h: 12, d: 4, base: [40, 16], overlay: [40, 32], inflate: 0.25 }, new THREE.Vector3(0, -4 * PX, 0))
    makePart(leftArm, { w, h: 12, d: 4, base: [32, 48], overlay: [48, 48], inflate: 0.25 }, new THREE.Vector3(0, -4 * PX, 0))
    makeBone(rightArm, 2, 12, 2, 40, 16, 1, new THREE.Vector3(0, -4 * PX, 0))
    makeBone(leftArm, 2, 12, 2, 40, 16, 1, new THREE.Vector3(0, -4 * PX, 0))
    armMeshes.push(...rightArm.children, ...leftArm.children)
  }
  buildArms(slim)

  return {
    root,
    head,
    body,
    rightArm,
    leftArm,
    rightLeg,
    leftLeg,
    cape: capeGroup,
    skinMeshes,
    hitMeshes,
    materials,
    geometries,
    setSkin(tex: THREE.Texture, isSlim: boolean) {
      skinBase.map = tex
      skinOverlay.map = tex
      skinBase.needsUpdate = true
      skinOverlay.needsUpdate = true
      if (isSlim !== slim) buildArms(isSlim)
    },
  }
}

export function detectSlimSkin(image: HTMLImageElement | ImageBitmap): boolean {
  try {
    const c = document.createElement('canvas')
    c.width = image.width
    c.height = image.height
    const ctx = c.getContext('2d')
    if (!ctx || image.height < 64) return false
    ctx.drawImage(image as CanvasImageSource, 0, 0)
    const px = ctx.getImageData(54, 20, 2, 12).data
    for (let i = 3; i < px.length; i += 4) if (px[i] !== 0) return false
    return true
  } catch {
    return false
  }
}
