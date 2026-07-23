import { CONTINENTS, REGIONS, TYPES } from '../data/regions.js'
import { TypeIcon } from '../map/markers.jsx'
import { IconSearch } from './Icons.jsx'

export default function Sidebar({
  query,
  setQuery,
  typeFilter,
  toggleType,
  regionFilter,
  setRegionFilter,
  results,
  selectedId,
  onPick,
}) {
  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <h1>Известный мир</h1>
        <p className="subtitle">
          Интерактивная карта мира «Песни Льда и Пламени» — без сюжетных спойлеров
        </p>
      </header>

      <div className="search-wrap">
        <IconSearch size={15} />
        <input
          type="search"
          className="search"
          placeholder="Поиск: Винтерфелл, Braavos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="type-chips">
        {Object.entries(TYPES).map(([key, t]) => (
          <button
            key={key}
            className={`chip ${typeFilter.has(key) ? 'on' : ''}`}
            onClick={() => toggleType(key)}
            title={t.name}
          >
            <TypeIcon type={key} size={13} />
            {t.plural}
          </button>
        ))}
      </div>

      <select
        className="region-select"
        value={regionFilter || ''}
        onChange={(e) => setRegionFilter(e.target.value || null)}
      >
        <option value="">Все регионы</option>
        {Object.entries(CONTINENTS).map(([ckey, cname]) => (
          <optgroup key={ckey} label={cname}>
            {Object.entries(REGIONS)
              .filter(([, r]) => r.continent === ckey)
              .map(([rkey, r]) => (
                <option key={rkey} value={rkey}>
                  {r.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>

      <div className="result-count">
        {results.length ? `Локаций: ${results.length}` : 'Ничего не найдено'}
      </div>

      <ul className="loc-list">
        {results.map((loc) => (
          <li key={loc.id}>
            <button
              className={`loc-item ${selectedId === loc.id ? 'sel' : ''}`}
              onClick={() => onPick(loc)}
            >
              <TypeIcon type={loc.type} size={15} />
              <span className="loc-name">{loc.name}</span>
              <span className="loc-region">{REGIONS[loc.region].name}</span>
            </button>
          </li>
        ))}
      </ul>

      <footer className="sidebar-foot">
        Фанатская карта по мотивам мира Джорджа Р. Р. Мартина. Стилизованная
        география, не претендует на картографическую точность.
      </footer>
    </aside>
  )
}
