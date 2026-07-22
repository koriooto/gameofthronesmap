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
  LAKES,
  ISLE_OF_FACES,
  WALL,
  MOUNTAINS,
  FORESTS,
  SWAMPS,
  WAVES,
  COMPASS,
  CONTINENT_LABELS,
  SEA_LABELS,
  FAR_NORTH_LABEL,
  smoothClosed,
} from '../map/shapes.js'
import { MarkerGlyph } from '../map/markers.jsx'

const VB_W = 2000
const VB_H = 1440
const MIN_K = 0.85
const MAX_K = 14

const clampK = (k) => Math.max(MIN_K, Math.min(MAX_K, k))

// Сглаженные контуры вестеросских регионов (по одному разу на модуль)
const REGION_PATHS = Object.fromEntries(
  Object.entries(REGIONS).map(([key, r]) => [
    key,
    r.polygon ? smoothClosed(r.polygon) : null,
  ]),
)

// Не даём утащить лист карты целиком за экран: полоса в PAN_MARGIN единиц
// от края листа всегда остаётся в поле зрения.
const PAN_MARGIN = 350
function clampView(v) {
  const k = clampK(v.k)
  return {
    k,
    x: Math.min(VB_W - PAN_MARGIN, Math.max(PAN_MARGIN - VB_W * k, v.x)),
    y: Math.min(VB_H - PAN_MARGIN, Math.max(PAN_MARGIN - VB_H * k, v.y)),
  }
}

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const WESTEROS_VIEW = { x: VB_W / 2 - 380 * 1.7, y: VB_H / 2 - 650 * 1.7, k: 1.7 }

// Производные от масштаба величины. ppu — пикселей экрана на единицу карты.
const msOf = (ppu) => Math.max(0.45, Math.min(3.6, 1.15 / ppu))
const levelsOf = (ppu) => ({
  major: ppu >= 0.5,
  glyph: ppu >= 1.0,
  minor: ppu >= 1.55,
  fadeWorld: ppu > 2.2,
})

// Контуры суши — общие для заливки и силуэта-тени.
function LandShapes() {
  return (
    <>
      <path d={ESSOS} />
      <path d={SOTHORYOS} />
      {Object.entries(REGIONS).map(
        ([key, r]) => r.polygon && <path key={key} d={REGION_PATHS[key]} />,
      )}
      {ISLANDS.map(([cx, cy, rx, ry, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}
        />
      ))}
    </>
  )
}

const MapView = forwardRef(function MapView(
  { visibleIds, regionFilter, selectedId, onSelect, onRegionClick, onBackgroundTap, filtered },
  ref,
) {
  const svgRef = useRef(null)
  const worldRef = useRef(null)
  const viewRef = useRef({ x: 0, y: 0, k: 1 })
  const dimsRef = useRef({ w: 1200, h: 800 })
  const [, setTick] = useState(0)
  const animRef = useRef(null)
  const rafRef = useRef(null)
  const levelsRef = useRef(levelsOf(1))
  const dragRef = useRef(null)
  const pinchRef = useRef(null)
  const pointersRef = useRef(new Map())
  const movedRef = useRef(false)
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 })
  const lastDblTapRef = useRef(0)
  const regionTapTimerRef = useRef(null)
  const initializedRef = useRef(false)
  const [hoverId, setHoverId] = useState(null)
  const [hoverRegion, setHoverRegion] = useState(null)

  const commit = useCallback(() => setTick((t) => t + 1), [])

  const baseOf = () => {
    const d = dimsRef.current
    // preserveAspectRatio="slice" ⇒ масштаб задаёт бОльшая из сторон.
    return Math.max(d.w / VB_W, d.h / VB_H)
  }

  // Во время жестов НИКАКОГО React-рендера: transform мира и масштаб
  // маркеров (CSS-переменная --ms) пишутся напрямую в DOM. Рендер
  // случается только при пересечении порогов видимости подписей.
  const applyView = useCallback(
    (raw) => {
      viewRef.current = clampView(raw)
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          const v = viewRef.current
          const svg = svgRef.current
          worldRef.current?.setAttribute(
            'transform',
            `translate(${v.x} ${v.y}) scale(${v.k})`,
          )
          const ppu = baseOf() * v.k
          svg?.style.setProperty('--ms', String(msOf(ppu)))
          const lv = levelsOf(ppu)
          const prev = levelsRef.current
          if (
            lv.major !== prev.major ||
            lv.glyph !== prev.glyph ||
            lv.minor !== prev.minor ||
            lv.fadeWorld !== prev.fadeWorld
          ) {
            levelsRef.current = lv
            commit()
          }
        })
      }
    },
    [commit],
  )

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [])

  const animateTo = useCallback(
    (rawTarget, dur = 550) => {
      stopAnim()
      const target = clampView(rawTarget)
      const from = { ...viewRef.current }
      const t0 = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur)
        const e = ease(t)
        applyView({
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          k: from.k + (target.k - from.k) * e,
        })
        if (t < 1) animRef.current = requestAnimationFrame(step)
        else animRef.current = null
      }
      animRef.current = requestAnimationFrame(step)
    },
    [applyView, stopAnim],
  )

  useImperativeHandle(
    ref,
    () => ({
      flyTo(wx, wy, k = 3.4) {
        animateTo({ x: VB_W / 2 - wx * k, y: VB_H / 2 - wy * k, k })
      },
      reset() {
        // На узких экранах «весь мир» нечитаем — сбрасываем на Вестерос.
        const w = svgRef.current ? svgRef.current.getBoundingClientRect().width : VB_W
        animateTo(w < 700 ? WESTEROS_VIEW : { x: 0, y: 0, k: 1 })
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

  // Размер контейнера; на узких экранах стартуем с Вестероса.
  useEffect(() => {
    const svg = svgRef.current
    const measure = () => {
      const r = svg.getBoundingClientRect()
      if (!r.width || !r.height) return
      dimsRef.current = { w: r.width, h: r.height }
      if (!initializedRef.current) {
        initializedRef.current = true
        if (r.width < 700) viewRef.current = clampView(WESTEROS_VIEW)
      }
      applyView(viewRef.current)
      commit()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [applyView, commit])

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
      applyView({ x: p.x - wx * k2, y: p.y - wy * k2, k: k2 })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [clientToBox, applyView, stopAnim])

  // Захват указателя — только когда жест уже начался: захват на pointerdown
  // ретаргетит click на svg, и клики мышью по маркерам перестают работать.
  const capture = (pointerId) => {
    try {
      svgRef.current.setPointerCapture(pointerId)
    } catch {
      // синтетические события без активного указателя
    }
  }

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
    const p = clientToBox(e.clientX, e.clientY)
    pointersRef.current.set(e.pointerId, p)
    if (pointersRef.current.size === 1) {
      movedRef.current = false
      dragRef.current = { start: p, view: { ...viewRef.current } }
    } else if (pointersRef.current.size === 2) {
      movedRef.current = true
      for (const id of pointersRef.current.keys()) capture(id)
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
      applyView({ x: mid.x - wx * k2, y: mid.y - wy * k2, k: k2 })
      return
    }

    const d = dragRef.current
    if (!d) return
    const dx = p.x - d.start.x
    const dy = p.y - d.start.y
    if (!movedRef.current && Math.abs(dx) + Math.abs(dy) > 3) {
      movedRef.current = true
      capture(e.pointerId)
    }
    if (movedRef.current)
      applyView({ x: d.view.x + dx, y: d.view.y + dy, k: d.view.k })
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
      lastDblTapRef.current = now
      clearTimeout(regionTapTimerRef.current)
      zoomAt(p, viewRef.current.k * 1.8)
    } else {
      lastTapRef.current = { t: now, x: p.x, y: p.y }
      onSelect(null)
      // Тап по «свободной» области (не маркер и не регион) сбрасывает фильтр.
      const t = e.target
      if (!(t.closest?.('.marker') || t.closest?.('.region-shape')))
        onBackgroundTap?.()
    }
  }

  const { x, y, k } = viewRef.current
  const ppu = baseOf() * k
  const ms = msOf(ppu)
  const lv = levelsOf(ppu)
  levelsRef.current = lv
  const { major: showMajorLabels, glyph: showMinorGlyphs, minor: showMinorLabels, fadeWorld } = lv

  return (
    <svg
      ref={svgRef}
      className="map-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ '--ms': ms }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      role="img"
      aria-label="Карта известного мира"
    >
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
          <stop offset="70%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#3a2c17" stopOpacity="0.28" />
        </radialGradient>
        <clipPath id="sheet">
          <rect width={VB_W} height={VB_H} />
        </clipPath>
      </defs>

      <rect width={VB_W} height={VB_H} fill="#b2cbd0" />

      <g clipPath="url(#sheet)">
        <g ref={worldRef} transform={`translate(${x} ${y}) scale(${k})`}>
          {/* ── суша: дешёвая тень-силуэт + заливка (без SVG-фильтров) ── */}
          <g transform="translate(4 5)" className="land-shadow">
            <LandShapes />
          </g>
          <g className="land">
            <LandShapes />
          </g>

          {/* ── регионы Вестероса (интерактивные) ── */}
          {Object.entries(REGIONS).map(([key, r]) => {
            if (!r.polygon) return null
            const active = regionFilter === key || hoverRegion === key
            const dimmed = regionFilter && regionFilter !== key
            return (
              <path
                key={key}
                d={REGION_PATHS[key]}
                fill={r.color}
                className="region-shape"
                style={{ fillOpacity: active ? 0.62 : dimmed ? 0.12 : 0.34 }}
                onMouseEnter={() => setHoverRegion(key)}
                onMouseLeave={() => setHoverRegion(null)}
                onClick={(e) => {
                  if (movedRef.current) return
                  // двойной тап по региону — это зум, а не выбор
                  if (performance.now() - lastDblTapRef.current < 400) return
                  e.stopPropagation()
                  clearTimeout(regionTapTimerRef.current)
                  regionTapTimerRef.current = setTimeout(() => onRegionClick(key), 340)
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
          <g className="lakes">
            {LAKES.map(([cx, cy, rx, ry], i) => (
              <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} />
            ))}
            <ellipse
              className="isle"
              cx={ISLE_OF_FACES[0]}
              cy={ISLE_OF_FACES[1]}
              rx={ISLE_OF_FACES[2]}
              ry={ISLE_OF_FACES[3]}
            />
          </g>
          <g className="swamps">
            {SWAMPS.map(([sx, sy], i) => (
              <path key={i} d={`M${sx - 8},${sy} h6 m3,0 h6 M${sx - 5},${sy + 4} h5 m3,0 h5`} />
            ))}
          </g>
          <g className="waves">
            {WAVES.map(([wx, wy], i) => (
              <path key={i} d={`M${wx - 10},${wy} q5,-4 10,0 q5,4 10,0 M${wx - 5},${wy + 5} q4,-3 8,0 q4,3 8,0`} />
            ))}
          </g>
          <path d={WALL} className="wall-under" />
          <path d={WALL} className="wall" />

          {/* ── подписи материков (мировой размер, тают на зуме) ── */}
          <g className="continent-labels" style={{ opacity: fadeWorld ? 0 : 1 }}>
            {CONTINENT_LABELS.map(([text, lx, ly, rot, size]) => (
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
          </g>

          {/* ── подписи морей и регионов: постоянный экранный размер ── */}
          <g className="sea-labels">
            {SEA_LABELS.map(([text, lx, ly, rot, size]) => (
              <g key={text} transform={`translate(${lx} ${ly})${rot ? ` rotate(${rot})` : ''}`}>
                <text fontSize={size}>{text}</text>
              </g>
            ))}
            <g transform={`translate(${FAR_NORTH_LABEL.x} ${FAR_NORTH_LABEL.y})`}>
              <text fontSize="20">{FAR_NORTH_LABEL.text}</text>
            </g>
          </g>
          <g className="region-labels">
            {Object.entries(REGIONS).map(([key, r]) => {
              const lines = r.label.text.split('\n')
              const dimmed = regionFilter && regionFilter !== key
              return (
                <g key={key} transform={`translate(${r.label.x} ${r.label.y})`}>
                  <text style={{ opacity: dimmed ? 0.25 : 0.8 }}>
                    {lines.map((ln, i) => (
                      <tspan key={i} x="0" dy={i === 0 ? 0 : 15}>
                        {ln}
                      </tspan>
                    ))}
                  </text>
                </g>
              )
            })}
          </g>

          {/* ── роза ветров ── */}
          <g className="compass" transform={`translate(${COMPASS.x} ${COMPASS.y})`}>
            <circle r={COMPASS.r} className="compass-ring" />
            <circle r={COMPASS.r * 0.72} className="compass-ring" />
            {[0, 45, 90, 135].map((a) => (
              <path
                key={a}
                d={`M0,${-COMPASS.r} L6,0 L0,${COMPASS.r} L-6,0 Z`}
                transform={`rotate(${a})`}
                className={a % 90 === 0 ? 'compass-major' : 'compass-minor'}
              />
            ))}
            <text y={-COMPASS.r - 8} className="compass-n">С</text>
          </g>

          {/* ── маркеры ── */}
          <g>
            {LOCATIONS.map((loc) => {
              const visible = visibleIds.has(loc.id)
              const isSel = selectedId === loc.id
              const isHover = hoverId === loc.id
              // На дальних зумах второстепенные значки прячем — иначе
              // крупные подписи налезают на них. Фильтр/поиск показывает всё.
              if (!loc.major && !isSel && !showMinorGlyphs && !filtered) return null
              const mult = isSel ? 1.5 : isHover ? 1.25 : 1
              const showLabel =
                isSel ||
                isHover ||
                (visible && (loc.major ? showMajorLabels : showMinorLabels))
              // Подпись всегда над иконкой; у выбранного маркера ореол
              // r=10, поэтому поднимаем чуть выше.
              const ly = isSel ? -16 : -11
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
                    clearTimeout(regionTapTimerRef.current)
                    onSelect(loc.id)
                  }}
                >
                  {/* масштаб через CSS-переменную: жесты не трогают React */}
                  <g
                    className="marker-scale"
                    style={{ transform: `scale(calc(var(--ms, 1) * ${mult}))` }}
                  >
                    {isSel && <circle r="10" className="marker-halo" />}
                    {/* невидимая зона тапа ~35px на любом зуме */}
                    <circle r="15" fill="transparent" />
                    <MarkerGlyph type={loc.type} />
                    {showLabel && (
                      <text
                        y={ly}
                        textAnchor="middle"
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
      <rect x="6" y="6" width={VB_W - 12} height={VB_H - 12} className="map-frame" pointerEvents="none" />
    </svg>
  )
})

export default MapView
