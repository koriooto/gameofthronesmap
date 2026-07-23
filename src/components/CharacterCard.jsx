import { LOCATIONS } from '../data/locations.js'
import { CHARACTERS, JOURNEYS, globalEp } from '../data/journeys.js'
import Avatar from './Avatars.jsx'
import { IconClose } from './Icons.jsx'

const LOC = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]))

// Карточка героя в режиме «Путь героев»: где он на текущей серии
// таймлайна и что с ним происходит.
export default function CharacterCard({ charId, epIdx, onClose }) {
  const ch = CHARACTERS.find((c) => c.id === charId)
  if (!ch) return null
  const reached = (JOURNEYS[charId] || []).filter(
    (st) => globalEp(st.s, st.e) <= epIdx,
  )
  const cur = reached[reached.length - 1]
  return (
    <div className="char-card" role="dialog" aria-label={ch.name}>
      <button className="card-close" onClick={onClose} aria-label="Закрыть">
        <IconClose size={15} />
      </button>
      <div className="char-head">
        <Avatar id={ch.id} size={46} ring={ch.color} />
        <div>
          <h3>{ch.name}</h3>
          {cur ? (
            <div className="char-where">
              Сезон {cur.s}, серия {cur.e} — {LOC[cur.loc]?.name || cur.loc}
            </div>
          ) : (
            <div className="char-where">Ещё не появлялся на таймлайне</div>
          )}
        </div>
      </div>
      {cur && <p className="char-note">{cur.note}</p>}
    </div>
  )
}
