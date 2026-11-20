import TaskList from './TaskList'
import WeeklySchedule from './WeeklySchedule'

// Until child selection (M2) is added, parents and specialists see the demo
// child from the seed data. A child sees their own schedule (FR-M3-04).
const DEMO_CHILD_ID = 1

const ROLE_TITLES = {
  parent: 'Ebeveyn',
  specialist: 'Uzman',
  child: 'Çocuk',
}

function RoleScreen({ user }) {
  const title = ROLE_TITLES[user.role] ?? user.role
  const childId = user.role === 'child' ? user.id : DEMO_CHILD_ID

  return (
    <main className="app">
      <h1>Synergy</h1>
      <h2>{`${title} ekranı`}</h2>
      <p>Hoş geldin, {user.name}.</p>
      <WeeklySchedule childId={childId} />
      <TaskList childId={childId} role={user.role} />
    </main>
  )
}

export default RoleScreen