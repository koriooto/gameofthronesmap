// Оффлайн-генератор запечённой подложки рельефа.
// Открой /gen/terrain.html через vite — canvas отрисует мир 2000×1440
// в масштабе SS, результат экспортируется в window.__dataUrl (webp).

import { REGIONS } from '/src/data/regions.js'
import {
  ESSOS,
  SOTHORYOS,
  ISLANDS,
  RIDGE_CHAINS,
  smoothClosed,
} from '/src/map/shapes.js'

const W = 2000
const H = 1440
const SS = 3 // суперсэмплинг подложки

// ── шум ──
const hash = (x, y) => {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
const smoothstep = (t) => t * t * (3 - 2 * t)
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  const u = smoothstep(xf), v = smoothstep(yf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x, y, oct = 4) {
  let s = 0, amp = 0.5, f = 1
  for (let i = 0; i < oct; i++) { s += amp * vnoise(x * f, y * f); amp *= 0.5; f *= 2 }
  return s
}

const CHAINS = RIDGE_CHAINS

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const l2 = dx * dx + dy * dy || 1
  let t = ((px - ax) * dx + (py - ay) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  const qx = ax + t * dx, qy = ay + t * dy
  return Math.hypot(px - qx, py - qy)
}

// ── высотная карта (в мировом разрешении) ──
console.time('height')
const height = new Float32Array(W * H)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let h = 0
    for (const c of CHAINS) {
      let d = 1e9
      for (let i = 0; i < c.pts.length - 1; i++) {
        const [ax, ay] = c.pts[i], [bx, by] = c.pts[i + 1]
        d = Math.min(d, distToSeg(x, y, ax, ay, bx, by))
      }
      if (d < c.w * 3.2) {
        const ridge = 0.72 + 0.55 * fbm(x * 0.045, y * 0.045, 3)
        h += c.h * Math.exp(-(d * d) / (c.w * c.w * 0.55)) * ridge
      }
    }
    h += 0.14 * fbm(x * 0.008, y * 0.008, 4) // пологие холмы
    height[y * W + x] = h
  }
}
console.timeEnd('height')

// ── маски: суша, регионы, биомы ──
const maskCv = document.createElement('canvas')
maskCv.width = W; maskCv.height = H
const mc = maskCv.getContext('2d', { willReadFrequently: true })

const regionPath = (r) => new Path2D(smoothClosed(r.polygon))
const essosPath = new Path2D(ESSOS)
const sothPath = new Path2D(SOTHORYOS)
const islandPaths = ISLANDS.map(([cx, cy, rx, ry, rot]) => {
  const p = new Path2D()
  p.ellipse(cx, cy, rx, ry, ((rot || 0) * Math.PI) / 180, 0, 7)
  return p
})

// код региона (для снега/пустыни): r-канал
const CODE = { beyond: 40, dorne: 80 }
mc.fillStyle = 'rgb(20,0,0)'
mc.fill(essosPath); mc.fill(sothPath)
for (const p of islandPaths) mc.fill(p)
for (const [key, r] of Object.entries(REGIONS)) {
  if (!r.polygon) continue
  mc.fillStyle = `rgb(${CODE[key] || 20},0,0)`
  mc.fill(regionPath(r))
}
// Красная пустошь как пустынная зона Эссоса
mc.save(); mc.clip(essosPath)
mc.fillStyle = 'rgb(80,0,0)'
mc.beginPath(); mc.ellipse(1420, 860, 150, 90, 0, 0, 7); mc.fill()
mc.restore()
const idData = mc.getImageData(0, 0, W, H).data

// цвет биомов (размытый)
const bioCv = document.createElement('canvas')
bioCv.width = W; bioCv.height = H
const bc = bioCv.getContext('2d', { willReadFrequently: true })
// Пергаментная палитра в духе старых печатных атласов: бумага + лёгкие
// региональные оттенки, вся «графика» рельефа — векторным слоем сверху.
const WCOLORS = {
  beyond: '#eceee6', north: '#ded8c2', vale: '#dcd8c0', ironislands: '#d8d3bc',
  riverlands: '#dcd9b2', westerlands: '#ddd2ae', crownlands: '#ded8b0',
  stormlands: '#d5d4ae', reach: '#dcdaa8', dorne: '#e7d5a2',
}
bc.fillStyle = '#dcd6b2'
bc.fill(essosPath)
bc.fillStyle = '#ccd2a2'
bc.fill(sothPath)
for (const p of islandPaths) { bc.fillStyle = '#dad5b2'; bc.fill(p) }
for (const [key, r] of Object.entries(REGIONS)) {
  if (!r.polygon) continue
  bc.fillStyle = WCOLORS[key] || '#b3bfa0'
  bc.fill(regionPath(r))
}
// зоны Эссоса поверх, мягкими пятнами
bc.save(); bc.clip(essosPath)
const blob = (x, y, rx, ry, color) => {
  const g = bc.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry))
  g.addColorStop(0, color); g.addColorStop(1, color + '00')
  bc.fillStyle = g
  bc.beginPath(); bc.ellipse(x, y, rx * 1.4, ry * 1.4, 0, 0, 7); bc.fill()
}
blob(820, 700, 260, 320, '#d5d6ab')   // Вольные города
blob(1250, 580, 330, 260, '#e0d9a8')  // Дотракийское море
blob(1420, 870, 190, 120, '#e8d3a0')  // Красная пустошь
blob(1650, 930, 220, 140, '#d3d7a6')  // Йи Ти
blob(1840, 1040, 130, 130, '#c9c6b4') // Тенистые земли
blob(1250, 350, 420, 120, '#dcd8ba')  // северные степи
blob(1050, 640, 130, 110, '#c4cf9c')  // лес Квохора
bc.restore()
// размытие для мягких переходов
const bio2 = document.createElement('canvas')
bio2.width = W; bio2.height = H
const b2 = bio2.getContext('2d', { willReadFrequently: true })
b2.filter = 'blur(9px)'
b2.drawImage(bioCv, 0, 0)
const bioData = b2.getImageData(0, 0, W, H).data

// размытая маска суши — мелководье у берегов
const shal = document.createElement('canvas')
shal.width = W; shal.height = H
const sc = shal.getContext('2d', { willReadFrequently: true })
sc.filter = 'blur(16px)'
sc.drawImage(maskCv, 0, 0)
const shalData = sc.getImageData(0, 0, W, H).data

// билинейная выборка размытой маски суши — для гладких контурных
// линий отмелей (иначе кольца получаются ступенчатыми)
const shAt = (x, y) => {
  const xi = Math.max(0, Math.min(W - 2, Math.floor(x)))
  const yi = Math.max(0, Math.min(H - 2, Math.floor(y)))
  const xf = x - xi, yf = y - yi
  const i = (yi * W + xi) * 4
  const a = shalData[i], b = shalData[i + 4], c = shalData[i + W * 4], d = shalData[i + W * 4 + 4]
  return (a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf) / 255
}

// ── итоговый рендер ──
console.time('render')
const out = document.getElementById('out')
out.width = W * SS; out.height = H * SS
const ctx = out.getContext('2d')
const img = ctx.createImageData(W * SS, H * SS)
const px = img.data

const hAt = (x, y) => {
  const xi = Math.max(0, Math.min(W - 2, Math.floor(x)))
  const yi = Math.max(0, Math.min(H - 2, Math.floor(y)))
  const xf = x - xi, yf = y - yi
  const i = yi * W + xi
  const a = height[i], b = height[i + 1], c = height[i + W], d = height[i + W + 1]
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
}

const LX = -0.62, LY = -0.78 // свет с северо-запада
for (let sy = 0; sy < H * SS; sy++) {
  const wy = sy / SS
  for (let sx = 0; sx < W * SS; sx++) {
    const wx = sx / SS
    const o = (sy * W * SS + sx) * 4
    const mi = (Math.min(H - 1, Math.round(wy)) * W + Math.min(W - 1, Math.round(wx))) * 4
    const land = idData[mi] > 0
    if (!land) {
      // море: приглушённый пергаментный тон + контурные линии отмелей,
      // повторяющие берег (как на старых печатных картах)
      const sh = shAt(wx, wy)
      const wv = fbm(wx * 0.02, wy * 0.02, 3)
      let r = 154 + sh * 52 + wv * 8
      let g = 178 + sh * 40 + wv * 8
      let b = 179 + sh * 32 + wv * 6
      const dline = Math.min(
        Math.abs(sh - 0.52), Math.abs(sh - 0.26), Math.abs(sh - 0.11),
      )
      const line = Math.max(0, 1 - dline / 0.016)
      r -= line * 24; g -= line * 20; b -= line * 14
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255
      continue
    }
    const code = idData[mi]
    const h = hAt(wx, wy)
    // градиент высоты → затенение
    const e = 1.2
    const gx = (hAt(wx + e, wy) - hAt(wx - e, wy)) / (2 * e)
    const gy = (hAt(wx, wy + e) - hAt(wx, wy - e)) / (2 * e)
    // затенение едва заметное: основную графику гор даёт векторный слой
    let shade = 0.965 + (gx * LX + gy * LY) * 3
    shade = Math.max(0.86, Math.min(1.06, shade))
    // базовый цвет биома
    let r = bioData[mi], g = bioData[mi + 1], b = bioData[mi + 2]
    // пустыни: дюнная штриховка
    if (code === 80) {
      const dune = Math.sin((wx + wy * 0.35) * 0.55 + fbm(wx * 0.02, wy * 0.02, 2) * 6) * 0.5 + 0.5
      r += dune * 12 - 4; g += dune * 9 - 4; b += dune * 5 - 4
    }
    // предгорья: едва заметное тёплое тонирование бумаги под хребтами
    if (h > 0.55) {
      const t = Math.min(1, (h - 0.55) / 0.4)
      r = r + (208 - r) * t * 0.35; g = g + (190 - g) * t * 0.35; b = b + (158 - b) * t * 0.35
    }
    // снежность крайнего севера
    if (code === 40) {
      const t = Math.max(0, 1 - wy / 240)
      r = r + (242 - r) * t * 0.8; g = g + (244 - g) * t * 0.8; b = b + (244 - b) * t * 0.8
    }
    // зерно бумаги — мелкое и сдержанное
    const gAmp = 10 + Math.min(1.2, h) * 10
    const grain = fbm(wx * 0.11, wy * 0.11, 3) * gAmp - gAmp / 2
    r = (r + grain) * shade; g = (g + grain) * shade; b = (b + grain) * shade
    px[o] = Math.max(0, Math.min(255, r))
    px[o + 1] = Math.max(0, Math.min(255, g))
    px[o + 2] = Math.max(0, Math.min(255, b))
    px[o + 3] = 255
  }
}
ctx.putImageData(img, 0, 0)
console.timeEnd('render')


window.__dataUrl = out.toDataURL('image/webp', 0.86)
document.title = 'DONE'
console.log('terrain ready, bytes≈', Math.round(window.__dataUrl.length * 0.75))
