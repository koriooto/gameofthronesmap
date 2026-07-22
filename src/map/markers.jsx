// Значки типов локаций — используются на карте, в легенде и в списке.

export const TYPE_COLORS = {
  capital: '#8e2f27',
  castle: '#5b4531',
  city: '#2f4d68',
  town: '#6d6147',
  ruin: '#7c6753',
  landmark: '#4c6b4e',
}

const STAR =
  'M0,-6 L1.53,-2.1 L5.71,-1.85 L2.47,0.8 L3.53,4.85 L0,2.6 L-3.53,4.85 L-2.47,0.8 L-5.71,-1.85 L-1.53,-2.1 Z'

const KEEP =
  'M-5,5 L-5,-2 L-3,-2 L-3,-5 L-1,-5 L-1,-2 L1,-2 L1,-5 L3,-5 L3,-2 L5,-2 L5,5 Z'

export function MarkerGlyph({ type }) {
  const c = TYPE_COLORS[type] || '#444'
  switch (type) {
    case 'capital':
      return <path d={STAR} fill={c} stroke="#f4ecd8" strokeWidth="0.8" />
    case 'castle':
      return <path d={KEEP} fill={c} stroke="#f4ecd8" strokeWidth="0.8" />
    case 'city':
      return (
        <g>
          <circle r="5" fill={c} stroke="#f4ecd8" strokeWidth="0.8" />
          <circle r="1.7" fill="#f4ecd8" />
        </g>
      )
    case 'town':
      return <circle r="3.4" fill="#f4ecd8" stroke={c} strokeWidth="1.8" />
    case 'ruin':
      return (
        <path
          d="M-5,4 L-2,-3 L0,1 L2,-4 L5,4"
          fill="none"
          stroke={c}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )
    case 'landmark':
      return <path d="M0,-5 L4.5,0 L0,5 L-4.5,0 Z" fill={c} stroke="#f4ecd8" strokeWidth="0.8" />
    default:
      return <circle r="4" fill={c} />
  }
}

export function TypeIcon({ type, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="-7 -7 14 14" aria-hidden="true">
      <MarkerGlyph type={type} />
    </svg>
  )
}
