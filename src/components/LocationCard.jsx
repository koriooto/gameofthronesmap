import { REGIONS, TYPES, CONTINENTS } from '../data/regions.js'
import { HOUSES } from '../data/houses.js'
import { TypeIcon } from '../map/markers.jsx'

export default function LocationCard({ loc, onClose }) {
  const region = REGIONS[loc.region]
  const house = loc.house ? HOUSES[loc.house] : null
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
      {house && (
        <div className="card-house">
          <div>
            <span className="house-label">Герб:</span> {house.sigil}
          </div>
          {house.motto && (
            <div className="house-motto">«{house.motto}»</div>
          )}
        </div>
      )}
    </div>
  )
}
