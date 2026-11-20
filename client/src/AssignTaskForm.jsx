import { useState } from 'react'
import { authFetch } from './api'
import { AREA_LABELS } from './taskAreas'

const EMPTY = { title: '', description: '', area: 'language', dueDate: '' }

// FR-M4-01: a parent or specialist assigns a task to the child.
function AssignTaskForm({ childId, onAssigned }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field) {
    return (event) => setForm({ ...form, [field]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await authFetch(`/api/children/${childId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setForm(EMPTY)
      onAssigned(data)
    } catch (err) {
      setError(`Görev kaydedilemedi: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="assign-task-form" onSubmit={handleSubmit} aria-label="Görev ata">
      <h3>Yeni görev ata</h3>
      <label>
        Görev başlığı
        <input value={form.title} onChange={update('title')} required maxLength={100} />
      </label>
      <label>
        Açıklama
        <textarea value={form.description} onChange={update('description')} maxLength={500} />
      </label>
      <label>
        Gelişim alanı
        <select value={form.area} onChange={update('area')}>
          {Object.entries(AREA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Son tarih
        <input type="date" value={form.dueDate} onChange={update('dueDate')} required />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="submit" disabled={saving}>
        Görevi ata
      </button>
    </form>
  )
}

export default AssignTaskForm
