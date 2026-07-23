// Единый набор строковых SVG-иконок интерфейса.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ size = 16, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} {...rest}>
    {children}
  </svg>
)

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconMinus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
  </Svg>
)

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const IconPlay = (p) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconPause = (p) => (
  <Svg {...p}>
    <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth="3" />
  </Svg>
)

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5.5 5.5" />
  </Svg>
)

// Волчья голова — переключатель «Путь героев»
export const IconWolf = (p) => (
  <Svg {...p}>
    <path
      d="M5 4l3 4 4-1.5L16 8l3-4 1 6c0 2-1 3.5-2.5 4.5L13 20l-1-2-1 2-4.5-5.5C5 13.5 4 12 4 10z"
      fill="currentColor"
      stroke="none"
    />
    <circle cx="9.6" cy="10.6" r="1" fill="#f1e7cf" stroke="none" />
    <circle cx="14.4" cy="10.6" r="1" fill="#f1e7cf" stroke="none" />
  </Svg>
)
