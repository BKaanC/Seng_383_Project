import { useEffect, useState } from 'react'
import { authFetch } from './api'
import { addDays, dayLabel, mondayOf, today, weekDays, weekLabel } from './utils/week'
import './WeeklySchedule.css'

// FR-M3-02: the child's events of one week, grouped by day from Monday to Sunday.
// FR-M3-03: buttons move to the previous and the next week.
// When reloadKey changes (e.g. after an event is added), the week is loaded again.
// startTime and endTime come from the API as '2026-11-09T17:00:00'.

function timeOf(dateTime) {
  return dateTime.slice(11, 16)
}

function WeeklySchedule({ childId, initialWeek, reloadKey = 0 }) {
  const [week, setWeek] = useState(() => initialWeek ?? mondayOf(today()))
  // The result remembers which week it belongs to, so an answer for an older
  // week is never shown as the current one.
  const [result, setResult] = useState(null)

  useEffect(() => {
    let ignore = false
    authFetch(`/api/children/${childId}/events?week=${week}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((events) => {
        if (!Array.isArray(events)) throw new Error('Unexpected response')
        if (!ignore) setResult({ week, status: 'ready', events })
      })
      .catch(() => {
        if (!ignore) setResult({ week, status: 'error', events: [] })
      })
    return () => {
      ignore = true
    }
  }, [childId, week, reloadKey])

  const status = result && result.week === week ? result.status : 'loading'
  const events = status === 'ready' ? result.events : []

  return (
    <section className="weekly-schedule" aria-labelledby="weekly-schedule-title">
      <div className="schedule-header">
        <button type="button" onClick={() => setWeek(addDays(week, -7))}>
          ← Önceki hafta
        </button>
        <h2 id="weekly-schedule-title">{weekLabel(week)}</h2>
        <button type="button" onClick={() => setWeek(addDays(week, 7))}>
          Sonraki hafta →
        </button>
      </div>

      {status === 'loading' && <p>Yükleniyor…</p>}
      {status === 'error' && (
        <p role="alert" className="error">
          Etkinlikler yüklenemedi. Sunucunun çalıştığından emin olun.
        </p>
      )}
      {status === 'ready' &&
        weekDays(week).map((day) => {
          const dayEvents = events.filter((event) => event.startTime.startsWith(day))
          return (
            <section key={day} className="schedule-day" aria-label={dayLabel(day)}>
              <h3>{dayLabel(day)}</h3>
              {dayEvents.length === 0 ? (
                <p className="schedule-empty">Etkinlik yok</p>
              ) : (
                <ul className="event-list">
                  {dayEvents.map((event) => (
                    <li key={event.id}>
                      <span className="event-time">
                        {timeOf(event.startTime)}–{timeOf(event.endTime)}
                      </span>
                      <strong>{event.title}</strong>
                      {event.description && <p>{event.description}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
    </section>
  )
}

export default WeeklySchedule
