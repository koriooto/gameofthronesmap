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
const MAX_K = 12

const polyPoints = (pts) => pts.map((p) => p.join(',')).join(' ')

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
  const animRef = useRef(null)
  const dragRef = useRef(null)
  const [hoverId, setHoverId] = useState(null)
  const [hoverRegion, setHoverRegion] = useState(null)

  const setView = useCallback((v) => {
    viewRef.current = v
    setViewState(v)
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
        animateTo({ x: 0, y: 0, k: 1 })
      },
      zoomBy(f) {
        const { x, y, k } = viewRef.current
        const k2 = Math.max(MIN_K, Math.min(MAX_K, k * f))
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

  // Точка курсора в координатах viewBox.
  const clientToBox = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    const m = svg.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse())
    return { x: pt.x, y: pt.y }
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    const onWheel = (e) => {
      e.preventDefault()
      stopAnim()
      const { x, y, k } = viewRef.current
      const factor = Math.exp(-e.deltaY * 0.0016)
      const k2 = Math.max(MIN_K, Math.min(MAX_K, k * factor))
      if (k2 === k) return
      const p = clientToBox(e.clientX, e.clientY)
      const wx = (p.x - x) / k
      const wy = (p.y - y) / k
      setView({ x: p.x - wx * k2, y: p.y - wy * k2, k: k2 })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [clientToBox, setView, stopAnim])

  const onPointerDown = (e) => {
    if (e.button !== 0) return
    stopAnim()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = clientToBox(e.clientX, e.clientY)
    dragRef.current = { start: p, view: { ...viewRef.current }, moved: false }
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const p = clientToBox(e.clientX, e.clientY)
    const dx = p.x - d.start.x
    const dy = p.y - d.start.y
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (d.moved) setView({ x: d.view.x + dx, y: d.view.y + dy, k: d.view.k })
  }
  const onPointerUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (d && !d.moved) onSelect(null)
  }
  const onDoubleClick = (e) => {
    const { x, y, k } = viewRef.current
    const k2 = Math.min(MAX_K, k * 1.8)
    const p = clientToBox(e.clientX, e.clientY)
    const wx = (p.x - x) / k
    const wy = (p.y - y) / k
    animateTo({ x: p.x - wx * k2, y: p.y - wy * k2, k: k2 }, 300)
  }

  const { x, y, k } = view
  const ms = Math.min(2.0, Math.max(0.45, 2.6 / (k + 0.6))) // масштаб маркеров
  const showMinorLabels = k >= 2.0

  return (
    <svg
      ref={svgRef}
      className="map-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
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
      </defs>

      <rect width={VB_W} height={VB_H} fill="#cfc3a2" />

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
                if (dragRef.current?.moved) return
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
              isSel || isHover || ((loc.major || showMinorLabels) && visible)
            return (
              <g
                key={loc.id}
                transform={`translate(${loc.x} ${loc.y})`}
                className="marker"
                style={{ opacity: visible ? 1 : 0.18 }}
                onMouseEnter={() => setHoverId(loc.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={(e) => {
                  if (dragRef.current?.moved) return
                  e.stopPropagation()
                  onSelect(loc.id)
                }}
              >
                <g transform={`scale(${s})`}>
                  {isSel && <circle r="10" className="marker-halo" />}
                  <circle r="9" fill="transparent" />
                  <MarkerGlyph type={loc.type} />
                  {showLabel && (
                    <text y="16" className={`marker-label ${loc.major ? 'major' : ''}`}>
                      {loc.name}
                    </text>
                  )}
                </g>
              </g>
            )
          })}
        </g>
      </g>

      <rect width={VB_W} height={VB_H} fill="url(#vignette)" pointerEvents="none" />
      <rect width={VB_W} height={VB_H} filter="url(#paper)" opacity="0.5" pointerEvents="none" />
      <rect x="6" y="6" width={VB_W - 12} height={VB_H - 12} className="map-frame" pointerEvents="none" />
    </svg>
  )
})

export default MapView
