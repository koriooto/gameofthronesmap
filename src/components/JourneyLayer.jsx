import { LOCATIONS } from '../data/locations.js'
import { CHARACTERS, JOURNEYS, globalEp } from '../data/journeys.js'
import { AvatarG } from './Avatars.jsx'

const LOC = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]))

// Маршруты героев: линии постоянной экранной толщины + фишка-портрет
// в последней достигнутой точке. Рендерится внутри мировой группы карты.
export default function JourneyLayer({ epIdx, activeIds, onSelectChar }) {
  const tokensAt = {}
  const chars = CHARACTERS.filter((c) => activeIds.has(c.id))

  return (
    <g className="journeys">
      {chars.map((ch, ci) => {
        const stops = (JOURNEYS[ch.id] || []).filter(
          (st) => LOC[st.loc] && globalEp(st.s, st.e) <= epIdx,
        )
        if (!stops.length) return null
        const pts = []
        for (const st of stops) {
          const l = LOC[st.loc]
          const prev = pts[pts.length - 1]
          if (!prev || prev[0] !== l.x || prev[1] !== l.y) pts.push([l.x, l.y])
        }
        let d = `M${pts[0][0]},${pts[0][1]}`
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1]
          const [bx, by] = pts[i]
          const len = Math.hypot(bx - ax, by - ay) || 1
          const bow = Math.min(20, len * 0.18) * (ci % 2 ? 1 : -1)
          const mx = (ax + bx) / 2 - ((by - ay) / len) * bow
          const my = (ay + by) / 2 + ((bx - ax) / len) * bow
          d += `Q${mx.toFixed(1)},${my.toFixed(1)} ${bx},${by}`
        }
        const last = pts[pts.length - 1]
        const key = `${last[0]},${last[1]}`
        const slot = tokensAt[key] || 0
        tokensAt[key] = slot + 1
        const off = slot * 19

        return (
          <g key={ch.id}>
            <path d={d} className="journey-halo" />
            <path d={d} className="journey-path" style={{ stroke: ch.color }} />
            <g transform={`translate(${last[0]} ${last[1]})`} className="journey-token-wrap">
              <g
                className="journey-token"
                style={{ transform: `scale(var(--ms, 1)) translate(${off}px, 0)` }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectChar?.(ch.id)
                }}
              >
                <circle r="11" fill="#efe4c8" stroke={ch.color} strokeWidth="2.2" />
                <g transform="translate(-9.5 -9.5) scale(0.594)">
                  <AvatarG id={ch.id} />
                </g>
                <circle r="11" fill="transparent" />
              </g>
            </g>
          </g>
        )
      })}
    </g>
  )
}
