import { useEffect, useState } from 'react'
import { authFetch } from './api'
import AssignTaskForm from './AssignTaskForm'
import { AREA_LABELS } from './taskAreas'
import './TaskList.css'


function formatDate(date) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

// FR-M4-02, FR-M4-03: the child sees their tasks and marks them done.
// FR-M4-01, FR-M4-04: a parent or specialist assigns tasks and sees their status.
function TaskList({ childId, role, onChanged }) {
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    authFetch(`/api/children/${childId}/tasks`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Unexpected response')
        if (!ignore) {
          setTasks(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!ignore) setStatus('error')
      })
    return () => {
      ignore = true
    }
  }, [childId])

  async function markDone(task) {
    setError('')
    try {
      const res = await authFetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated = await res.json()
      setTasks((current) => current.map((t) => (t.id === updated.id ? updated : t)))
      onChanged?.()
    } catch {
      setError('Görev güncellenemedi.')
    }
  }

  function handleAssigned(task) {
    setTasks((current) =>
      [...current, task].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id)
    )
    onChanged?.()
  }

  const canAssign = role === 'parent' || role === 'specialist'

  return (
    <section className="task-list" aria-labelledby="task-list-title">
      <h2 id="task-list-title">{role === 'child' ? 'Görevlerim' : 'Görevler'}</h2>

      {status === 'loading' && <p>Yükleniyor…</p>}
      {status === 'error' && (
        <p role="alert" className="error">
          Görevler yüklenemedi.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {status === 'ready' && tasks.length === 0 && <p className="schedule-empty">Henüz görev yok.</p>}
      {status === 'ready' && tasks.length > 0 && (
        <ul className="tasks">
          {tasks.map((task) => (
            <li key={task.id} className={task.status === 'done' ? 'task done' : 'task'}>
              <div className="task-main">
                <strong>{task.title}</strong>
                <span className="task-meta">
                  {AREA_LABELS[task.area] ?? task.area} · Son tarih {formatDate(task.dueDate)} ·{' '}
                  {task.assignedByName}
                </span>
                {task.description && <p>{task.description}</p>}
              </div>
              {task.status === 'done' ? (
                <span className="task-status">Tamamlandı</span>
              ) : role === 'child' ? (
                <button type="button" onClick={() => markDone(task)}>
                  Tamamladım
                </button>
              ) : (
                <span className="task-status pending">Bekliyor</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAssign && <AssignTaskForm childId={childId} onAssigned={handleAssigned} />}
    </section>
  )
}

export default TaskList
