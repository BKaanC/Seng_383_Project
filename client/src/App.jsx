import { useEffect, useState } from 'react'
import './App.css'

// Walking skeleton (v0.0): the demo child from the seed data.
// Login (M1) and child selection (M2) replace this in the next sprints.
const DEMO_CHILD_ID = 1

function formatTime(value) {
  return new Date(value).toLocaleString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetch(`/api/children/${DEMO_CHILD_ID}/events`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setEvents(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main className="app">
      <h1>Synergy</h1>
      <h2>Bu haftanın etkinlikleri</h2>

      {status === 'loading' && <p>Yükleniyor…</p>}
      {status === 'error' && (
        <p role="alert" className="error">
          Etkinlikler yüklenemedi. Sunucunun çalıştığından emin olun.
        </p>
      )}
      {status === 'ready' && events.length === 0 && <p>Bu hafta etkinlik yok.</p>}
      {status === 'ready' && events.length > 0 && (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.title}</strong>
              <span>{formatTime(event.startTime)}</span>
              {event.description && <p>{event.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
