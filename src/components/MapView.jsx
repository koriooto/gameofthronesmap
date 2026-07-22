import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { REGIONS } from '../data/regions.js'
import { LOCATIONS } from '../data/locations.js'
import { LABEL_OVERRIDES } from '../data/labelOverrides.js'
import {
  ESSOS,
  SOTHORYOS,
  ISLANDS,
  RIVERS,
  WALL,
  MOUNTAINS,
  FORESTS,
  SEA_LABELS,
  FAR_NORTH_LABEL,
} from '../map/shapes.js'
import { MarkerGlyph } from '../map/markers.jsx'

const VB_W = 2000
const VB_H = 1440
const MIN_K = 0.85
const MAX_K = 14

const polyPoints = (pts) => pts.map((p) => p.join(',')).join(' ')
const clampK = (k) => Math.max(MIN_K, Math.min(MAX_K, k))

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const MapView = forwardRef(function MapView(
  { visibleIds, regionFilter, selectedId, onSelect, onRegionClick },
  ref,
) {
  const svgRef = useRef(null)
  const viewRef = useRef({ x: 0, y: 0, k: 1 })
  const [view, setViewState] = useState(viewRef.current)
  const [dims, setDims] = useState({ w: 1200, h: 800 })
  const animRef = useRef(null)
  const rafRef = useRef(null)
  const pendingRef = useRef(null)
  const dragRef = useRef(null)
  const pinchRef = useRef(null)
  const pointersRef = useRef(new Map())
  const movedRef = useRef(false)
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 })
  const initializedRef = useRef(false)
  const [hoverId, setHoverId] = useState(null)
  const [hoverRegion, setHoverRegion] = useState(null)

  const setView = useCallback((v) => {
    viewRef.current = v
    setViewState(v)
  }, [])

  // Троттлинг обновлений через rAF — иначе на телефонах карта дёргается.
  const scheduleView = useCallback((v) => {
    viewRef.current = v
    pendingRef.current = v
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setViewState(pendingRef.current)
      })
    }
  }, [])

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  const animateTo = useCallback(
    (target, dur = 550) => {
      stopAnim()
      const from = { ...viewRef.current }
      const t0 = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur)
        const e = ease(t)
        setView({
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          k: from.k + (target.k - from.k) * e,
        })
        if (t < 1) animRef.current = requestAnimationFrame(step)
        else animRef.current = null
      }
      animRef.current = requestAnimationFrame(step)
    },
    [setView, stopAnim],
  )

  useImperativeHandle(
    ref,
    () => ({
      flyTo(wx, wy, k = 3.4) {
        animateTo({ x: VB_W / 2 - wx * k, y: VB_H / 2 - wy * k, k })
      },
      reset() {
        // На узких экранах «весь мир» нечитаем — сбрасываем на Вестерос.
        const svg = svgRef.current
        const w = svg ? svg.getBoundingClientRect().width : VB_W
        if (w < 700) {
          const k = 1.7
          animateTo({ x: VB_W / 2 - 380 * k, y: VB_H / 2 - 650 * k, k })
        } else {
          animateTo({ x: 0, y: 0, k: 1 })
        }
      },
      zoomBy(f) {
        const { x, y, k } = viewRef.current
        const k2 = clampK(k * f)
        const cx = VB_W / 2
        const cy = VB_H / 2
        animateTo(
          { x: cx - ((cx - x) / k) * k2, y: cy - ((cy - y) / k) * k2, k: k2 },
          250,
        )
      },
    }),
    [animateTo],
  )

  // Размер контейнера — от него зависит пиксельная плотность карты.
  // При первом реальном замере на узких экранах стартуем с Вестероса:
  // весь мир на телефоне нечитаем.
  useEffect(() => {
    const svg = svgRef.current
    const measure = () => {
      const r = svg.getBoundingClientRect()
      if (!r.width || !r.height) return
      setDims({ w: r.width, h: r.height })
      if (!initializedRef.current) {
        initializedRef.current = true
        if (r.width < 700) {
          const k = 1.7
          setView({ x: VB_W / 2 - 380 * k, y: VB_H / 2 - 650 * k, k })
        }
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [setView])

  // Точка курсора в координатах viewBox.
  const clientToBox = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    const m = svg.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse())
    return { x: pt.x, y: pt.y }
  }, [])

  const zoomAt = useCallback(
    (p, k2, dur = 300) => {
      const { x, y, k } = viewRef.current
      const wx = (p.x - x) / k
      const wy = (p.y - y) / k
      const kc = clampK(k2)
      animateTo({ x: p.x - wx * kc, y: p.y - wy * kc, k: kc }, dur)
    },
    [animateTo],
  )

  useEffect(() => {
    const svg = svgRef.current
    const onWheel = (e) => {
      e.preventDefault()
      stopAnim()
      const { x, y, k } = viewRef.current
      const k2 = clampK(k * Math.exp(-e.deltaY * 0.0016))
      if (k2 === k) return
      const p = clientToBox(e.clientX, e.clientY)
      const wx = (p.x - x) / k
      const wy = (p.y - y) / k
      scheduleView({ x: p.x - wx * k2, y: p.y - wy * k2, k: k2 })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [clientToBox, scheduleView, stopAnim])

  const startPinch = () => {
    const pts = [...pointersRef.current.values()]
    if (pts.length < 2) return
    const [a, b] = pts
    pinchRef.current = {
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      view: { ...viewRef.current },
    }
    dragRef.current = null
  }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    stopAnim()
    try {
      svgRef.current.setPointerCapture(e.pointerId)
    } catch {
      // например, синтетические события без активного указателя
    }
    const p = clientToBox(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, p)
    if (pointersRef.current.size === 1) {
      movedRef.current = false
      dragRef.current = { start: p, view: { ...viewRef.current } }
    } else if (pointersRef.current.size === 2) {
      movedRef.current = true
      startPinch()
    }
  }

  const onPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return
    const p = clientToBox(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, p)

    if (pinchRef.current && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const s = pinchRef.current
      const k2 = clampK(s.view.k * (dist / s.dist))
      const wx = (s.mid.x - s.view.x) / s.view.k
      const wy = (s.mid.y - s.view.y) / s.view.k
      scheduleView({ x: mid.x - wx * k2, y: mid.y - wy * k2, k: k2 })
      return
    }

    const d = dragRef.current
    if (!d) return
    const dx = p.x - d.start.x
    const dy = p.y - d.start.y
    if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true
    if (movedRef.current)
      scheduleView({ x: d.view.x + dx, y: d.view.y + dy, k: d.view.k })
  }

  const endPointer = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.delete(e.pointerId)

    if (pinchRef.current) {
      if (pointersRef.current.size < 2) {
        pinchRef.current = null
        if (pointersRef.current.size === 1) {
          const rest = [...pointersRef.current.values()][0]
          dragRef.current = { start: rest, view: { ...viewRef.current } }
        }
      } else {
        startPinch()
      }
      return
    }

    dragRef.current = null
    if (pointersRef.current.size > 0) return
    if (movedRef.current) return

    // Одиночный тап по фону: снять выделение; двойной тап — приблизить.
    const p = clientToBox(e.clientX, e.clientY)
    const now = performance.now()
    const lt = lastTapRef.current
    if (now - lt.t < 320 && Math.hypot(p.x - lt.x, p.y - lt.y) < 40) {
      lastTapRef.current = { t: 0, x: 0, y: 0 }
      zoomAt(p, viewRef.current.k * 1.8)
    } else {
      lastTapRef.current = { t: now, x: p.x, y: p.y }
      onSelect(null)
    }
  }

  const { x, y, k } = view
  // Пикселей экрана на единицу карты — определяет размер маркеров и подписей.
  // preserveAspectRatio="slice" ⇒ масштаб задаёт бОльшая из сторон.
  const base = Math.max(dims.w / VB_W, dims.h / VB_H)
  const ppu = base * k
  const ms = Math.max(0.45, Math.min(3.6, 1.15 / ppu))
  const showMajorLabels = ppu >= 0.5
  const showMinorLabels = ppu >= 1.05

  return (
    <svg
      ref={svgRef}
      className="map-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      role="img"
      aria-label="Карта известного мира"
    >
      <defs>
        <filter id="paper" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.26  0 0 0 0 0.18  0 0 0 0.35 0" />
        </filter>
        <filter id="landshadow">
          <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#5a4a30" floodOpacity="0.35" />
        </filter>
        <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
          <stop offset="70%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#3a2c17" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id="sheet">
          <rect width={VB_W} height={VB_H} />
        </clipPath>
      </defs>

      <rect width={VB_W} height={VB_H} fill="#cfc3a2" />

      <g clipPath="url(#sheet)">
        <g transform={`translate(${x} ${y}) scale(${k})`}>
        {/* ── суша ── */}
        <g filter="url(#landshadow)">
          <path d={ESSOS} className="land" />
          <path d={SOTHORYOS} className="land" />
          {Object.values(REGIONS).map(
            (r) =>
              r.polygon && (
                <polygon key={r.label.text} points={polyPoints(r.polygon)} className="land" />
              ),
          )}
          {ISLANDS.map(([cx, cy, rx, ry, rot], i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
              className="land"
            />
          ))}
        </g>

        {/* ── регионы Вестероса (интерактивные) ── */}
        {Object.entries(REGIONS).map(([key, r]) => {
          if (!r.polygon) return null
          const active = regionFilter === key || hoverRegion === key
          const dimmed = regionFilter && regionFilter !== key
          return (
            <polygon
              key={key}
              points={polyPoints(r.polygon)}
              fill={r.color}
              className="region-shape"
              style={{ fillOpacity: active ? 0.62 : dimmed ? 0.12 : 0.34 }}
              onMouseEnter={() => setHoverRegion(key)}
              onMouseLeave={() => setHoverRegion(null)}
              onClick={(e) => {
                if (movedRef.current) return
                e.stopPropagation()
                onRegionClick(key)
              }}
            />
          )
        })}

        {/* ── декор: леса, горы, реки, Стена ── */}
        <g className="forests">
          {FORESTS.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </g>
        <g className="mountains">
          {MOUNTAINS.map(([mx, my], i) => (
            <path key={i} d={`M${mx - 9},${my + 6} L${mx},${my - 8} L${mx + 9},${my + 6}`} />
          ))}
        </g>
        <g className="rivers">
          {RIVERS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={WALL} className="wall" />

        {/* ── подписи ── */}
        <g className="sea-labels">
          {SEA_LABELS.map(([text, lx, ly, rot, size]) => (
            <text
              key={text}
              x={lx}
              y={ly}
              fontSize={size}
              transform={rot ? `rotate(${rot} ${lx} ${ly})` : undefined}
            >
              {text}
            </text>
          ))}
          <text x={FAR_NORTH_LABEL.x} y={FAR_NORTH_LABEL.y} fontSize="20">
            {FAR_NORTH_LABEL.text}
          </text>
        </g>
        <g className="region-labels">
          {Object.entries(REGIONS).map(([key, r]) => {
            const lines = r.label.text.split('\n')
            const dimmed = regionFilter && regionFilter !== key
            return (
              <text
                key={key}
                x={r.label.x}
                y={r.label.y}
                style={{ opacity: dimmed ? 0.25 : 0.8 }}
              >
                {lines.map((ln, i) => (
                  <tspan key={i} x={r.label.x} dy={i === 0 ? 0 : 15}>
                    {ln}
                  </tspan>
                ))}
              </text>
            )
          })}
        </g>

        {/* ── маркеры ── */}
        <g>
          {LOCATIONS.map((loc) => {
            const visible = visibleIds.has(loc.id)
            const isSel = selectedId === loc.id
            const isHover = hoverId === loc.id
            const s = ms * (isSel ? 1.5 : isHover ? 1.25 : 1)
            const showLabel =
              isSel ||
              isHover ||
              (visible && (loc.major ? showMajorLabels : showMinorLabels))
            const o = LABEL_OVERRIDES[loc.id]
            const lx = o?.x ?? 0
            const ly = o?.y ?? 16
            const anchor = o?.a ?? 'middle'
            return (
              <g
                key={loc.id}
                transform={`translate(${loc.x} ${loc.y})`}
                className="marker"
                style={{ opacity: visible ? 1 : 0.18 }}
                onMouseEnter={() => setHoverId(loc.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={(e) => {
                  if (movedRef.current) return
                  e.stopPropagation()
                  onSelect(loc.id)
                }}
              >
                <g transform={`scale(${s})`}>
                  {isSel && <circle r="10" className="marker-halo" />}
                  <circle r="9" fill="transparent" />
                  <MarkerGlyph type={loc.type} />
                  {showLabel && (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={anchor}
                      className={`marker-label ${loc.major ? 'major' : ''}`}
                    >
                      {loc.name}
                    </text>
                  )}
                </g>
              </g>
            )
          })}
        </g>
      </g>
      </g>

      <rect width={VB_W} height={VB_H} fill="url(#vignette)" pointerEvents="none" />
      <rect width={VB_W} height={VB_H} filter="url(#paper)" opacity="0.5" pointerEvents="none" />
      <rect x="6" y="6" width={VB_W - 12} height={VB_H - 12} className="map-frame" pointerEvents="none" />
    </svg>
  )
})

export default MapView
