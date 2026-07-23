import { useEffect, useRef, useState } from 'react'
import {
  CHARACTERS,
  SEASON_OFFSET,
  TOTAL_EPISODES,
  epLabel,
} from '../data/journeys.js'
import Avatar from './Avatars.jsx'
import { IconClose, IconPlay, IconPause } from './Icons.jsx'

// Панель «Путь героев»: таймлайн по сериям + выбор персонажей.
export default function TimelinePanel({
  epIdx,
  setEpIdx,
  activeIds,
  toggleChar,
  onClose,
}) {
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!playing) return
    timerRef.current = setInterval(() => {
      setEpIdx((v) => {
        if (v >= TOTAL_EPISODES) {
          setPlaying(false)
          return v
        }
        return v + 1
      })
    }, 700)
    return () => clearInterval(timerRef.current)
  }, [playing, setEpIdx])

  return (
    <div className="timeline">
      <button className="tl-close" onClick={onClose} aria-label="Закрыть таймлайн">
        <IconClose size={14} />
      </button>
      <div className="tl-chars">
        {CHARACTERS.map((ch) => (
          <button
            key={ch.id}
            className={`tl-chip ${activeIds.has(ch.id) ? 'on' : ''}`}
            style={activeIds.has(ch.id) ? { borderColor: ch.color } : undefined}
            onClick={() => toggleChar(ch.id)}
          >
            <Avatar id={ch.id} size={20} ring={ch.color} />
            {ch.name}
          </button>
        ))}
      </div>
      <div className="tl-row">
        <button
          className="tl-play"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Пауза' : 'Проиграть'}
        >
          {playing ? <IconPause size={14} /> : <IconPlay size={15} />}
        </button>
        <div className="tl-slider-wrap">
          <input
            type="range"
            className="tl-slider"
            min="1"
            max={TOTAL_EPISODES}
            value={epIdx}
            onChange={(e) => {
              setPlaying(false)
              setEpIdx(Number(e.target.value))
            }}
          />
          <div className="tl-seasons">
            {SEASON_OFFSET.slice(0, 8).map((off, i) => (
              <span
                key={i}
                className="tl-season-mark"
                style={{ left: `${(off / TOTAL_EPISODES) * 100}%` }}
              >
                С{i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="tl-label">{epLabel(epIdx)}</div>
      </div>
    </div>
  )
}
