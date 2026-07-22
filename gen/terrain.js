// Оффлайн-генератор запечённой подложки рельефа.
// Открой /gen/terrain.html через vite — canvas отрисует мир 2000×1440
// в масштабе SS, результат экспортируется в window.__dataUrl (webp).

import { REGIONS } from '/src/data/regions.js'
import {
  ESSOS,
  SOTHORYOS,
  ISLANDS,
  RIVERS,
  LAKES,
  ISLE_OF_FACES,
  FORESTS,
  smoothClosed,
} from '/src/map/shapes.js'

const W = 2000
const H = 1440
const SS = 2.5 // суперсэмплинг подложки

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

// ── горные цепи: [точки полилинии], ширина, высота ──
const CHAINS = [
  // Вестерос
  { pts: [[185, 155], [240, 118], [300, 112], [345, 118]], w: 34, h: 1.0 }, // Клыки Мороза
  { pts: [[165, 260], [195, 290]], w: 22, h: 0.55 },
  { pts: [[498, 268], [535, 315], [545, 355]], w: 24, h: 0.6 }, // северные горы
  { pts: [[452, 648], [468, 688], [488, 726], [505, 752]], w: 30, h: 0.95 }, // Лунные горы
  { pts: [[352, 1092], [400, 1098], [445, 1092], [470, 1108]], w: 30, h: 0.85 }, // Красные горы
  { pts: [[300, 785], [275, 815], [255, 845]], w: 22, h: 0.45 }, // холмы Запада
  { pts: [[220, 900], [240, 930]], w: 16, h: 0.3 },
  // Эссос
  { pts: [[855, 535], [900, 558], [925, 585]], w: 24, h: 0.5 }, // холмы Норвоса
  { pts: [[1398, 400], [1392, 480], [1400, 560], [1392, 645]], w: 34, h: 1.05 }, // Кости
  { pts: [[1085, 935], [1115, 985], [1130, 1030]], w: 24, h: 0.65 }, // Валирия
  { pts: [[1770, 1025], [1815, 985], [1855, 950]], w: 26, h: 0.8 }, // горы Асшая
  { pts: [[1390, 245], [1445, 252], [1480, 262]], w: 18, h: 0.5 }, // Иб
  { pts: [[1330, 540], [1345, 548]], w: 14, h: 0.5 }, // Матерь Гор
  { pts: [[750, 505], [790, 535]], w: 18, h: 0.4 }, // Бархатные холмы
  { pts: [[795, 425], [835, 445]], w: 18, h: 0.35 }, // холмы Андалоса
  { pts: [[1392, 645], [1400, 700]], w: 26, h: 0.7 }, // Кости южнее
  { pts: [[280, 90], [330, 75]], w: 20, h: 0.6 }, // север Клыков
  { pts: [[560, 630], [580, 648]], w: 12, h: 0.35 }, // холмы Перстов
  { pts: [[292, 782], [300, 792]], w: 10, h: 0.4 }, // Золотой Зуб
  { pts: [[452, 1108], [485, 1122], [505, 1118]], w: 20, h: 0.55 }, // Костяной Путь
  { pts: [[598, 292], [606, 300]], w: 12, h: 0.45 }, // Скагос
  { pts: [[790, 900], [815, 925]], w: 16, h: 0.3 }, // Спорные холмы
  // Соториос и Ленг
  { pts: [[1130, 1250], [1190, 1300], [1160, 1350]], w: 30, h: 0.55 },
  { pts: [[1240, 1230], [1290, 1290]], w: 26, h: 0.45 },
  { pts: [[1688, 1050], [1694, 1090]], w: 12, h: 0.35 },
]

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
const WCOLORS = {
  beyond: '#e6ebee', north: '#b5c2b1', vale: '#adc0b4', ironislands: '#a9b4a3',
  riverlands: '#a8c48d', westerlands: '#c8b489', crownlands: '#b4bd90',
  stormlands: '#96b183', reach: '#a9c77f', dorne: '#ddc48d',
}
bc.fillStyle = '#b3bfa0'
bc.fill(essosPath)
bc.fillStyle = '#8fae72'
bc.fill(sothPath)
for (const p of islandPaths) { bc.fillStyle = '#b3bda0'; bc.fill(p) }
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
blob(820, 700, 260, 320, '#9dbb85')   // Вольные города
blob(1250, 580, 330, 260, '#c3c491')  // Дотракийское море
blob(1420, 870, 190, 120, '#dcc189')  // Красная пустошь
blob(1650, 930, 220, 140, '#a3bd85')  // Йи Ти
blob(1840, 1040, 130, 130, '#9a9a90') // Тенистые земли
blob(1250, 350, 420, 120, '#b9c2a8')  // северные степи
blob(1050, 640, 130, 110, '#7fa06b')  // лес Квохора
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
sc.filter = 'blur(14px)'
sc.drawImage(maskCv, 0, 0)
const shalData = sc.getImageData(0, 0, W, H).data

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
      // море: глубина + мелководье + лёгкая рябь
      const sh = shalData[mi] / 255
      const wv = fbm(wx * 0.02, wy * 0.02, 3)
      let r = 132 + sh * 68 + wv * 10
      let g = 168 + sh * 52 + wv * 10
      let b = 176 + sh * 42 + wv * 8
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255
      continue
    }
    const code = idData[mi]
    const h = hAt(wx, wy)
    // градиент высоты → затенение
    const e = 1.2
    const gx = (hAt(wx + e, wy) - hAt(wx - e, wy)) / (2 * e)
    const gy = (hAt(wx, wy + e) - hAt(wx, wy - e)) / (2 * e)
    let shade = 0.86 + (gx * LX + gy * LY) * 9
    shade = Math.max(0.55, Math.min(1.22, shade))
    // базовый цвет биома
    let r = bioData[mi], g = bioData[mi + 1], b = bioData[mi + 2]
    // пустыни: дюнная штриховка
    if (code === 80) {
      const dune = Math.sin((wx + wy * 0.35) * 0.55 + fbm(wx * 0.02, wy * 0.02, 2) * 6) * 0.5 + 0.5
      r += dune * 14 - 4; g += dune * 10 - 4; b += dune * 6 - 4
    }
    // скалы и снежные шапки
    const lat = wy / H
    if (h > 0.52) {
      const t = Math.min(1, (h - 0.52) / 0.3)
      r = r + (150 - r) * t; g = g + (132 - g) * t; b = b + (108 - b) * t
    }
    if (h > 0.88 || (code === 40 && h > 0.34)) {
      const t = Math.min(1, (h - (code === 40 ? 0.34 : 0.88)) / 0.2)
      r = r + (246 - r) * t; g = g + (247 - g) * t; b = b + (244 - b) * t
    }
    // снежность крайнего севера
    if (code === 40) {
      const t = Math.max(0, 1 - wy / 240)
      r = r + (240 - r) * t * 0.8; g = g + (242 - g) * t * 0.8; b = b + (244 - b) * t * 0.8
    }
    // зерно
    const grain = fbm(wx * 0.11, wy * 0.11, 3) * 18 - 9
    r = (r + grain) * shade; g = (g + grain) * shade; b = (b + grain) * shade
    px[o] = Math.max(0, Math.min(255, r))
    px[o + 1] = Math.max(0, Math.min(255, g))
    px[o + 2] = Math.max(0, Math.min(255, b))
    px[o + 3] = 255
  }
}
ctx.putImageData(img, 0, 0)
console.timeEnd('render')

// ── векторные детали поверх: берега, реки, озёра, леса ──
ctx.save()
ctx.scale(SS, SS)
ctx.lineJoin = 'round'

// контур берега
ctx.strokeStyle = 'rgba(84,66,42,0.85)'
ctx.lineWidth = 1.4
ctx.stroke(essosPath); ctx.stroke(sothPath)
for (const p of islandPaths) ctx.stroke(p)
for (const r of Object.values(REGIONS)) if (r.polygon) ctx.stroke(regionPath(r))

// реки с сужением к истоку (первая точка пути — исток)
for (const d of RIVERS) {
  const path = new Path2D(d)
  ctx.strokeStyle = 'rgba(210,228,232,0.5)'
  ctx.lineWidth = 4.0
  ctx.lineCap = 'round'
  ctx.stroke(path)
}
for (const d of RIVERS) {
  const path = new Path2D(d)
  ctx.strokeStyle = '#5d8fa6'
  ctx.lineWidth = 2
  ctx.stroke(path)
}
for (const [cx, cy, rx, ry] of LAKES) {
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7)
  ctx.fillStyle = '#8fb9c4'; ctx.fill()
  ctx.strokeStyle = '#5d8fa6'; ctx.lineWidth = 1.2; ctx.stroke()
}
ctx.beginPath()
ctx.ellipse(ISLE_OF_FACES[0], ISLE_OF_FACES[1], ISLE_OF_FACES[2], ISLE_OF_FACES[3], 0, 0, 7)
ctx.fillStyle = '#a9bb8a'; ctx.fill()

// леса: россыпь деревьев в пятнах
const treeType = (cx, cy) => {
  if (cy < 700) return 'conifer'
  if (cy > 1180) return 'palm'
  if (cx > 1000 && cy > 1150) return 'jungle'
  return 'decid'
}
for (const [cx, cy, rad] of FORESTS) {
  const type = treeType(cx, cy)
  const count = Math.round(rad * rad * 0.07)
  for (let i = 0; i < count; i++) {
    const a = hash(i, cx) * Math.PI * 2
    const rr = Math.sqrt(hash(cx + i, cy)) * rad * 0.92
    const tx = cx + Math.cos(a) * rr
    const ty = cy + Math.sin(a) * rr * 0.85
    const s = 2.6 + hash(i, ty) * 1.8
    // тень
    ctx.fillStyle = 'rgba(60,70,50,0.28)'
    ctx.beginPath(); ctx.ellipse(tx + 1, ty + s * 0.7, s * 0.8, s * 0.35, 0, 0, 7); ctx.fill()
    if (type === 'conifer') {
      ctx.fillStyle = '#4d6a46'
      ctx.beginPath()
      ctx.moveTo(tx, ty - s * 1.7); ctx.lineTo(tx - s * 0.7, ty + s * 0.5); ctx.lineTo(tx + s * 0.7, ty + s * 0.5)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = '#3c5438'; ctx.lineWidth = 0.4; ctx.stroke()
    } else if (type === 'jungle' || type === 'palm') {
      ctx.fillStyle = type === 'palm' ? '#5b8248' : '#3f6b3c'
      ctx.beginPath(); ctx.ellipse(tx, ty - s * 0.4, s * 0.9, s * 0.65, 0, 0, 7); ctx.fill()
    } else {
      ctx.fillStyle = '#5d7f4a'
      ctx.beginPath(); ctx.arc(tx, ty - s * 0.5, s * 0.75, 0, 7); ctx.fill()
      ctx.strokeStyle = '#48633a'; ctx.lineWidth = 0.4; ctx.stroke()
    }
  }
}
ctx.restore()

window.__dataUrl = out.toDataURL('image/webp', 0.82)
document.title = 'DONE'
console.log('terrain ready, bytes≈', Math.round(window.__dataUrl.length * 0.75))
