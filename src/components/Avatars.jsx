// Стилизованные портреты героев (собственная отрисовка, 32x32).
// AvatarG — содержимое для вставки внутрь SVG карты, Avatar — готовый <svg>.

const FACES = {
  jon: (
    <>
      <path d="M6 22 C4 9 11 3.5 16 3.5 C21 3.5 28 9 26 22 C26 12 21 8 16 8 C11 8 6 12 6 22 Z" fill="#26201c" />
      <circle cx="6.6" cy="15" r="2.6" fill="#26201c" />
      <circle cx="25.4" cy="15" r="2.6" fill="#26201c" />
      <ellipse cx="16" cy="17" rx="7.4" ry="8.4" fill="#d9a97e" />
      <path d="M9.4 19 C9.4 26.5 12.6 29 16 29 C19.4 29 22.6 26.5 22.6 19 C22.6 25 20 26.6 16 26.6 C12 26.6 9.4 25 9.4 19 Z" fill="#26201c" />
      <path d="M8 14 C8 8.5 11 6.5 16 6.5 C21 6.5 24 8.5 24 14 C22 10.5 19 9.5 16 9.5 C13 9.5 10 10.5 8 14 Z" fill="#26201c" />
      <circle cx="13" cy="16" r="1" fill="#3a2c1a" />
      <circle cx="19" cy="16" r="1" fill="#3a2c1a" />
    </>
  ),
  daenerys: (
    <>
      <path d="M7 12 C7 5 12 3 16 3 C20 3 25 5 25 12 L26 29 C23 26.5 21 27.5 16 27.5 C11 27.5 9 26.5 6 29 Z" fill="#e9e6dc" />
      <ellipse cx="16" cy="16.5" rx="7" ry="8.2" fill="#eccfae" />
      <path d="M16 4.5 C10.5 4.5 8.5 8.5 8.5 13 C10.5 8.8 13 7.6 16 7.6 C19 7.6 21.5 8.8 23.5 13 C23.5 8.5 21.5 4.5 16 4.5 Z" fill="#e9e6dc" />
      <path d="M8.8 10 C7.6 13 7.6 16 8.2 19 L6.8 18 C6.2 14.5 6.6 11.6 8.8 10 Z" fill="#e9e6dc" />
      <path d="M23.2 10 C24.4 13 24.4 16 23.8 19 L25.2 18 C25.8 14.5 25.4 11.6 23.2 10 Z" fill="#e9e6dc" />
      <circle cx="13.2" cy="15.6" r="1" fill="#5a4a7a" />
      <circle cx="18.8" cy="15.6" r="1" fill="#5a4a7a" />
    </>
  ),
  tyrion: (
    <>
      <path d="M6.5 18 C5.5 8 11 4.5 16 4.5 C21 4.5 26.5 8 25.5 18 C24.5 11 20.5 9 16 9 C11.5 9 7.5 11 6.5 18 Z" fill="#b8955a" />
      <ellipse cx="16" cy="17" rx="7.4" ry="8.2" fill="#dcae85" />
      <path d="M8.8 18.5 C8.8 27 12.4 29.5 16 29.5 C19.6 29.5 23.2 27 23.2 18.5 C23.2 25.5 20.4 27.6 16 27.6 C11.6 27.6 8.8 25.5 8.8 18.5 Z" fill="#a3814c" />
      <path d="M10.5 12.5 L14 16.5" stroke="#a06a4a" strokeWidth="0.9" fill="none" />
      <circle cx="12.8" cy="15.8" r="1" fill="#3f5a3a" />
      <circle cx="19.2" cy="15.8" r="1" fill="#3f5a3a" />
    </>
  ),
  arya: (
    <>
      <path d="M7 13 C7 5.5 12 3.8 16 3.8 C20 3.8 25 5.5 25 13 L25.6 22 C24 20 23 20.5 22.6 18 C22.4 13 20 10.5 16 10.5 C12 10.5 9.6 13 9.4 18 C9 20.5 8 20 6.4 22 Z" fill="#4a3826" />
      <ellipse cx="16" cy="17" rx="7" ry="8" fill="#d9a97e" />
      <path d="M16 5 C11 5 8.6 8.6 9 13.6 C11 9.8 13.4 8.8 16 8.8 C18.6 8.8 21 9.8 23 13.6 C23.4 8.6 21 5 16 5 Z" fill="#4a3826" />
      <circle cx="13" cy="15.8" r="1" fill="#4a4438" />
      <circle cx="19" cy="15.8" r="1" fill="#4a4438" />
    </>
  ),
  sansa: (
    <>
      <path d="M7 12.5 C7 5 12 3.4 16 3.4 C20 3.4 25 5 25 12.5 L26 29 C23.5 26.6 21 27.4 16 27.4 C11 27.4 8.5 26.6 6 29 Z" fill="#a8502a" />
      <ellipse cx="16" cy="16.5" rx="6.9" ry="8.1" fill="#eccfae" />
      <path d="M16 4.6 C10.8 4.6 8.6 8.4 8.8 13 C10.8 9 13.2 7.8 16 7.8 C18.8 7.8 21.2 9 23.2 13 C23.4 8.4 21.2 4.6 16 4.6 Z" fill="#a8502a" />
      <circle cx="13.2" cy="15.4" r="1" fill="#4a6a8a" />
      <circle cx="18.8" cy="15.4" r="1" fill="#4a6a8a" />
    </>
  ),
  bran: (
    <>
      <path d="M7 14 C6.6 6.5 11.5 4 16 4 C20.5 4 25.4 6.5 25 14 L24.6 19 C23.8 14 20.5 9.6 16 9.6 C11.5 9.6 8.2 14 7.4 19 Z" fill="#5a4632" />
      <ellipse cx="16" cy="17" rx="7.2" ry="8.2" fill="#d9a97e" />
      <path d="M16 5.4 C11 5.4 8.6 9 9 14 C11 10.2 13.4 9.2 16 9.2 C18.6 9.2 21 10.2 23 14 C23.4 9 21 5.4 16 5.4 Z" fill="#5a4632" />
      <circle cx="13" cy="16" r="1" fill="#3a3630" />
      <circle cx="19" cy="16" r="1" fill="#3a3630" />
    </>
  ),
  jaime: (
    <>
      <path d="M6.8 16 C6 7.5 11 4.2 16 4.2 C21 4.2 26 7.5 25.2 16 C24 10.5 20.5 8.6 16 8.6 C11.5 8.6 8 10.5 6.8 16 Z" fill="#c9a24a" />
      <ellipse cx="16" cy="17" rx="7.3" ry="8.2" fill="#dcae85" />
      <path d="M9.6 20 C9.8 26 12.8 28.6 16 28.6 C19.2 28.6 22.2 26 22.4 20 C21.8 25 19.6 26.6 16 26.6 C12.4 26.6 10.2 25 9.6 20 Z" fill="#b08e42" opacity="0.85" />
      <circle cx="13" cy="15.8" r="1" fill="#3f6a3a" />
      <circle cx="19" cy="15.8" r="1" fill="#3f6a3a" />
    </>
  ),
  brienne: (
    <>
      <path d="M7.4 15 C6.8 7 11.5 4.4 16 4.4 C20.5 4.4 25.2 7 24.6 15 C23.4 10 20.4 8.8 16 8.8 C11.6 8.8 8.6 10 7.4 15 Z" fill="#d6c690" />
      <ellipse cx="16" cy="17" rx="7.4" ry="8.4" fill="#d9a97e" />
      <path d="M16 5.6 C11.4 5.6 9 8.8 9.2 13 C11 9.8 13.4 9 16 9 C18.6 9 21 9.8 22.8 13 C23 8.8 20.6 5.6 16 5.6 Z" fill="#d6c690" />
      <circle cx="13" cy="15.8" r="1" fill="#4a6a8a" />
      <circle cx="19" cy="15.8" r="1" fill="#4a6a8a" />
    </>
  ),
}

export function AvatarG({ id }) {
  return FACES[id] || null
}

export default function Avatar({ id, size = 24, ring }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <clipPath id={`av-${id}`}>
          <circle cx="16" cy="16" r="15" />
        </clipPath>
      </defs>
      <circle cx="16" cy="16" r="15" fill="#efe4c8" />
      <g clipPath={`url(#av-${id})`}>
        <AvatarG id={id} />
      </g>
      {ring && <circle cx="16" cy="16" r="14.6" fill="none" stroke={ring} strokeWidth="2.6" />}
    </svg>
  )
}
