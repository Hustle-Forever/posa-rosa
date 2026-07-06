// Regenerates favicons from the butterfly mark inside public/assets/logo/2.svg.
// Renders the SVG at 4096px in headless Chromium, auto-trims the butterfly glyph
// from a generous crop window, then exports square PNGs at all favicon sizes
// plus a PNG-based favicon.ico (16+32 embedded).
import { chromium } from '@playwright/test'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

const RENDER = 4096
const SVG = resolve('public/assets/logo/2.svg')
// Butterfly glyph window measured on a 1024px render, scaled ×4 with margin.
// Trimming below shrinks this to the exact glyph, so the margin is safe as
// long as no neighbouring letter enters the window.
const WINDOW = { x: 1548, y: 1560, w: 470, h: 530 }
const BLUSH = '#F2E4E4' // solid bg for apple-touch-icon (iOS blackens transparency)

// data: URL keeps the canvas untainted (file:// images would taint it)
const svgDataUrl = 'data:image/svg+xml;base64,' + readFileSync(SVG).toString('base64')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
await page.setContent(`<!doctype html><body style="margin:0"><img id="logo" src="${svgDataUrl}"></body>`)
await page.waitForFunction(() => {
  const el = document.getElementById('logo')
  return el.complete && el.naturalWidth > 0
})

const result = await page.evaluate(async ({ RENDER, WINDOW, BLUSH }) => {
  const img = document.getElementById('logo')

  // 0. Rasterize the SVG at RENDER px, replicating object-fit: contain so the
  // WINDOW coordinates (measured on a contain-fitted square preview) line up.
  // drawImage alone would sample the SVG's small intrinsic size.
  const big = document.createElement('canvas')
  big.width = RENDER
  big.height = RENDER
  const bctx = big.getContext('2d')
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  const fit = Math.min(RENDER / nw, RENDER / nh)
  bctx.drawImage(img, (RENDER - nw * fit) / 2, (RENDER - nh * fit) / 2, nw * fit, nh * fit)

  // 1. Draw the crop window
  const win = document.createElement('canvas')
  win.width = WINDOW.w
  win.height = WINDOW.h
  const wctx = win.getContext('2d')
  wctx.drawImage(big, WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, 0, 0, WINDOW.w, WINDOW.h)

  // 2. Tight bbox of non-background pixels (background sampled at top-left corner)
  const data = wctx.getImageData(0, 0, WINDOW.w, WINDOW.h).data
  const bg = [data[0], data[1], data[2]]
  const isInk = i =>
    Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 40
  let minX = WINDOW.w, minY = WINDOW.h, maxX = -1, maxY = -1
  for (let y = 0; y < WINDOW.h; y++) {
    for (let x = 0; x < WINDOW.w; x++) {
      if (isInk((y * WINDOW.w + x) * 4)) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { error: 'no glyph pixels found in crop window' }
  const gw = maxX - minX + 1
  const gh = maxY - minY + 1

  // 3. Butterfly on transparent, centered in a square master canvas
  const glyphMax = Math.max(gw, gh)
  const master = document.createElement('canvas')
  const M = 1024
  master.width = M
  master.height = M
  const mctx = master.getContext('2d')
  const scale = (M * 0.84) / glyphMax // glyph fills 84% of canvas
  const dw = gw * scale
  const dh = gh * scale
  mctx.imageSmoothingQuality = 'high'
  // Background pixels inside the glyph crop are blush, not transparent — so
  // re-draw ink only: use the window canvas but knock out background via
  // per-pixel alpha.
  const glyphData = wctx.getImageData(minX, minY, gw, gh)
  const gd = glyphData.data
  for (let i = 0; i < gd.length; i += 4) {
    const diff =
      Math.abs(gd[i] - bg[0]) + Math.abs(gd[i + 1] - bg[1]) + Math.abs(gd[i + 2] - bg[2])
    // soft edge: map color distance to alpha so anti-aliased edges stay smooth
    gd[i + 3] = Math.max(0, Math.min(255, Math.round((diff - 12) * 6)))
  }
  const glyphCanvas = document.createElement('canvas')
  glyphCanvas.width = gw
  glyphCanvas.height = gh
  glyphCanvas.getContext('2d').putImageData(glyphData, 0, 0)
  mctx.drawImage(glyphCanvas, (M - dw) / 2, (M - dh) / 2, dw, dh)

  // 4. Export helper — multi-step downscale for crisp small sizes
  function exportSize(size, background) {
    let src = master
    let cur = M
    while (cur / 2 > size) {
      const half = document.createElement('canvas')
      half.width = cur / 2
      half.height = cur / 2
      const hctx = half.getContext('2d')
      hctx.imageSmoothingQuality = 'high'
      hctx.drawImage(src, 0, 0, cur / 2, cur / 2)
      src = half
      cur = cur / 2
    }
    const out = document.createElement('canvas')
    out.width = size
    out.height = size
    const octx = out.getContext('2d')
    if (background) {
      octx.fillStyle = background
      octx.fillRect(0, 0, size, size)
    }
    octx.imageSmoothingQuality = 'high'
    octx.drawImage(src, 0, 0, size, size)
    return out.toDataURL('image/png')
  }

  return {
    'favicon-16.png': exportSize(16),
    'favicon-32.png': exportSize(32),
    'favicon-192.png': exportSize(192),
    'favicon-512.png': exportSize(512),
    'apple-touch-icon.png': exportSize(180, BLUSH),
    glyph: { gw, gh },
  }
}, { RENDER, WINDOW, BLUSH })

await browser.close()

if (result.error) {
  console.error(result.error)
  process.exit(1)
}
console.log('glyph bbox:', result.glyph)

const pngs = {}
for (const [name, dataUrl] of Object.entries(result)) {
  if (name === 'glyph') continue
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  pngs[name] = buf
  writeFileSync(resolve('public', name), buf)
  console.log('wrote public/' + name, buf.length, 'bytes')
}

// 5. favicon.ico — ICO container with PNG-encoded 16 + 32 entries
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)
  const dirSize = 16 * entries.length
  let offset = 6 + dirSize
  const dirs = []
  for (const { size, buf } of entries) {
    const d = Buffer.alloc(16)
    d.writeUInt8(size === 256 ? 0 : size, 0) // width
    d.writeUInt8(size === 256 ? 0 : size, 1) // height
    d.writeUInt8(0, 2)  // palette
    d.writeUInt8(0, 3)  // reserved
    d.writeUInt16LE(1, 4)  // planes
    d.writeUInt16LE(32, 6) // bpp
    d.writeUInt32LE(buf.length, 8)
    d.writeUInt32LE(offset, 12)
    offset += buf.length
    dirs.push(d)
  }
  return Buffer.concat([header, ...dirs, ...entries.map(e => e.buf)])
}

const ico = buildIco([
  { size: 16, buf: pngs['favicon-16.png'] },
  { size: 32, buf: pngs['favicon-32.png'] },
])
writeFileSync(resolve('public', 'favicon.ico'), ico)
console.log('wrote public/favicon.ico', ico.length, 'bytes')
