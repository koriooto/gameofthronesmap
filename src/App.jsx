import { useMemo, useRef, useState } from 'react'
import MapView from './components/MapView.jsx'
import TimelinePanel from './components/TimelinePanel.jsx'
import Sidebar from './components/Sidebar.jsx'
import LocationCard from './components/LocationCard.jsx'
import { LOCATIONS } from './data/locations.js'
import { TYPES } from './data/regions.js'
import { TypeIcon } from './map/markers.jsx'
import { CHARACTERS } from './data/journeys.js'
import CharacterCard from './components/CharacterCard.jsx'
import { IconPlus, IconMinus, IconHome, IconWolf } from './components/Icons.jsx'

export default function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(() => new Set())
  const [regionFilter, setRegionFilter] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const mapRef = useRef(null)
  // Режим «Путь героев»: off | warn (предупреждение о спойлерах) | on
  const [journeyMode, setJourneyMode] = useState('off')
  const [epIdx, setEpIdx] = useState(1)
  const [activeChars, setActiveChars] = useState(
    () => new Set(CHARACTERS.slice(0, 4).map((c) => c.id)),
  )
  const [charCardId, setCharCardId] = useState(null)

  const toggleChar = (id) =>
    setActiveChars((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return LOCATIONS.filter((loc) => {
      if (typeFilter.size && !typeFilter.has(loc.type)) return false
      if (regionFilter && loc.region !== regionFilter) return false
      if (q && !loc.name.toLowerCase().includes(q) && !loc.en.toLowerCase().includes(q))
        return false
      return true
    })
  }, [query, typeFilter, regionFilter])

  const visibleIds = useMemo(() => new Set(results.map((l) => l.id)), [results])
  const selected = selectedId ? LOCATIONS.find((l) => l.id === selectedId) : null

  const toggleType = (key) => {
    setTypeFilter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const pick = (loc) => {
    setSelectedId(loc.id)
    mapRef.current?.flyTo(loc.x, loc.y)
    // На телефоне список ниже карты — вернуть карту в поле зрения.
    if (window.innerWidth <= 760) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Выбор региона: обновить фильтр и подлететь к его локациям.
  const chooseRegion = (key) => {
    setRegionFilter(key)
    if (!key) {
      mapRef.current?.reset()
      return
    }
    const locs = LOCATIONS.filter((l) => l.region === key)
    if (!locs.length) return
    const xs = locs.map((l) => l.x)
    const ys = locs.map((l) => l.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const k = Math.max(
      1.1,
      Math.min(3.2, 0.9 * Math.min(2000 / (maxX - minX + 260), 1440 / (maxY - minY + 260))),
    )
    mapRef.current?.flyTo((minX + maxX) / 2, (minY + maxY) / 2, k)
  }

  return (
    <div className="app">
      <Sidebar
        query={query}
        setQuery={setQuery}
        typeFilter={typeFilter}
        toggleType={toggleType}
        regionFilter={regionFilter}
        setRegionFilter={chooseRegion}
        results={results}
        selectedId={selectedId}
        onPick={pick}
      />

      <main className="map-wrap">
        <MapView
          ref={mapRef}
          filtered={Boolean(query.trim()) || typeFilter.size > 0 || Boolean(regionFilter)}
          journeys={
            journeyMode === 'on'
              ? { epIdx, activeIds: activeChars, onSelectChar: setCharCardId }
              : null
          }
          visibleIds={visibleIds}
          regionFilter={regionFilter}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRegionClick={(key) => {
            // Повторный клик по выбранному региону снимает фильтр,
            // но вид карты не трогаем — без неожиданных «отзумов».
            if (key === regionFilter) setRegionFilter(null)
            else chooseRegion(key)
          }}
          onBackgroundTap={() => setRegionFilter(null)}
        />

        <button
          className={`journey-toggle ${journeyMode === 'on' ? 'on' : ''}`}
          onClick={() =>
            setJourneyMode((m) => (m === 'on' ? 'off' : m === 'off' ? 'warn' : 'off'))
          }
        >
          <IconWolf size={17} /> Путь героев
        </button>

        {journeyMode === 'warn' && (
          <div className="journey-warn">
            <b>Осторожно, спойлеры!</b>
            <p>
              Маршруты героев раскрывают события всех сезонов сериала. Двигайте
              таймлайн только до серии, которую вы досмотрели.
            </p>
            <div className="jw-buttons">
              <button className="jw-ok" onClick={() => setJourneyMode('on')}>
                Показать
              </button>
              <button className="jw-no" onClick={() => setJourneyMode('off')}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {journeyMode === 'on' && charCardId && (
          <CharacterCard
            charId={charCardId}
            epIdx={epIdx}
            onClose={() => setCharCardId(null)}
          />
        )}

        {journeyMode === 'on' && (
          <TimelinePanel
            epIdx={epIdx}
            setEpIdx={setEpIdx}
            activeIds={activeChars}
            toggleChar={toggleChar}
            onClose={() => setJourneyMode('off')}
          />
        )}

        <div className="zoom-controls">
          <button onClick={() => mapRef.current?.zoomBy(1.5)} aria-label="Приблизить"><IconPlus /></button>
          <button onClick={() => mapRef.current?.zoomBy(1 / 1.5)} aria-label="Отдалить"><IconMinus /></button>
          <button onClick={() => mapRef.current?.reset()} aria-label="Вся карта"><IconHome /></button>
        </div>

        {journeyMode !== 'on' && (
        <div className="legend">
          {Object.entries(TYPES).map(([key, t]) => (
            <span key={key} className="legend-item">
              <TypeIcon type={key} size={13} /> {t.name}
            </span>
          ))}
        </div>
        )}

        {selected && (
          <LocationCard loc={selected} onClose={() => setSelectedId(null)} />
        )}
      </main>
    </div>
  )
}
