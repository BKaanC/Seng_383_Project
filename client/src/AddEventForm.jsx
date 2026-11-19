import { useState } from 'react'
import { authFetch } from './api'
import { today } from './utils/week'
import './AddEventForm.css'

// FR-M3-01: a parent or a linked specialist adds an event for the child.
// FR-M3-05: an event that ends before it starts is rejected. The form checks
// this first so the message is in Turkish; the server checks it again.

const TITLE_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

function emptyForm() {
  return { title: '', date: today(), startTime: '', endTime: '', description: '' }
}

// Returns a message for the first problem, or '' when the input is fine.
function check(form) {
  if (!form.title.trim()) return 'Başlık gerekli.'
  if (!form.date) return 'Tarih gerekli.'
  if (!form.startTime || !form.endTime) return 'Başlangıç ve bitiş saati gerekli.'
  // "HH:MM" strings compare correctly as text.
  if (form.endTime <= form.startTime) return 'Bitiş saati başlangıç saatinden sonra olmalı.'
  return ''
}

function AddEventForm({ childId, onAdded }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    const problem = check(form)
    setError(problem)
    if (problem) return

    setSubmitting(true)
    try {
      let res
      try {
        res = await authFetch(`/api/children/${childId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } catch {
        throw new Error('Sunucuya ulaşılamadı. Sunucunun çalıştığından emin olun.')
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Etkinlik eklenemedi (HTTP ${res.status})`)
      }
      setForm(emptyForm())
      setMessage(`"${data.title}" eklendi.`)
      onAdded?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="add-event-form" onSubmit={handleSubmit} aria-labelledby="add-event-title">
      <h2 id="add-event-title">Etkinlik ekle</h2>
      <label>
        Başlık
        <input
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          value={form.title}
          onChange={update('title')}
        />
      </label>
      <div className="add-event-row">
        <label>
          Tarih
          <input type="date" value={form.date} onChange={update('date')} />
        </label>
        <label>
          Başlangıç
          <input type="time" value={form.startTime} onChange={update('startTime')} />
        </label>
        <label>
          Bitiş
          <input type="time" value={form.endTime} onChange={update('endTime')} />
        </label>
      </div>
      <label>
        Açıklama (isteğe bağlı)
        <textarea
          rows={2}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={form.description}
          onChange={update('description')}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <button type="submit" disabled={submitting}>
        Ekle
      </button>
    </form>
  )
}

export default AddEventForm
