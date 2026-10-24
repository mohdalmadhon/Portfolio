import { paintCanvas, type BlockTextureName } from './blockPainters'

const cache = new Map<string, string>()

export function isoBlockUrl(key: string, faces: { top: string; left: string; right: string }): string {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const ctx = c.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingEnabled = false
  const draw = (name: string, t: [number, number, number, number, number, number], shade: number) => {
    ctx.setTransform(...t)
    ctx.drawImage(paintCanvas(name as BlockTextureName), 0, 0)
    if (shade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${shade})`
      ctx.fillRect(0, 0, 16, 16)
    }
  }
  draw(faces.top, [2, 1, -2, 1, 32, 0], 0)
  draw(faces.left, [2, 1, 0, 2, 0, 16], 0.22)
  draw(faces.right, [2, -1, 0, 2, 32, 32], 0.4)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const url = c.toDataURL('image/png')
  cache.set(key, url)
  return url
}
