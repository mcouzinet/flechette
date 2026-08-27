// Generates every Stonk brand asset from the "S." mark (Anton glyph → vector
// path via opentype.js, so no font is needed at raster time) with sharp:
//   assets/icon-only|icon-foreground|icon-background.png  (→ capacitor-assets)
//   assets/splash|splash-dark.png                          (matching launch screen)
//   public/favicon.svg|apple-touch-icon.png|favicon-96x96.png|favicon.ico
// Then run `npx capacitor-assets generate`.
import opentype from 'opentype.js'
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const C = { bgTop: '#22342c', bg: '#15211b', cream: '#f1e6cb', gold: '#ecc66a' }
const _buf = readFileSync(join(root, 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff'))
const font = opentype.parse(_buf.buffer.slice(_buf.byteOffset, _buf.byteOffset + _buf.byteLength))

const bgRect = (n) => `<defs><radialGradient id="g" cx="50%" cy="-4%" r="120%">
    <stop offset="0%" stop-color="${C.bgTop}"/><stop offset="68%" stop-color="${C.bg}"/>
  </radialGradient></defs><rect width="${n}" height="${n}" fill="url(#g)"/>`

// Geometry of the "S ." mark: S of height visH, centred at cyFrac, gold dot after it.
function markGeom(canvas, visH, cyFrac) {
  const probe = font.getPath('S', 0, 0, 1000).getBoundingBox()
  const fontSize = 1000 * visH / (probe.y2 - probe.y1)
  const path = font.getPath('S', 0, 0, fontSize)
  const bb = path.getBoundingBox()
  const gW = bb.x2 - bb.x1, gH = bb.y2 - bb.y1
  const dotD = visH * 0.24, gap = visH * 0.05
  const gx = (canvas - (gW + gap + dotD)) / 2
  const top = canvas * cyFrac - gH / 2
  return {
    svg: `<g transform="translate(${(gx - bb.x1).toFixed(2)},${(top - bb.y1).toFixed(2)})"><path d="${path.toPathData(2)}" fill="${C.cream}"/></g>
      <circle cx="${(gx + gW + gap + dotD / 2).toFixed(2)}" cy="${(top + gH - dotD / 2 - visH * 0.02).toFixed(2)}" r="${(dotD / 2).toFixed(2)}" fill="${C.gold}"/>`,
    bottom: top + gH,
  }
}

// Word "STONK" as a centred path, its top at y=topY.
function wordSVG(canvas, fontSize, topY) {
  const p = font.getPath('STONK', 0, 0, fontSize)
  const b = p.getBoundingBox()
  const x = (canvas - (b.x2 - b.x1)) / 2 - b.x1
  return `<g transform="translate(${x.toFixed(2)},${(topY - b.y1).toFixed(2)})"><path d="${p.toPathData(2)}" fill="${C.cream}" opacity="0.9"/></g>`
}

function iconSVG({ canvas = 1024, visH = 540, bg = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}">${bg ? bgRect(canvas) : ''}${markGeom(canvas, visH, 0.475).svg}</svg>`
}

function splashSVG() {
  const n = 2732
  const m = markGeom(n, 660, 0.42)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}">${bgRect(n)}${m.svg}${wordSVG(n, 190, m.bottom + n * 0.05)}</svg>`
}

const png = (svg) => sharp(Buffer.from(svg)).png()

function pngToIco(pngBuffer, size) {
  const h = Buffer.alloc(6); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4)
  const e = Buffer.alloc(16)
  e.writeUInt8(size >= 256 ? 0 : size, 0); e.writeUInt8(size >= 256 ? 0 : size, 1)
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6)
  e.writeUInt32LE(pngBuffer.length, 8); e.writeUInt32LE(22, 12)
  return Buffer.concat([h, e, pngBuffer])
}

// ---- app icon sources (→ capacitor-assets) ----
await png(iconSVG({ visH: 540, bg: true })).toFile(join(root, 'assets/icon-only.png'))
await png(iconSVG({ visH: 380, bg: false })).toFile(join(root, 'assets/icon-foreground.png'))
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${bgRect(1024)}</svg>`).toFile(join(root, 'assets/icon-background.png'))

// ---- matching splash (light + dark identical: the app is dark) ----
const splash = splashSVG()
await png(splash).toFile(join(root, 'assets/splash.png'))
await png(splash).toFile(join(root, 'assets/splash-dark.png'))

// ---- web favicons ----
const favSvg = iconSVG({ visH: 540, bg: true })
writeFileSync(join(root, 'public/favicon.svg'), favSvg)
await png(favSvg).resize(180, 180).toFile(join(root, 'public/apple-touch-icon.png'))
await png(favSvg).resize(96, 96).toFile(join(root, 'public/favicon-96x96.png'))
const ico = await png(favSvg).resize(48, 48).toBuffer()
writeFileSync(join(root, 'public/favicon.ico'), pngToIco(ico, 48))

console.log('✓ icons + splash + favicons regenerated')
