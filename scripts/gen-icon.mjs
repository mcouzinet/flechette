// Generates the Stonk app-icon sources from the "S." mark (Anton glyph → vector
// path via opentype.js, so no font resolution is needed at raster time) and
// rasterises them with sharp. Then run `npx capacitor-assets generate`.
import opentype from 'opentype.js'
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const C = { bgTop: '#22342c', bg: '#15211b', cream: '#f1e6cb', gold: '#ecc66a' }
const _buf = readFileSync(join(root, 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff'))
const font = opentype.parse(_buf.buffer.slice(_buf.byteOffset, _buf.byteOffset + _buf.byteLength))

const SIZE = 1024

// Build the "S ." mark centred in a SIZE canvas. `visH` = target S height (px),
// `bg` = draw the gradient background, `letter`/`dotColor` overridable.
function markSVG({ visH = 540, bg = true, letter = C.cream, dotColor = C.gold } = {}) {
  // font size that makes the glyph exactly visH tall
  const probe = font.getPath('S', 0, 0, 1000).getBoundingBox()
  const fontSize = 1000 * visH / (probe.y2 - probe.y1)
  const path = font.getPath('S', 0, 0, fontSize)
  const bb = path.getBoundingBox()
  const gW = bb.x2 - bb.x1
  const gH = bb.y2 - bb.y1

  const dotD = visH * 0.24
  const gap = visH * 0.05
  const groupW = gW + gap + dotD
  const gx = (SIZE - groupW) / 2
  const top = SIZE * 0.475 - gH / 2

  const tx = gx - bb.x1
  const ty = top - bb.y1
  const baseline = top + gH
  const dotCx = gx + gW + gap + dotD / 2
  const dotCy = baseline - dotD / 2 - visH * 0.02

  const d = path.toPathData(2)
  const bgLayer = bg
    ? `<defs><radialGradient id="g" cx="50%" cy="-4%" r="120%">
         <stop offset="0%" stop-color="${C.bgTop}"/>
         <stop offset="68%" stop-color="${C.bg}"/>
       </radialGradient></defs>
       <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    ${bgLayer}
    <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)})"><path d="${d}" fill="${letter}"/></g>
    <circle cx="${dotCx.toFixed(2)}" cy="${dotCy.toFixed(2)}" r="${(dotD / 2).toFixed(2)}" fill="${dotColor}"/>
  </svg>`
}

const png = (svg) => sharp(Buffer.from(svg)).png()

// icon-only: full-bleed square (iOS masks the corners itself)
await png(markSVG({ visH: 540, bg: true })).toFile(join(root, 'assets/icon-only.png'))
// android adaptive: foreground = mark inside the ~66% safe zone, transparent bg
await png(markSVG({ visH: 380, bg: false })).toFile(join(root, 'assets/icon-foreground.png'))
// android adaptive: background = flat gradient, no mark
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs><radialGradient id="g" cx="50%" cy="-4%" r="120%">
    <stop offset="0%" stop-color="${C.bgTop}"/><stop offset="68%" stop-color="${C.bg}"/>
  </radialGradient></defs><rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/></svg>`)
  .toFile(join(root, 'assets/icon-background.png'))

// web favicons + apple-touch (same full-bleed mark)
const iconSvg = markSVG({ visH: 540, bg: true })
writeFileSync(join(root, 'public/favicon.svg'), iconSvg)
await png(iconSvg).resize(180, 180).toFile(join(root, 'public/apple-touch-icon.png'))
await png(iconSvg).resize(96, 96).toFile(join(root, 'public/favicon-96x96.png'))

console.log('✓ assets/{icon-only,icon-foreground,icon-background}.png + public/{favicon.svg,apple-touch-icon.png,favicon-96x96.png}')
