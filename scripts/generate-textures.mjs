import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const force = process.argv.includes('--force')

function hex(h) {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]
}

function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function createCanvas(w, h) {
  const png = new PNG({ width: w, height: h })
  png.data.fill(0)
  return {
    png,
    set(x, y, c) {
      if (!c || x < 0 || y < 0 || x >= w || y >= h) return
      const i = (y * w + x) * 4
      const rgba = typeof c === 'string' ? hex(c) : c
      png.data[i] = rgba[0]
      png.data[i + 1] = rgba[1]
      png.data[i + 2] = rgba[2]
      png.data[i + 3] = rgba[3] ?? 255
    },
  }
}

function paintBox(cv, u, v, w, h, d, painter) {
  const faces = {
    top: [u + d, v, w, d],
    bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h],
    front: [u + d, v + d, w, h],
    left: [u + d + w, v + d, d, h],
    back: [u + d + w + d, v + d, w, h],
  }
  for (const [face, [fx, fy, fw, fh]] of Object.entries(faces)) {
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        cv.set(fx + x, fy + y, painter(face, x, y, fw, fh))
      }
    }
  }
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)]
}

function writePng(cv, rel) {
  const out = resolve(root, rel)
  if (existsSync(out) && !force && rel.endsWith('skin.png')) {
    console.log(`kept existing ${rel} (use --force to overwrite)`)
    return
  }
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, PNG.sync.write(cv.png))
  console.log(`wrote ${rel}`)
}

function makeSkin() {
  const cv = createCanvas(64, 64)
  const r = seeded(7)
  const skin = ['#eda57f', '#e89d76', '#f0ab86']
  const skinShade = '#d88d66'
  const skinLight = '#f6c39d'
  const H = ['#5e2a12', '#723418', '#86401e', '#9a4c26', '#ae5c30', '#c06e3c']
  const HB = ['#2c0a04', '#3a0f07', '#4b150b', '#5d1d0e', '#702713', '#84321a']
  const B = ['#7a3214', '#8f3c19', '#a24a20', '#b2562a', '#c26532', '#d27a42']
  const mouth = '#55250f'
  const eyeWhite = '#f3f1f4'
  const iris = '#5a3ea6'
  const colHash = (x, salt) => {
    let h = (x * 374761393 + salt * 668265263) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const strand = (pal, x, y, salt, base, spread = 2) => {
    let i = base + Math.floor(colHash(x, salt) * spread)
    if (colHash(x * 7 + y, salt + 3) > 0.78) i += 1
    if (colHash(x * 13 + y * 5, salt + 9) > 0.86) i -= 1
    return pal[Math.max(0, Math.min(pal.length - 1, i))]
  }
  const hair = (x, y, salt = 1, lift = 0) => strand(H, x, y, salt, 2 + lift - (y === 0 ? 1 : 0))
  const hairBack = (x, y, salt = 2) => strand(HB, x, y, salt, 2 - (y >= 5 ? 1 : 0))
  const beard = (x, y, salt = 5, shade = 0) => strand(B, x, y, salt, 2 - shade)
  const flannel = (x, y) => {
    const cx = Math.floor(x / 2) % 2
    const cy = Math.floor(y / 2) % 2
    if (cx && cy) return pick(r, ['#2a2125', '#33282c'])
    if (cx || cy) return pick(r, ['#6e2329', '#78292f'])
    return pick(r, ['#c9212b', '#bd1f28', '#d12a33'])
  }
  const cuff = (y) => (y === 7 ? '#a3adb5' : pick(r, ['#c9d1d7', '#d6dde2']))
  const belt = () => pick(r, ['#5b3520', '#6a3f25', '#4e2c19', '#734628'])
  const beltDark = '#3a2112'
  const buckle = '#8a9196'
  const pouch = () => pick(r, ['#6e4428', '#7a4c2e', '#5f3a22'])
  const jeans = () => pick(r, ['#33507f', '#2d4874', '#3a5888'])
  const jeansCuff = () => pick(r, ['#5577a8', '#4d6e9e', '#5d80b2'])
  const patch = () => pick(r, ['#d9dde0', '#c4c9cd', '#eef0f1'])
  const boot = () => pick(r, ['#5b3720', '#4f2f1b'])
  const sole = '#2e1c10'

  const front = [
    'hhhhhhhh',
    'dSShHHHH',
    'SSLSTHHH',
    'SSSSSSHd',
    'SWISSIWS',
    'mMMSSMMm',
    'bBDqqDBb',
    'BBBBBBBB',
  ]
  const faceColor = (ch, x, y) => {
    switch (ch) {
      case 'h': return hair(x, y, 1, x >= 3 && x <= 5 ? 1 : 0)
      case 'H': return hair(x, y, 1, x === 4 ? 1 : 0)
      case 'd': return H[1]
      case 'T': return H[4]
      case 'S': return pick(r, skin)
      case 'L': return skinLight
      case 'W': return eyeWhite
      case 'I': return iris
      case 'M': return B[3 + (x === 2 || x === 5 ? -1 : 0)]
      case 'm': return B[4]
      case 'B': return beard(x, y, 5)
      case 'b': return B[3]
      case 'D': return B[1]
      case 'q': return mouth
      default: return null
    }
  }

  paintBox(cv, 0, 0, 8, 8, 8, (face, x, y) => {
    if (face === 'front') return faceColor(front[y][x], x, y)
    if (face === 'top') return y < 4 ? hair(x, y + 1, 4) : hairBack(x, y, 4)
    if (face === 'bottom') return y < 4 ? pick(r, skin) : beard(x, y, 8, 1)
    if (face === 'back') return y < 6 ? hairBack(x, y, 6) : y === 6 ? skinShade : pick(r, skin)
    const f = face === 'right' ? x : 7 - x
    const salt = face === 'right' ? 11 : 12
    if (y < 3) return f >= 4 ? hair(f, y, salt) : hairBack(f, y, salt)
    if (y === 3) return f >= 6 ? B[1] : f >= 4 ? hair(f, y, salt) : hairBack(f, y, salt)
    if (y === 4) return f <= 2 ? hairBack(f, y, salt) : f === 4 ? skinShade : f >= 6 ? B[1] : pick(r, skin)
    if (y === 5) return f <= 2 ? hairBack(f, y, salt) : f === 3 ? skinShade : beard(f, y, salt, f === 4 ? 1 : 0)
    return f <= 3 ? (f <= 1 && y === 6 ? HB[2] : pick(r, skin)) : beard(f, y, salt)
  })

  paintBox(cv, 32, 0, 8, 8, 8, (face, x, y) => {
    if (face === 'front') {
      if (y === 0) return hair(x, y, 21, 1)
      if (y === 1 && x >= 3) return hair(x, y, 21, x === 3 ? 2 : 0)
      if (y === 2 && x >= 5) return hair(x, y, 21, x === 5 ? 2 : 0)
      if (y === 3 && x === 7) return H[1]
      if (y === 5) return x === 0 || x === 7 ? B[4] : x === 3 || x === 4 ? null : B[3]
      if (y === 6 && (x <= 1 || x >= 6)) return beard(x, y, 22)
      if (y === 7) return colHash(x, 23) > 0.15 ? beard(x, y, 23) : null
      return null
    }
    if (face === 'top') return colHash(x * 9 + y, 24) > 0.22 ? (y < 4 ? hair(x, y + 1, 24, 1) : hairBack(x, y, 24)) : null
    if (face === 'back') {
      const len = 5 + Math.floor(colHash(x, 25) * 3)
      return y < len ? hairBack(x, y, 25) : null
    }
    if (face === 'right' || face === 'left') {
      const f = face === 'right' ? x : 7 - x
      const salt = face === 'right' ? 26 : 27
      if (y < 2) return f >= 4 ? hair(f, y, salt, 1) : hairBack(f, y, salt)
      if (y < 5 && f <= 2) return colHash(f + y, salt) > 0.2 ? hairBack(f, y, salt) : null
      if (y >= 5 && f >= 4) return beard(f, y, salt)
      if (y === 4 && f >= 6) return B[2]
      return null
    }
    if (face === 'bottom') return y < 3 ? null : beard(x, y, 28, 1)
    return null
  })

  const beardSpan = [[0, 7], [0, 7], [0, 7], [0, 7], [0, 7], [0, 7], [1, 6]]
  paintBox(cv, 16, 16, 8, 12, 4, (face, x, y) => {
    if (face === 'top') return y < 2 ? beard(x, y, 30) : flannel(x, y)
    if (face === 'bottom') return jeans()
    if (y === 8 || y === 9) {
      if (face === 'front' && y === 8 && (x === 3 || x === 4)) return buckle
      return y === 9 ? (r() > 0.5 ? beltDark : belt()) : belt()
    }
    if (y >= 10) return jeans()
    if (face === 'front') {
      const sp = beardSpan[y]
      if (sp && x >= sp[0] && x <= sp[1]) {
        const edge = x === sp[0] || x === sp[1]
        return beard(x, y, 31, (y >= 4 ? 1 : 0) + (edge ? 1 : 0) - (x === 3 && y < 3 ? 1 : 0))
      }
    }
    if (face === 'back' && y === 0 && x >= 2 && x <= 5) return skinShade
    return flannel(x + (face === 'back' ? 1 : 0), y)
  })

  const beardOverlay = [[0, 7], [0, 7], [0, 7], [0, 7], [0, 7], [1, 6], [1, 6], [2, 5]]
  paintBox(cv, 16, 32, 8, 12, 4, (face, x, y) => {
    if (face === 'front') {
      const sp = beardOverlay[y]
      if (sp && x >= sp[0] && x <= sp[1]) {
        const ragged = y >= 6 && colHash(x * 3 + y, 33) < 0.35
        if (ragged || colHash(x * 11 + y * 7, 34) < 0.12) return null
        return beard(x, y, 35, y >= 5 ? 1 : 0)
      }
      if (y >= 8 && y <= 11 && (x <= 1 || x >= 6)) return y === 11 ? beltDark : pouch()
    }
    if (face === 'top' && y < 2) return beard(x, y, 36)
    if ((face === 'left' || face === 'right') && y >= 8 && y <= 10) return pouch()
    if (face === 'back' && y === 8) return belt()
    return null
  })

  const armPainter = (face, x, y) => {
    if (face === 'top') return flannel(x, y)
    if (face === 'bottom') return pick(r, skin)
    if (y <= 5) return flannel(x, y)
    if (y <= 7) return cuff(y)
    if (y === 11) return skinShade
    return pick(r, skin)
  }
  paintBox(cv, 40, 16, 4, 12, 4, armPainter)
  paintBox(cv, 32, 48, 4, 12, 4, armPainter)
  const sleeve = (face, x, y) => {
    if (face === 'top' || face === 'bottom') return null
    if (y === 6 || y === 7) return cuff(y)
    return null
  }
  paintBox(cv, 40, 32, 4, 12, 4, sleeve)
  paintBox(cv, 48, 48, 4, 12, 4, sleeve)

  const legPainter = (frontPatch, sidePatchFace) => (face, x, y) => {
    if (face === 'top') return jeans()
    if (face === 'bottom') return sole
    if (y === 11) return sole
    if (y === 10) return boot()
    if (y === 8 || y === 9) return jeansCuff()
    if (face === 'front' && frontPatch && y >= 2 && y <= 3 && x <= 2) return patch()
    if (face === sidePatchFace && y >= 1 && y <= 4 && x >= 1) return patch()
    return jeans()
  }
  paintBox(cv, 0, 16, 4, 12, 4, legPainter(true, 'right'))
  paintBox(cv, 16, 48, 4, 12, 4, legPainter(false, 'left'))
  const pants = (face, x, y) => {
    if (face === 'top' || face === 'bottom') return null
    if (y === 8 || y === 9) return jeansCuff()
    return null
  }
  paintBox(cv, 0, 32, 4, 12, 4, pants)
  paintBox(cv, 0, 48, 4, 12, 4, pants)

  writePng(cv, 'public/skin.png')
}

function makeSkeleton() {
  const cv = createCanvas(64, 32)
  const r = seeded(11)
  const bone = () => pick(r, ['#c9c9c4', '#bfbfba', '#d2d2cc'])
  const boneLight = '#e2e2dc'
  const boneDark = '#9b9b95'
  const socket = '#1e1e1e'
  const deep = '#0d0d0d'

  const skull = [
    'BBBBBBBB',
    'BLBBBBLB',
    'BBBBBBBB',
    'BSSBBSSB',
    'BSDBBDSB',
    'BBBNNBBB',
    'BTKTKTKB',
    'dBBBBBBd',
  ]
  paintBox(cv, 0, 0, 8, 8, 8, (face, x, y) => {
    if (face === 'front') {
      const ch = skull[y][x]
      return { B: bone(), L: boneLight, S: socket, D: deep, N: socket, T: boneLight, K: socket, d: boneDark }[ch]
    }
    if (face === 'bottom') return x > 1 && x < 6 && y > 1 && y < 6 ? socket : bone()
    if (r() > 0.92) return boneDark
    return bone()
  })

  paintBox(cv, 16, 16, 8, 12, 4, (face, x, y, fw) => {
    if (face === 'top') return x === 0 || x === fw - 1 || y === 0 || y === 3 ? bone() : null
    if (face === 'bottom') return x > 0 && x < fw - 1 ? boneDark : null
    if (face === 'front' || face === 'back') {
      if (x === 3 || x === 4) return y % 2 === 0 ? boneDark : bone()
      if (y === 0) return boneLight
      if (y >= 1 && y <= 7 && y % 2 === 1) return x === 0 || x === 7 ? boneDark : bone()
      if (y >= 9 && y <= 11 && x >= 1 && x <= 6) return y === 10 && (x === 2 || x === 5) ? null : bone()
      return null
    }
    if (y === 0) return boneLight
    if (y >= 1 && y <= 7 && y % 2 === 1) return bone()
    if (y >= 9 && y <= 10) return bone()
    return null
  })

  const limb = (face, x, y) => {
    if (face === 'top') return boneLight
    if (face === 'bottom') return boneDark
    if (y === 0 || y === 11) return boneLight
    if (y === 5 || y === 6) return boneDark
    return bone()
  }
  paintBox(cv, 40, 16, 2, 12, 2, limb)
  paintBox(cv, 0, 16, 2, 12, 2, limb)
  writePng(cv, 'public/textures/skeleton.png')
}

function makeCape() {
  const cv = createCanvas(64, 32)
  const r = seeded(21)
  paintBox(cv, 0, 0, 10, 16, 1, (face, x, y, fw, fh) => {
    if (x === 0 || x === fw - 1 || y === fh - 1) return '#6f7880'
    if (y === 0) return '#5d656d'
    if ((x + y) % 7 === 0) return '#aab3ba'
    return pick(r, ['#949da5', '#9aa3ab', '#8e979f'])
  })
  writePng(cv, 'public/textures/cape.png')
}

makeSkin()
makeSkeleton()
makeCape()
