import { useEffect, useState } from 'react'
import { authFetch } from './api'
import { AREA_LABELS } from './taskAreas'
import './WeeklyStats.css'

// FR-M7-01, FR-M7-02: the week's task completion rate, in total and by area.
// FR-M7-03: "Görev yok" instead of a rate when there are no tasks.
function RateBar({ label, done, total, rate }) {
  return (
    <li className="stat-row">
      <span className="stat-label">{label}</span>
      {rate === null ? (
        <span className="stat-empty">Görev yok</span>
      ) : (
        <>
          <span
            className="stat-bar"
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rate}
          >
            <span className="stat-bar-fill" style={{ width: `${rate}%` }} />
          </span>
          <span className="stat-value">
            %{rate} ({done}/{total})
          </span>
        </>
      )}
    </li>
  )
}

function WeeklyStats({ childId, week, reloadKey = 0 }) {
  const [result, setResult] = useState(null)

  useEffect(() => {
    let ignore = false
    authFetch(`/api/children/${childId}/stats?week=${week}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!data?.total || !Array.isArray(data.byArea)) throw new Error('Unexpected response')
        if (!ignore) setResult({ week, status: 'ready', data })
      })
      .catch(() => {
        if (!ignore) setResult({ week, status: 'error', data: null })
      })
    return () => {
      ignore = true
    }
  }, [childId, week, reloadKey])

  const status = result && result.week === week ? result.status : 'loading'

  return (
    <section className="weekly-stats" aria-labelledby="weekly-stats-title">
      <h2 id="weekly-stats-title">Haftalık istatistik</h2>
      {status === 'loading' && <p>Yükleniyor…</p>}
      {status === 'error' && (
        <p role="alert" className="error">
          İstatistikler yüklenemedi.
        </p>
      )}
      {status === 'ready' && (
        <>
          <p className="stat-total">
            {result.data.total.rate === null
              ? 'Bu hafta görev yok.'
              : `Bu hafta tamamlanan görevler: %${result.data.total.rate} (${result.data.total.done}/${result.data.total.total})`}
          </p>
          <ul className="stat-list" aria-label="Alanlara göre tamamlama">
            {result.data.byArea.map((a) => (
              <RateBar
                key={a.area}
                label={AREA_LABELS[a.area] ?? a.area}
                done={a.done}
                total={a.total}
                rate={a.rate}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default WeeklyStats
