import { useId } from 'react'
import { HOUSES } from '../data/houses.js'

// Стилизованный геральдический щит: поле в цветах дома и эмблема.
const SHIELD = 'M28,2 L52,9 L52,30 C52,46 42,56 28,62 C14,56 4,46 4,30 L4,9 Z'

export default function Sigil({ house, size = 54 }) {
  const clipId = useId()
  const h = HOUSES[house]
  if (!h?.field) return null
  const fields = Array.isArray(h.field) ? h.field : [h.field]
  const isText = h.charge && !/\p{Extended_Pictographic}/u.test(h.charge)
  return (
    <svg
      width={size}
      height={(size * 64) / 56}
      viewBox="0 0 56 64"
      className="sigil"
      aria-label={`Герб: ${h.sigil}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      {fields.length === 1 ? (
        <path d={SHIELD} fill={fields[0]} />
      ) : (
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="28" height="64" fill={fields[0]} />
          <rect x="28" y="0" width="28" height="64" fill={fields[1]} />
        </g>
      )}
      {h.charge && (
        <text
          x="28"
          y={isText ? 36 : 38}
          textAnchor="middle"
          fontSize={isText ? 15 : 26}
          fill="#f4ecd8"
          style={{ fontFamily: isText ? 'Georgia, serif' : undefined }}
        >
          {h.charge}
        </text>
      )}
      <path d={SHIELD} fill="none" stroke="#3a2c1a" strokeWidth="2.4" />
    </svg>
  )
}
