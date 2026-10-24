import * as THREE from 'three'
import { BlockTextures, type BlockTextureName } from './blockTextures'

export type BlockType =
  | 'grass' | 'dirt' | 'stone' | 'cobble' | 'path' | 'log' | 'planks' | 'roof' | 'leaves'
  | 'obsidian' | 'diamondOre' | 'emeraldOre' | 'goldOre' | 'diamondBlock' | 'glowstone'
  | 'beacon' | 'glass' | 'craftingTable' | 'furnace' | 'bookshelf'
  | 'deepslate' | 'deepslateBricks' | 'deepslateTiles' | 'polishedDeepslate' | 'chiseledDeepslate'
  | 'reinforced' | 'sculk' | 'sculkCatalyst' | 'soulLantern' | 'darkPlanks'

export type Biome = 'overworld' | 'ancient'

type FaceSet = [BlockTextureName, BlockTextureName, BlockTextureName, BlockTextureName, BlockTextureName, BlockTextureName]

const FACES: Record<BlockType, FaceSet> = {
  grass: ['grassSide', 'grassSide', 'grassTop', 'dirt', 'grassSide', 'grassSide'],
  dirt: ['dirt', 'dirt', 'dirt', 'dirt', 'dirt', 'dirt'],
  stone: ['stone', 'stone', 'stone', 'stone', 'stone', 'stone'],
  cobble: ['cobble', 'cobble', 'cobble', 'cobble', 'cobble', 'cobble'],
  path: ['dirt', 'dirt', 'path', 'dirt', 'dirt', 'dirt'],
  log: ['logSide', 'logSide', 'logTop', 'logTop', 'logSide', 'logSide'],
  planks: ['planks', 'planks', 'planks', 'planks', 'planks', 'planks'],
  roof: ['roof', 'roof', 'roof', 'roof', 'roof', 'roof'],
  leaves: ['leaves', 'leaves', 'leaves', 'leaves', 'leaves', 'leaves'],
  obsidian: ['obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian', 'obsidian'],
  diamondOre: ['diamondOre', 'diamondOre', 'diamondOre', 'diamondOre', 'diamondOre', 'diamondOre'],
  emeraldOre: ['emeraldOre', 'emeraldOre', 'emeraldOre', 'emeraldOre', 'emeraldOre', 'emeraldOre'],
  goldOre: ['goldOre', 'goldOre', 'goldOre', 'goldOre', 'goldOre', 'goldOre'],
  diamondBlock: ['diamondBlock', 'diamondBlock', 'diamondBlock', 'diamondBlock', 'diamondBlock', 'diamondBlock'],
  glowstone: ['glowstone', 'glowstone', 'glowstone', 'glowstone', 'glowstone', 'glowstone'],
  beacon: ['beacon', 'beacon', 'beacon', 'beacon', 'beacon', 'beacon'],
  glass: ['glass', 'glass', 'glass', 'glass', 'glass', 'glass'],
  craftingTable: ['craftSide', 'craftSide', 'craftTop', 'planks', 'craftSide', 'craftSide'],
  furnace: ['cobble', 'cobble', 'cobble', 'cobble', 'furnaceFront', 'cobble'],
  bookshelf: ['bookshelf', 'bookshelf', 'planks', 'planks', 'bookshelf', 'bookshelf'],
  deepslate: ['deepslate', 'deepslate', 'deepslate', 'deepslate', 'deepslate', 'deepslate'],
  deepslateBricks: ['deepslateBricks', 'deepslateBricks', 'deepslateBricks', 'deepslateBricks', 'deepslateBricks', 'deepslateBricks'],
  deepslateTiles: ['deepslateTiles', 'deepslateTiles', 'deepslateTiles', 'deepslateTiles', 'deepslateTiles', 'deepslateTiles'],
  polishedDeepslate: ['polishedDeepslate', 'polishedDeepslate', 'polishedDeepslate', 'polishedDeepslate', 'polishedDeepslate', 'polishedDeepslate'],
  chiseledDeepslate: ['chiseledDeepslate', 'chiseledDeepslate', 'polishedDeepslate', 'polishedDeepslate', 'chiseledDeepslate', 'chiseledDeepslate'],
  reinforced: ['reinforced', 'reinforced', 'reinforced', 'reinforced', 'reinforced', 'reinforced'],
  sculk: ['sculk', 'sculk', 'sculk', 'sculk', 'sculk', 'sculk'],
  sculkCatalyst: ['sculkCatalyst', 'sculkCatalyst', 'sculk', 'deepslate', 'sculkCatalyst', 'sculkCatalyst'],
  soulLantern: ['soulLantern', 'soulLantern', 'soulLantern', 'soulLantern', 'soulLantern', 'soulLantern'],
  darkPlanks: ['darkPlanks', 'darkPlanks', 'darkPlanks', 'darkPlanks', 'darkPlanks', 'darkPlanks'],
}

const ANCIENT_REMAP: Partial<Record<BlockType, BlockType | null>> = {
  grass: 'deepslateTiles',
  dirt: 'deepslate',
  stone: 'deepslate',
  diamondOre: 'deepslate',
  emeraldOre: 'deepslate',
  goldOre: 'deepslate',
  cobble: 'deepslateTiles',
  path: 'polishedDeepslate',
  log: 'polishedDeepslate',
  planks: 'deepslateBricks',
  roof: 'darkPlanks',
  glass: null,
  glowstone: 'soulLantern',
  diamondBlock: 'reinforced',
  beacon: 'sculkCatalyst',
  leaves: null,
}

const SEE_THROUGH = new Set<BlockType>(['leaves', 'glass'])
const EMISSIVE: Partial<Record<BlockType, number>> = { glowstone: 0.9, beacon: 1, soulLantern: 1, sculk: 0.35, sculkCatalyst: 0.25 }

function hash2(x: number, z: number, seed = 1) {
  let h = (x * 374761393 + z * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function smoothNoise(x: number, z: number, seed = 1) {
  const xi = Math.floor(x)
  const zi = Math.floor(z)
  const xf = x - xi
  const zf = z - zi
  const s = (t: number) => t * t * (3 - 2 * t)
  const a = hash2(xi, zi, seed)
  const b = hash2(xi + 1, zi, seed)
  const c = hash2(xi, zi + 1, seed)
  const d = hash2(xi + 1, zi + 1, seed)
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, s(xf)), THREE.MathUtils.lerp(c, d, s(xf)), s(zf))
}

function fbm(x: number, z: number, seed = 1) {
  return smoothNoise(x * 0.12, z * 0.12, seed) * 0.6 + smoothNoise(x * 0.27, z * 0.27, seed + 7) * 0.3 + smoothNoise(x * 0.6, z * 0.6, seed + 13) * 0.1
}

export interface Interactive {
  section: string
  label: string
  object: THREE.Object3D
}

export interface WorldBuild {
  group: THREE.Group
  interactives: Interactive[]
  anchors: Record<string, THREE.Vector3>
  portal: THREE.Mesh
  beam: THREE.Mesh
  portalLight: THREE.PointLight
  beaconLight: THREE.PointLight
  torchLight: THREE.PointLight
  clouds: THREE.InstancedMesh
  cloudData: { x: number; y: number; z: number; sx: number; sz: number }[]
  disposables: { dispose(): void }[]
}

export function buildWorld(textures: BlockTextures, shadows: boolean, biome: Biome = 'overworld', lite = false): WorldBuild {
  const ancient = biome === 'ancient'
  const blocks = new Map<string, BlockType>()
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`
  const raw = (x: number, y: number, z: number, t: BlockType) => blocks.set(key(x, y, z), t)
  const set = (x: number, y: number, z: number, t: BlockType) => {
    if (!ancient) return void blocks.set(key(x, y, z), t)
    const mapped = t in ANCIENT_REMAP ? ANCIENT_REMAP[t] : t
    if (mapped) blocks.set(key(x, y, z), mapped)
  }
  const del = (x: number, y: number, z: number) => blocks.delete(key(x, y, z))
  const get = (x: number, y: number, z: number) => blocks.get(key(x, y, z))

  const flatZones = [
    { x: 0, z: 0, r: 6 },
    { x: -9, z: -6, r: 7 },
    { x: 9, z: -2, r: 4 },
    { x: 7, z: 6, r: 4 },
    { x: 13, z: -11, r: 4 },
    { x: -1, z: -15, r: 4 },
    { x: -15, z: 5, r: 4 },
  ]
  const RX = 24
  const RZ = 21
  const heights = new Map<string, number>()
  const occupied = new Set<string>()

  if (ancient) {
    for (let x = -32; x <= 32; x++) {
      for (let z = -28; z <= 24; z++) {
        const e = Math.min(x + 32, 32 - x, z + 28, 24 - z)
        const n = fbm(x, z, 5)
        let flat = 0
        for (const f of flatZones) {
          const fd = Math.hypot(x - f.x, z - f.z)
          flat = Math.max(flat, 1 - THREE.MathUtils.smoothstep(fd, f.r - 1.5, f.r + 1.5))
        }
        const wall = e < 6 ? Math.round((6 - e) * 2.6 + n * 5) : 0
        const h = wall || Math.round((n - 0.45) * 1.6 * (1 - flat))
        heights.set(`${x},${z}`, h)
        const sculky = fbm(x + 40, z - 17, 11) > 0.5
        for (let y = h - 1; y >= (lite && !wall ? h - 2 : Math.min(-3, h - 3)); y--) {
          let t: BlockType = 'deepslate'
          if (y === h - 1) t = sculky ? 'sculk' : wall ? 'deepslate' : hash2(x, z, 23) < 0.55 ? 'deepslateTiles' : 'deepslate'
          raw(x, y, z, t)
        }
      }
    }
  } else {
    for (let x = -RX - 2; x <= RX + 2; x++) {
      for (let z = -RZ - 2; z <= RZ + 2; z++) {
        const d = Math.sqrt((x / RX) ** 2 + (z / RZ) ** 2)
        const n = fbm(x, z, 3)
        if (d + (n - 0.5) * 0.25 > 1) continue
        let flat = 0
        for (const f of flatZones) {
          const fd = Math.hypot(x - f.x, z - f.z)
          flat = Math.max(flat, 1 - THREE.MathUtils.smoothstep(fd, f.r - 1.5, f.r + 1.5))
        }
        const rise = THREE.MathUtils.smoothstep(d, 0.3, 0.85) * (n * 4.2) + (z < -10 ? 1 : 0)
        const h = Math.round(rise * (1 - flat))
        heights.set(`${x},${z}`, h)
        const depth = lite ? 2 + Math.floor((1 - d) * 4) : 3 + Math.floor((1 - d) * 11 + hash2(x, z, 9) * 3)
        for (let y = h - 1; y >= h - depth; y--) {
          let t: BlockType
          if (y === h - 1) t = 'grass'
          else if (y >= h - 3) t = 'dirt'
          else {
            const r = hash2(x * 3 + y, z * 5 - y, 17)
            t = r < 0.025 ? 'diamondOre' : r < 0.045 ? 'emeraldOre' : r < 0.07 ? 'goldOre' : 'stone'
          }
          set(x, y, z, t)
        }
      }
    }
  }
  const topY = (x: number, z: number) => heights.get(`${x},${z}`) ?? 0

  const pathTo = (tx: number, tz: number) => {
    let x = 0
    let z = 2
    while (x !== tx || z !== tz) {
      if (Math.abs(tx - x) > Math.abs(tz - z)) x += Math.sign(tx - x)
      else z += Math.sign(tz - z)
      const y = topY(x, z) - 1
      const top = get(x, y, z)
      if (top === 'grass' || (ancient && top && top !== 'sculk')) set(x, y, z, 'path')
      occupied.add(`${x},${z}`)
    }
  }
  pathTo(-8, -2)
  pathTo(8, 0)
  pathTo(7, 4)
  pathTo(12, -8)
  pathTo(-1, -12)
  pathTo(-13, 4)

  const ox = -12
  const oz = -9
  for (let x = ox; x <= ox + 6; x++) {
    for (let z = oz; z <= oz + 5; z++) {
      set(x, -1, z, 'cobble')
      occupied.add(`${x},${z}`)
      const edgeX = x === ox || x === ox + 6
      const edgeZ = z === oz || z === oz + 5
      if (!edgeX && !edgeZ) continue
      for (let y = 0; y <= 3; y++) {
        const corner = edgeX && edgeZ
        let t: BlockType = corner ? 'log' : 'planks'
        if (!corner && (y === 1 || y === 2) && ((edgeZ && (x === ox + 1 || x === ox + 5)) || (edgeX && (z === oz + 2 || z === oz + 3)))) t = 'glass'
        if (z === oz + 5 && x === ox + 3 && y <= 1) continue
        set(x, y, z, t)
      }
    }
  }
  for (let k = 0; k <= 3; k++) {
    for (let x = ox - 1; x <= ox + 7; x++) {
      for (let z = oz - 1 + k; z <= oz + 6 - k; z++) {
        if (z === oz - 1 + k || z === oz + 6 - k || k === 3) set(x, 4 + k, z, 'roof')
      }
    }
    if (k < 3) {
      for (let z = oz + k; z <= oz + 5 - k; z++) {
        set(ox, 4 + k, z, 'planks')
        set(ox + 6, 4 + k, z, 'planks')
      }
    }
  }
  set(ox + 2, 3, oz + 6, 'glowstone')

  for (let x = 7; x <= 11; x++) for (let z = -4; z <= -1; z++) { set(x, -1, z, 'cobble'); occupied.add(`${x},${z}`) }
  set(8, 0, -3, 'craftingTable')
  set(9, 0, -3, 'furnace')
  set(10, 0, -3, 'furnace')
  set(10, 1, -3, 'craftingTable')
  set(11, 0, -3, 'bookshelf')

  for (let x = 12; x <= 14; x++) for (let z = -12; z <= -10; z++) { set(x, 0, z, 'diamondBlock'); occupied.add(`${x},${z}`) }
  set(13, 1, -11, 'beacon')

  if (ancient) {
    for (let x = -12; x <= 10; x++) for (let z = -19; z <= -13; z++) { raw(x, -1, z, (x + z) % 5 === 0 ? 'sculk' : 'deepslateTiles'); occupied.add(`${x},${z}`) }
    for (const z of [-16, -15]) {
      for (const x of [-10, -9, 7, 8]) for (let y = 0; y <= 10; y++) raw(x, y, z, y % 4 === 3 ? 'chiseledDeepslate' : 'deepslateBricks')
      for (let x = -10; x <= 8; x++) for (let y = 11; y <= 12; y++) raw(x, y, z, 'deepslateBricks')
      for (let x = -8; x <= 6; x++) raw(x, 13, z, 'deepslateTiles')
      for (const x of [-10, -9, 7, 8]) for (let y = 13; y <= 14; y++) raw(x, y, z, 'polishedDeepslate')
      for (const x of [-8, -7, 5, 6]) for (let y = 0; y <= 1; y++) raw(x, y, z, 'deepslateBricks')
    }
    for (const x of [-6, 4]) for (let y = 0; y <= 9; y++) raw(x, y, -15, 'reinforced')
    for (let x = -6; x <= 4; x++) raw(x, 9, -15, 'reinforced')
    for (let x = -6; x <= 4; x++) raw(x, 10, -15, 'deepslateBricks')
  } else {
    for (let x = -3; x <= 0; x++) {
      for (let y = 0; y <= 4; y++) {
        if (x === -3 || x === 0 || y === 0 || y === 4) set(x, y, -15, 'obsidian')
      }
      occupied.add(`${x},-15`)
    }
  }

  for (const [x, z, h] of [[-16, 3, 3], [-16, 4, 3], [-16, 5, 2], [-15, 6, 2], [-14, 6, 1], [-17, 5, 1]] as const) {
    for (let y = 0; y < h; y++) set(x, y + topY(x, z), z, 'bookshelf')
    occupied.add(`${x},${z}`)
  }

  const trees = [[-5, 8], [5, -9], [16, 6], [-19, -4], [-7, 15], [18, -4], [3, 15], [-20, 9], [12, 13], [-4, -19]]
  const lanternSpots: THREE.Vector3[] = []
  if (ancient) {
    for (const [tx, tz] of trees) {
      if (!heights.has(`${tx},${tz}`)) continue
      const base = topY(tx, tz)
      const h = 2 + Math.floor(hash2(tx, tz, 4) * 4)
      for (let y = 0; y < h; y++) raw(tx, base + y, tz, y === h - 1 ? 'chiseledDeepslate' : 'polishedDeepslate')
      if (h > 2) lanternSpots.push(new THREE.Vector3(tx + 0.5, base + h + 0.2, tz + 0.5))
      occupied.add(`${tx},${tz}`)
    }
    for (const [x0, z0, dx, dz, len, hh] of [[-21, -10, 0, 1, 12, 3], [15, 11, 1, 0, 8, 2], [-14, 12, 1, 0, 7, 3], [17, -16, 0, 1, 6, 4]] as const) {
      for (let i = 0; i < len; i++) {
        const x = x0 + dx * i
        const z = z0 + dz * i
        const top = hh - (hash2(x, z, 77) < 0.35 ? 1 + Math.floor(hash2(z, x, 78) * 2) : 0)
        for (let y = 0; y < top; y++) raw(x, topY(x, z) + y, z, 'deepslateBricks')
        occupied.add(`${x},${z}`)
      }
    }
    lanternSpots.push(new THREE.Vector3(-9, 15.3, -15), new THREE.Vector3(8, 15.3, -15), new THREE.Vector3(-8, 2.2, -13.2), new THREE.Vector3(6, 2.2, -13.2))
  }
  for (const [tx, tz] of ancient ? [] : trees) {
    if (!heights.has(`${tx},${tz}`)) continue
    const base = topY(tx, tz)
    const h = 4 + Math.floor(hash2(tx, tz, 4) * 2)
    for (let y = 0; y < h; y++) set(tx, base + y, tz, 'log')
    for (let y = h - 2; y <= h + 1; y++) {
      const rad = y >= h ? 1 : 2
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (Math.abs(dx) === rad && Math.abs(dz) === rad && (y === h + 1 || hash2(tx + dx, tz + dz, y) > 0.5)) continue
          if (dx === 0 && dz === 0 && y < h) continue
          if (!get(tx + dx, base + y, tz + dz)) set(tx + dx, base + y, tz + dz, 'leaves')
        }
      }
    }
    occupied.add(`${tx},${tz}`)
  }

  const group = new THREE.Group()
  const disposables: { dispose(): void }[] = []
  const geoCache = new Map<string, THREE.BufferGeometry>()
  const boxFor = (faces: FaceSet) => {
    const keys = [...new Set(faces)]
    const sig = faces.map((f) => keys.indexOf(f)).join('')
    const hit = geoCache.get(sig)
    if (hit) return { geo: hit, keys }
    const base = new THREE.BoxGeometry(1, 1, 1)
    const src = base.getIndex()!.array
    const index: number[] = []
    base.clearGroups()
    keys.forEach((k, mi) => {
      const start = index.length
      faces.forEach((f, fi) => {
        if (f === k) for (let j = 0; j < 6; j++) index.push(src[fi * 6 + j])
      })
      base.addGroup(start, index.length - start, mi)
    })
    base.setIndex(index)
    if (keys.length === 1) base.clearGroups()
    geoCache.set(sig, base)
    disposables.push(base)
    return { geo: base, keys }
  }

  const byType = new Map<BlockType, THREE.Vector3[]>()
  const solidAt = (x: number, y: number, z: number) => {
    const t = get(x, y, z)
    return t !== undefined && !SEE_THROUGH.has(t)
  }
  blocks.forEach((t, k) => {
    const [x, y, z] = k.split(',').map(Number)
    if (solidAt(x + 1, y, z) && solidAt(x - 1, y, z) && solidAt(x, y + 1, z) && solidAt(x, y - 1, z) && solidAt(x, y, z + 1) && solidAt(x, y, z - 1)) return
    if (!byType.has(t)) byType.set(t, [])
    byType.get(t)!.push(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5))
  })

  const m = new THREE.Matrix4()
  byType.forEach((positions, type) => {
    const { geo, keys } = boxFor(FACES[type])
    const mats = keys.map((name) => {
      const tex = textures.get(name)
      const mat = new THREE.MeshLambertMaterial({
        map: tex,
        alphaTest: SEE_THROUGH.has(type) ? 0.5 : 0,
        transparent: type === 'glass',
        side: type === 'leaves' ? THREE.DoubleSide : THREE.FrontSide,
        emissive: EMISSIVE[type] ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
        emissiveMap: EMISSIVE[type] ? tex : null,
        emissiveIntensity: EMISSIVE[type] ?? 0,
      })
      disposables.push(mat)
      return mat
    })
    const mesh = new THREE.InstancedMesh(geo, mats.length === 1 ? mats[0] : mats, positions.length)
    positions.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = shadows && type !== 'glass'
    mesh.receiveShadow = shadows
    mesh.computeBoundingSphere()
    group.add(mesh)
    disposables.push(mesh)
  })

  const cross = new THREE.PlaneGeometry(1, 1)
  disposables.push(cross)
  const foliage: { name: BlockTextureName; density: number; scale: number }[] = ancient
    ? [
        { name: 'sculkSprout', density: 0.09, scale: 0.6 },
        { name: 'candle', density: 0.035, scale: 0.6 },
      ]
    : [
        { name: 'tallGrass', density: 0.14, scale: 0.9 },
        { name: 'flowerRed', density: 0.025, scale: 0.7 },
        { name: 'flowerYellow', density: 0.025, scale: 0.7 },
      ]
  const groundOk = (t: BlockType | undefined) => (ancient ? t === 'sculk' || t === 'deepslateTiles' || t === 'deepslate' : t === 'grass')
  foliage.forEach((f, fi) => {
    const spots: THREE.Vector3[] = []
    heights.forEach((h, k) => {
      const [x, z] = k.split(',').map(Number)
      if (occupied.has(k) || Math.hypot(x, z) < 3) return
      if (!groundOk(get(x, h - 1, z)) || get(x, h, z)) return
      if (hash2(x, z, 40 + fi) < f.density * (lite ? 0.45 : 1)) spots.push(new THREE.Vector3(x + 0.5, h + f.scale / 2, z + 0.5))
    })
    if (!spots.length) return
    const glow = f.name === 'candle' || f.name === 'sculkSprout'
    const mat = new THREE.MeshLambertMaterial({ map: textures.get(f.name), alphaTest: 0.5, side: THREE.DoubleSide, emissive: glow ? new THREE.Color('#ffffff') : new THREE.Color('#000000'), emissiveMap: glow ? textures.get(f.name) : null, emissiveIntensity: glow ? 0.7 : 0 })
    disposables.push(mat)
    const mesh = new THREE.InstancedMesh(cross, mat, spots.length * 2)
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(f.scale, f.scale, f.scale)
    spots.forEach((p, i) => {
      for (let j = 0; j < 2; j++) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4 + (j * Math.PI) / 2)
        m.compose(p, q, s)
        mesh.setMatrixAt(i * 2 + j, m)
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    group.add(mesh)
    disposables.push(mesh)
  })

  const torchSpots = [new THREE.Vector3(-7.5, 0, -2.5), new THREE.Vector3(2.5, 0, -13.5), new THREE.Vector3(6.5, 0, 3.5), new THREE.Vector3(11.5, 0, -5.5)]
  const torchTex = textures.get(ancient ? 'candle' : 'torch')
  const torchMat = new THREE.MeshLambertMaterial({ map: torchTex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color('#ffb347'), emissiveMap: torchTex, emissiveIntensity: 1 })
  disposables.push(torchMat)
  const torches = new THREE.InstancedMesh(cross, torchMat, torchSpots.length * 2)
  torchSpots.forEach((p, i) => {
    for (let j = 0; j < 2; j++) {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4 + (j * Math.PI) / 2)
      m.compose(new THREE.Vector3(p.x, topY(Math.floor(p.x), Math.floor(p.z)) + 0.5, p.z), q, new THREE.Vector3(1, 1, 1))
      torches.setMatrixAt(i * 2 + j, m)
    }
  })
  group.add(torches)
  disposables.push(torches)

  const chestGroup = new THREE.Group()
  const chestBodyGeo = new THREE.BoxGeometry(0.875, 0.625, 0.875)
  const chestLidGeo = new THREE.BoxGeometry(0.875, 0.25, 0.875)
  disposables.push(chestBodyGeo, chestLidGeo)
  const side = new THREE.MeshLambertMaterial({ map: textures.get('chestSide') })
  const front = new THREE.MeshLambertMaterial({ map: textures.get('chestFront') })
  const top = new THREE.MeshLambertMaterial({ map: textures.get('chestTop') })
  disposables.push(side, front, top)
  const chestMats = [side, side, top, top, front, side]
  const lids: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const cx = 5.5 + i * 1.25
    const cz = 6.5
    const b = new THREE.Mesh(chestBodyGeo, chestMats)
    b.position.set(cx, 0.3125, cz)
    b.castShadow = shadows
    b.receiveShadow = shadows
    const lid = new THREE.Mesh(chestLidGeo, chestMats)
    lid.position.set(cx, 0.75, cz)
    lid.castShadow = shadows
    lids.push(lid)
    chestGroup.add(b, lid)
  }
  group.add(chestGroup)

  const portalGeo = ancient ? new THREE.PlaneGeometry(9, 9) : new THREE.PlaneGeometry(2, 3)
  const portalMat = new THREE.MeshBasicMaterial({
    map: textures.portal,
    color: ancient ? new THREE.Color('#0d4a5a') : new THREE.Color('#ffffff'),
    transparent: true,
    opacity: ancient ? 0.3 : 0.88,
    blending: ancient ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  disposables.push(portalGeo, portalMat)
  const portal = new THREE.Mesh(portalGeo, portalMat)
  if (ancient) portal.position.set(-0.5, 4.5, -15)
  else portal.position.set(-1, 2.5, -14.5)
  group.add(portal)
  const portalLight = new THREE.PointLight(ancient ? '#1fc8e6' : '#a24dff', 6, ancient ? 16 : 9, 1.6)
  if (ancient) portalLight.position.set(-0.5, 4, -12.5)
  else portalLight.position.set(-1, 2.5, -13.5)
  group.add(portalLight)

  if (lanternSpots.length) {
    const lanternGeo = new THREE.BoxGeometry(0.42, 0.5, 0.42)
    const lanternTex = textures.get('soulLantern')
    const lanternMat = new THREE.MeshLambertMaterial({ map: lanternTex, emissive: new THREE.Color('#ffffff'), emissiveMap: lanternTex, emissiveIntensity: 1.2 })
    disposables.push(lanternGeo, lanternMat)
    const lanterns = new THREE.InstancedMesh(lanternGeo, lanternMat, lanternSpots.length)
    lanternSpots.forEach((p, i) => {
      m.makeTranslation(p.x, p.y, p.z)
      lanterns.setMatrixAt(i, m)
    })
    lanterns.instanceMatrix.needsUpdate = true
    group.add(lanterns)
    disposables.push(lanterns)
  }

  const beamGeo = new THREE.BoxGeometry(0.42, 60, 0.42)
  const beamMat = new THREE.MeshBasicMaterial({ color: ancient ? '#2fb8d6' : '#7ff6ec', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  disposables.push(beamGeo, beamMat)
  const beam = new THREE.Mesh(beamGeo, beamMat)
  beam.position.set(13.5, 32, -10.5)
  group.add(beam)
  const beaconLight = new THREE.PointLight(ancient ? '#2fd2e6' : '#5ff2e4', 3, 10, 1.6)
  beaconLight.position.set(13.5, 2.5, -10.5)
  group.add(beaconLight)

  const torchLight = new THREE.PointLight('#ffb347', 0, 9, 1.8)
  torchLight.position.set(-9.5, 3, -2.5)
  group.add(torchLight)

  const cloudGeo = new THREE.BoxGeometry(1, 1, 1)
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.82, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.35, depthWrite: false })
  disposables.push(cloudGeo, cloudMat)
  const cloudData: WorldBuild['cloudData'] = []
  for (let i = 0; i < (ancient ? 0 : lite ? 10 : 26); i++) {
    const below = i % 3 === 0
    cloudData.push({
      x: -90 + hash2(i, 1, 5) * 180,
      y: below ? -16 - hash2(i, 2, 5) * 6 : 20 + hash2(i, 3, 5) * 8,
      z: -80 + hash2(i, 4, 5) * 150,
      sx: 6 + Math.floor(hash2(i, 5, 5) * 10),
      sz: 4 + Math.floor(hash2(i, 6, 5) * 7),
    })
  }
  const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, Math.max(1, cloudData.length))
  clouds.count = cloudData.length
  group.add(clouds)

  const interactives: Interactive[] = []
  const hitMat = new THREE.MeshBasicMaterial({ visible: false })
  disposables.push(hitMat)
  const addHit = (section: string, label: string, size: [number, number, number], pos: [number, number, number]) => {
    const g = new THREE.BoxGeometry(...size)
    disposables.push(g)
    const mesh = new THREE.Mesh(g, hitMat)
    mesh.position.set(...pos)
    group.add(mesh)
    interactives.push({ section, label, object: mesh })
  }
  addHit('about', ancient ? 'Ruined house · About me' : 'Cottage · About me', [8, 8, 7], [ox + 3.5, 3.5, oz + 3])
  addHit('skills', 'Workshop · Skills', [5, 2.5, 2], [9.5, 1, -2.5])
  addHit('projects', 'Chests · Projects', [5.2, 1.2, 1.2], [7.4, 0.5, 6.5])
  addHit('activity', ancient ? 'Sculk catalyst · GitHub activity' : 'Beacon · GitHub activity', [3.2, 6, 3.2], [13.5, 2.5, -10.5])
  if (ancient) addHit('contact', 'Ancient portal · Contact', [19, 15, 2], [-1, 7, -15])
  else addHit('contact', 'Nether portal · Contact', [4, 5, 1], [-1, 2.5, -14.5])
  addHit('blog', 'Library · Writing', [4, 3.5, 4], [-15.5, 1.5, 5])

  const anchors: Record<string, THREE.Vector3> = {
    player: new THREE.Vector3(0, 0, 0),
    about: new THREE.Vector3(ox + 3.5, 2.5, oz + 3),
    skills: new THREE.Vector3(9.5, 1, -2.5),
    projects: new THREE.Vector3(7.4, 0.6, 6.5),
    activity: new THREE.Vector3(13.5, 3, -10.5),
    contact: ancient ? new THREE.Vector3(-0.5, 5.5, -15) : new THREE.Vector3(-1.5, 2.4, -14.5),
    blog: new THREE.Vector3(-15.5, 1.5, 5),
    world: new THREE.Vector3(0, 0, 0),
  }

  return { group, interactives, anchors, portal, beam, portalLight, beaconLight, torchLight, clouds, cloudData, disposables }
}
