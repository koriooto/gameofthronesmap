// Контуры Вестероса из полигонов регионов — без двойных линий.
//
// Проблема: каждый регион сглаживается Катмуллом — Ромом по отдельности,
// поэтому общая граница двух соседей даёт две чуть разные кривые —
// у стыков они расходятся и пересекаются «линзами». Здесь каждое ребро
// рисуется ровно один раз: рёбра, входящие в два полигона, — внутренние
// границы; рёбра одного полигона — берег, склеенный в замкнутый контур.

import { REGIONS } from '../data/regions.js'

const key = (p) => `${p[0]},${p[1]}`
const ekey = (a, b) => (key(a) < key(b) ? `${key(a)}|${key(b)}` : `${key(b)}|${key(a)}`)

// Открытая кривая Катмулла — Рома: проходит точно через концы,
// поэтому цепочки границ сходятся в стыках без зазоров.
function smoothOpen(pts, tension = 0.9) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}

function smoothLoop(pts, tension = 0.9) {
  const n = pts.length
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d + 'Z'
}

const built = (() => {
  const polys = Object.values(REGIONS)
    .filter((r) => r.polygon)
    .map((r) => r.polygon)

  // сколько полигонов делят каждое ребро
  const count = new Map()
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const k = ekey(a, b)
      count.set(k, (count.get(k) || 0) + 1)
    }
  }

  // ── берег: направленные рёбра из одного полигона, склеенные в циклы ──
  const nextMap = new Map() // key(a) -> {a, b}
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      if (count.get(ekey(a, b)) === 1) nextMap.set(key(a), { a, b })
    }
  }
  const loops = []
  const usedStart = new Set()
  for (const [startKey, e0] of nextMap) {
    if (usedStart.has(startKey)) continue
    const pts = []
    let cur = e0
    while (cur) {
      usedStart.add(key(cur.a))
      pts.push(cur.a)
      if (key(cur.b) === key(e0.a)) break
      cur = nextMap.get(key(cur.b))
    }
    if (pts.length > 2) loops.push(pts)
  }

  // ── внутренние границы: цепочки общих рёбер между стыками ──
  const coords = new Map() // key -> точка
  const adj = new Map() // key -> [{toKey, ek}]
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const k = ekey(a, b)
      if (count.get(k) !== 2) continue
      coords.set(key(a), a)
      coords.set(key(b), b)
      if (!adj.has(key(a))) adj.set(key(a), [])
      if (!adj.has(key(b))) adj.set(key(b), [])
      if (!adj.get(key(a)).some((x) => x.ek === k)) adj.get(key(a)).push({ toKey: key(b), ek: k })
      if (!adj.get(key(b)).some((x) => x.ek === k)) adj.get(key(b)).push({ toKey: key(a), ek: k })
    }
  }
  const coastVerts = new Set()
  for (const e of nextMap.values()) {
    coastVerts.add(key(e.a))
    coastVerts.add(key(e.b))
  }
  const isJunction = (vk) => coastVerts.has(vk) || (adj.get(vk) || []).length !== 2

  const chains = []
  const usedEdge = new Set()
  for (const [vk, list] of adj) {
    if (!isJunction(vk)) continue
    for (const start of list) {
      if (usedEdge.has(start.ek)) continue
      usedEdge.add(start.ek)
      const chain = [coords.get(vk)]
      let curK = start.toKey
      chain.push(coords.get(curK))
      while (!isJunction(curK)) {
        const nxt = adj.get(curK).find((x) => !usedEdge.has(x.ek))
        if (!nxt) break
        usedEdge.add(nxt.ek)
        curK = nxt.toKey
        chain.push(coords.get(curK))
      }
      chains.push(chain)
    }
  }

  return {
    coast: loops.map((pts) => smoothLoop(pts)).join(''),
    borders: chains.map((pts) => smoothOpen(pts)).join(''),
  }
})()

// Единый берег Вестероса (замкнутые контуры материков/островов из
// полигонов регионов) и внутренние границы регионов — каждая один раз.
export const WESTEROS_COAST_D = built.coast
export const REGION_BORDERS_D = built.borders
