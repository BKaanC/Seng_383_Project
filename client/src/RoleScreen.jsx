import { useState } from 'react'
import AddEventForm from './AddEventForm'
import TaskList from './TaskList'
import WeeklySchedule from './WeeklySchedule'
import WeeklyStats from './WeeklyStats'

// Until child selection (M2) is added, parents and specialists see the demo
// child from the seed data. A child sees their own schedule (FR-M3-04).
const DEMO_CHILD_ID = 1

// FR-M3-01: only parents and specialists add events.
const ROLES_THAT_ADD_EVENTS = ['parent', 'specialist']

// FR-M7-04: the parent and specialists see the weekly statistics.
const ROLES_THAT_SEE_STATS = ['parent', 'specialist']

const ROLE_TITLES = {
  parent: 'Ebeveyn',
  specialist: 'Uzman',
  child: 'Çocuk',
}

function RoleScreen({ user }) {
  const title = ROLE_TITLES[user.role] ?? user.role
  const childId = user.role === 'child' ? user.id : DEMO_CHILD_ID
  const [reloadKey, setReloadKey] = useState(0)
  const [week, setWeek] = useState(null)
  const [taskVersion, setTaskVersion] = useState(0)

  return (
    <main className="app">
      <h1>Synergy</h1>
      <h2>{`${title} ekranı`}</h2>
      <p>Hoş geldin, {user.name}.</p>
      {ROLES_THAT_ADD_EVENTS.includes(user.role) && (
        <AddEventForm childId={childId} onAdded={() => setReloadKey((key) => key + 1)} />
      )}
      <WeeklySchedule childId={childId} reloadKey={reloadKey} onWeekChange={setWeek} />
      {ROLES_THAT_SEE_STATS.includes(user.role) && week && (
        <WeeklyStats childId={childId} week={week} reloadKey={taskVersion} />
      )}
      <TaskList
        childId={childId}
        role={user.role}
        onChanged={() => setTaskVersion((version) => version + 1)}
      />
    </main>
  )
}

export default RoleScreen