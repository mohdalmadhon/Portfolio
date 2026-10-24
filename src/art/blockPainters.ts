export type Painter = (ctx: CanvasRenderingContext2D, rand: () => number) => void

export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function noiseFill(ctx: CanvasRenderingContext2D, rand: () => number, colors: string[], size = 16) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)]
      ctx.fillRect(x, y, 1, 1)
    }
  }
}

function speckle(ctx: CanvasRenderingContext2D, rand: () => number, colors: string[], count: number, blob = 2) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * 15)
    const y = Math.floor(rand() * 15)
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)]
    ctx.fillRect(x, y, 1 + Math.floor(rand() * blob), 1 + Math.floor(rand() * blob))
  }
}

const GRASS = ['#5f9e3f', '#6aa94a', '#58923a', '#73b351', '#64a344']
const DIRT = ['#866043', '#79553a', '#8d6a4b', '#6f4e35', '#94704f']
const STONE = ['#7d7d7d', '#888888', '#727272', '#8f8f8f', '#7a7a7a']

export const painters: Record<string, Painter> = {
  grassTop: (c, r) => noiseFill(c, r, GRASS),
  dirt: (c, r) => noiseFill(c, r, DIRT),
  path: (c, r) => noiseFill(c, r, ['#9a7b4f', '#a7885a', '#8e7046', '#b0915f']),
  grassSide: (c, r) => {
    noiseFill(c, r, DIRT)
    for (let x = 0; x < 16; x++) {
      const depth = 3 + Math.floor(r() * 3)
      for (let y = 0; y < depth; y++) {
        c.fillStyle = GRASS[Math.floor(r() * GRASS.length)]
        c.fillRect(x, y, 1, 1)
      }
    }
  },
  stone: (c, r) => {
    noiseFill(c, r, STONE)
    speckle(c, r, ['#6a6a6a', '#9a9a9a'], 14)
  },
  cobble: (c, r) => {
    noiseFill(c, r, ['#6e6e6e', '#7c7c7c', '#626262'])
    c.fillStyle = '#4c4c4c'
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * 14)
      const y = Math.floor(r() * 14)
      c.fillRect(x, y, 3 + Math.floor(r() * 3), 1)
      c.fillRect(x, y, 1, 3)
    }
    speckle(c, r, ['#9b9b9b'], 8)
  },
  logSide: (c, r) => {
    for (let x = 0; x < 16; x++) {
      const col = ['#6b5232', '#5c4529', '#735a38', '#4e3a22'][x % 4 === 0 ? 3 : Math.floor(r() * 3)]
      for (let y = 0; y < 16; y++) {
        c.fillStyle = r() > 0.88 ? '#4a3620' : col
        c.fillRect(x, y, 1, 1)
      }
    }
  },
  logTop: (c, r) => {
    noiseFill(c, r, ['#a5834f', '#b08d58'])
    c.strokeStyle = '#8a6a3c'
    c.lineWidth = 1
    for (const s of [3, 6]) c.strokeRect(s + 0.5, s + 0.5, 15 - s * 2, 15 - s * 2)
    c.fillStyle = '#5c4529'
    c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1); c.fillRect(0, 0, 1, 16); c.fillRect(15, 0, 1, 16)
  },
  planks: (c, r) => {
    noiseFill(c, r, ['#b48a52', '#a8804b', '#bc935a'])
    c.fillStyle = '#7a5a33'
    for (const y of [3, 7, 11, 15]) c.fillRect(0, y, 16, 1)
    for (const [x, y] of [[4, 0], [11, 4], [2, 8], [9, 12]]) c.fillRect(x, y, 1, 3)
  },
  roof: (c, r) => {
    noiseFill(c, r, ['#5a3d24', '#523720', '#634329'])
    c.fillStyle = '#3a2614'
    for (const y of [3, 7, 11, 15]) c.fillRect(0, y, 16, 1)
    for (const [x, y] of [[6, 0], [13, 4], [3, 8], [10, 12]]) c.fillRect(x, y, 1, 3)
  },
  leaves: (c, r) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (r() < 0.16) continue
        c.fillStyle = ['#3f7d27', '#4a8c2f', '#356b20', '#55993a'][Math.floor(r() * 4)]
        c.fillRect(x, y, 1, 1)
      }
    }
  },
  obsidian: (c, r) => {
    noiseFill(c, r, ['#14101c', '#1b1526', '#100c17'])
    speckle(c, r, ['#3b2a5c', '#2b1f45', '#4a3473'], 18, 3)
  },
  diamondOre: (c, r) => {
    painters.stone(c, r)
    speckle(c, r, ['#5ff2e4', '#b7fff6', '#2bb5aa'], 10)
  },
  emeraldOre: (c, r) => {
    painters.stone(c, r)
    speckle(c, r, ['#17d46c', '#7dffb0', '#0f8c46'], 8)
  },
  goldOre: (c, r) => {
    painters.stone(c, r)
    speckle(c, r, ['#f6d04d', '#fff2a0', '#c99b23'], 9)
  },
  diamondBlock: (c, r) => {
    noiseFill(c, r, ['#62e8dd', '#75efe5', '#56d8cd'])
    c.fillStyle = '#c8fff9'
    c.fillRect(1, 1, 14, 1); c.fillRect(1, 1, 1, 14)
    c.fillStyle = '#2fa79d'
    c.fillRect(1, 14, 14, 1); c.fillRect(14, 1, 1, 14)
  },
  glowstone: (c, r) => {
    noiseFill(c, r, ['#d8a85a', '#f3cf7a', '#b57f3a', '#ffe6a3'])
    speckle(c, r, ['#fff6cf'], 10)
  },
  beacon: (c, r) => {
    noiseFill(c, r, ['#c6fff8', '#a8f4ec'])
    c.fillStyle = '#5ff2e4'
    c.fillRect(4, 4, 8, 8)
    c.fillStyle = '#ffffff'
    c.fillRect(6, 6, 4, 4)
  },
  glass: (c) => {
    c.clearRect(0, 0, 16, 16)
    c.fillStyle = 'rgba(210,240,255,0.95)'
    c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1); c.fillRect(0, 0, 1, 16); c.fillRect(15, 0, 1, 16)
    c.fillRect(3, 3, 1, 1); c.fillRect(4, 4, 1, 1); c.fillRect(5, 5, 1, 1); c.fillRect(11, 9, 1, 1)
  },
  craftTop: (c, r) => {
    painters.planks(c, r)
    c.fillStyle = '#4f3a20'
    c.fillRect(1, 1, 14, 1); c.fillRect(1, 14, 14, 1); c.fillRect(1, 1, 1, 14); c.fillRect(14, 1, 1, 14)
    c.fillRect(5, 1, 1, 14); c.fillRect(10, 1, 1, 14); c.fillRect(1, 5, 14, 1); c.fillRect(1, 10, 14, 1)
  },
  craftSide: (c, r) => {
    painters.planks(c, r)
    c.fillStyle = '#9fa8ad'
    c.fillRect(3, 4, 3, 7)
    c.fillStyle = '#6b4a2a'
    c.fillRect(10, 3, 2, 10)
    c.fillStyle = '#7f8a90'
    c.fillRect(8, 3, 6, 2)
  },
  furnaceFront: (c, r) => {
    painters.cobble(c, r)
    c.fillStyle = '#2a2a2a'
    c.fillRect(4, 8, 8, 5)
    c.fillStyle = '#f39a2b'
    c.fillRect(5, 10, 6, 3)
    c.fillStyle = '#ffd36b'
    c.fillRect(6, 11, 4, 2)
  },
  bookshelf: (c, r) => {
    painters.planks(c, r)
    const books = ['#8f2d2d', '#2d4f8f', '#2d8f4a', '#8f7a2d', '#5c2d8f', '#2d8f86']
    for (const row of [2, 9]) {
      let x = 1
      while (x < 15) {
        const w = 1 + Math.floor(r() * 2)
        c.fillStyle = books[Math.floor(r() * books.length)]
        c.fillRect(x, row, w, 5)
        x += w
      }
    }
  },
  chestSide: (c, r) => {
    noiseFill(c, r, ['#a8732f', '#9c6a2a', '#b07a34'])
    c.fillStyle = '#4a2e14'
    c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1); c.fillRect(0, 0, 1, 16); c.fillRect(15, 0, 1, 16)
    c.fillRect(0, 6, 16, 1)
  },
  chestFront: (c, r) => {
    painters.chestSide(c, r)
    c.fillStyle = '#e8c547'
    c.fillRect(7, 5, 2, 4)
    c.fillStyle = '#9a7b1f'
    c.fillRect(7, 8, 2, 1)
  },
  chestTop: (c, r) => {
    noiseFill(c, r, ['#a8732f', '#9c6a2a', '#b07a34'])
    c.fillStyle = '#4a2e14'
    c.fillRect(0, 0, 16, 1); c.fillRect(0, 15, 16, 1); c.fillRect(0, 0, 1, 16); c.fillRect(15, 0, 1, 16)
  },
  flowerRed: (c) => {
    c.clearRect(0, 0, 16, 16)
    c.fillStyle = '#3f8a2a'
    c.fillRect(7, 7, 2, 9)
    c.fillRect(5, 11, 2, 1)
    c.fillStyle = '#d92b2b'
    c.fillRect(6, 3, 4, 4)
    c.fillStyle = '#ff6b5b'
    c.fillRect(7, 4, 2, 2)
  },
  flowerYellow: (c) => {
    c.clearRect(0, 0, 16, 16)
    c.fillStyle = '#3f8a2a'
    c.fillRect(7, 8, 2, 8)
    c.fillStyle = '#f5d33b'
    c.fillRect(5, 4, 6, 5)
    c.fillStyle = '#c47a1a'
    c.fillRect(7, 6, 2, 2)
  },
  tallGrass: (c, r) => {
    c.clearRect(0, 0, 16, 16)
    for (let x = 1; x < 15; x += 2) {
      const h = 5 + Math.floor(r() * 9)
      c.fillStyle = GRASS[Math.floor(r() * GRASS.length)]
      c.fillRect(x, 16 - h, 1, h)
    }
  },
  torch: (c) => {
    c.clearRect(0, 0, 16, 16)
    c.fillStyle = '#6b4a2a'
    c.fillRect(7, 6, 2, 10)
    c.fillStyle = '#ffd36b'
    c.fillRect(7, 4, 2, 2)
    c.fillStyle = '#ff9b2b'
    c.fillRect(7, 6, 2, 1)
  },
  cloud: (c) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, 16, 16)
  },
}

export type BlockTextureName = keyof typeof painters

const cache = new Map<string, HTMLCanvasElement>()

export function seedOf(name: string): number {
  let seed = 0
  for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  return seed
}

export function paintCanvas(name: BlockTextureName): HTMLCanvasElement {
  const hit = cache.get(name)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d')!
  painters[name](ctx, rng(seedOf(name)))
  cache.set(name, canvas)
  return canvas
}

const DS = ['#4d4d52', '#45454a', '#55555a', '#3e3e43']

function border(c: CanvasRenderingContext2D, color: string) {
  c.fillStyle = color
  c.fillRect(0, 0, 16, 1)
  c.fillRect(0, 15, 16, 1)
  c.fillRect(0, 0, 1, 16)
  c.fillRect(15, 0, 1, 16)
}

Object.assign(painters, {
  deepslate: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, DS)
    c.fillStyle = '#38383d'
    for (let i = 0; i < 6; i++) c.fillRect(Math.floor(r() * 12), Math.floor(r() * 16), 3 + Math.floor(r() * 4), 1)
  },
  deepslateBricks: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#48484d', '#4f4f54', '#434348'])
    c.fillStyle = '#29292d'
    for (let row = 0; row < 4; row++) {
      const y = row * 4 + 3
      c.fillRect(0, y, 16, 1)
      const off = row % 2 ? 4 : 0
      for (let x = off; x < 16; x += 8) c.fillRect(x, row * 4, 1, 3)
    }
    c.fillStyle = '#5d5d63'
    for (let row = 0; row < 4; row++) c.fillRect(0, row * 4, 16, 1)
  },
  deepslateTiles: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#3d3d42', '#44444a', '#39393e'])
    c.fillStyle = '#26262a'
    for (let i = 0; i < 16; i += 4) {
      c.fillRect(0, i + 3, 16, 1)
      c.fillRect(i + 3, 0, 1, 16)
    }
    c.fillStyle = '#505056'
    for (let i = 0; i < 16; i += 4) c.fillRect(0, i, 16, 1)
  },
  polishedDeepslate: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#4a4a50', '#47474d', '#4e4e54'])
    border(c, '#36363b')
    c.fillStyle = '#5a5a60'
    c.fillRect(1, 1, 14, 1)
    c.fillRect(1, 1, 1, 14)
  },
  chiseledDeepslate: (c: CanvasRenderingContext2D, r: () => number) => {
    painters.polishedDeepslate(c, r)
    c.strokeStyle = '#2f2f34'
    c.lineWidth = 1
    c.strokeRect(3.5, 3.5, 9, 9)
    c.strokeRect(6.5, 6.5, 3, 3)
  },
  reinforced: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#353d40', '#3b4447', '#30383b'])
    border(c, '#1b2225')
    c.fillStyle = '#1b2225'
    c.fillRect(2, 2, 12, 1)
    c.fillRect(2, 13, 12, 1)
    c.fillStyle = '#5f7a72'
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) c.fillRect(x, y, 1, 1)
    c.fillStyle = '#2c9a92'
    c.fillRect(6, 6, 4, 4)
    c.fillStyle = '#7ff6ee'
    c.fillRect(7, 7, 2, 2)
  },
  sculk: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#0c1d24', '#0a1820', '#102830', '#0e222a'])
    speckle(c, r, ['#163f4c', '#1a4a5a'], 14, 3)
    for (let i = 0; i < 4; i++) {
      c.fillStyle = r() > 0.5 ? '#2fd2e6' : '#5ff2ff'
      c.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1)
    }
  },
  sculkCatalyst: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#c9c3a8', '#bdb79c', '#d3cdb2'])
    c.fillStyle = '#0c1d24'
    c.fillRect(0, 0, 16, 5)
    speckle(c, r, ['#102830', '#163f4c'], 6)
    c.fillStyle = '#2fd2e6'
    c.fillRect(6, 7, 4, 4)
    c.fillStyle = '#c6ffff'
    c.fillRect(7, 8, 2, 2)
  },
  soulLantern: (c: CanvasRenderingContext2D) => {
    c.fillStyle = '#2e3436'
    c.fillRect(0, 0, 16, 16)
    c.fillStyle = '#4ff0ff'
    c.fillRect(3, 3, 10, 10)
    c.fillStyle = '#c6ffff'
    c.fillRect(6, 5, 4, 6)
  },
  darkPlanks: (c: CanvasRenderingContext2D, r: () => number) => {
    noiseFill(c, r, ['#4a3020', '#42291b', '#553824'])
    c.fillStyle = '#2c1b10'
    for (const y of [3, 7, 11, 15]) c.fillRect(0, y, 16, 1)
    for (const [x, y] of [[5, 0], [12, 4], [3, 8], [10, 12]]) c.fillRect(x, y, 1, 3)
  },
  candle: (c: CanvasRenderingContext2D) => {
    c.clearRect(0, 0, 16, 16)
    c.fillStyle = '#d8d0bc'
    c.fillRect(7, 10, 2, 6)
    c.fillStyle = '#b9b09a'
    c.fillRect(8, 10, 1, 6)
    c.fillStyle = '#2a2a2a'
    c.fillRect(7, 9, 1, 1)
    c.fillStyle = '#ffb347'
    c.fillRect(7, 7, 1, 2)
    c.fillStyle = '#fff2b0'
    c.fillRect(7, 6, 1, 1)
  },
  sculkSprout: (c: CanvasRenderingContext2D, r: () => number) => {
    c.clearRect(0, 0, 16, 16)
    for (let x = 2; x < 15; x += 3) {
      const h = 3 + Math.floor(r() * 6)
      c.fillStyle = '#17485a'
      c.fillRect(x, 16 - h, 1, h)
      c.fillStyle = '#5ff2ff'
      c.fillRect(x, 16 - h, 1, 1)
    }
  },
})
