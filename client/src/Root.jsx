import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import './Root.css'
import { clearSession, loadSession, saveSession } from './api'
import LoginForm from './LoginForm'
import RoleScreen from './RoleScreen'

const ROLES = ['parent', 'specialist', 'child']


function homePath(session) {
  return session ? `/${session.user.role}` : '/login'
}


function ProtectedScreen({ session, role, onLogout }) {
  if (!session) return <Navigate to="/login" replace />
  if (session.user.role !== role) {
    return <Navigate to={homePath(session)} replace />
  }
  return (
    <>
      <header className="app-header">
        <button type="button" onClick={onLogout}>
          Çıkış yap
        </button>
      </header>
      <RoleScreen user={session.user} />
    </>
  )
}

function Root() {
  const [session, setSession] = useState(loadSession)
  const navigate = useNavigate()

  function handleLogin(newSession) {
    saveSession(newSession)
    setSession(newSession)
    navigate(homePath(newSession), { replace: true })
  }

  
  function handleLogout() {
    clearSession()
    setSession(null)
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to={homePath(session)} replace />
          ) : (
            <LoginForm onLogin={handleLogin} />
          )
        }
      />
      {ROLES.map((role) => (
        <Route
          key={role}
          path={`/${role}`}
          element={
            <ProtectedScreen
              session={session}
              role={role}
              onLogout={handleLogout}
            />
          }
        />
      ))}
      <Route path="*" element={<Navigate to={homePath(session)} replace />} />
    </Routes>
  )
}

export default Root