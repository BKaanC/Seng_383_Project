import { useState } from 'react'
import './App.css'
import { loadSession, saveSession } from './api'
import LoginForm from './LoginForm'
import RoleScreen from './RoleScreen'

function Root() {
  const [session, setSession] = useState(loadSession)

  function handleLogin(newSession) {
    saveSession(newSession)
    setSession(newSession)
  }

  if (!session) return <LoginForm onLogin={handleLogin} />
  return <RoleScreen user={session.user} />
}

export default Root