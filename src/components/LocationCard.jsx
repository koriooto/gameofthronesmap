import { REGIONS, TYPES, CONTINENTS } from '../data/regions.js'
import { TypeIcon } from '../map/markers.jsx'

export default function LocationCard({ loc, onClose }) {
  const region = REGIONS[loc.region]
  return (
    <div className="loc-card" role="dialog" aria-label={loc.name}>
      <button className="card-close" onClick={onClose} aria-label="Закрыть">
        ✕
      </button>
      <div className="card-title">
        <TypeIcon type={loc.type} size={20} />
        <div>
          <h2>{loc.name}</h2>
          <div className="card-en">{loc.en}</div>
        </div>
      </div>
      <div className="card-meta">
        <span className="badge">{TYPES[loc.type].name}</span>
        <span className="badge">
          {region.name} · {CONTINENTS[region.continent]}
        </span>
        {loc.house && <span className="badge house">{loc.house}</span>}
      </div>
      <p className="card-desc">{loc.desc}</p>
    </div>
  )
}
