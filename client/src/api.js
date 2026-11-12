const STORAGE_KEY = 'synergy.session'


export function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session && session.token && session.user ? session : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}


export function authFetch(url, options = {}) {
  const session = loadSession()
  const headers = { ...options.headers }
  if (session) headers.Authorization = `Bearer ${session.token}`
  return fetch(url, { ...options, headers })
}


export async function login(email, password) {
  let res
  try {
    res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new Error('Sunucuya ulaşılamadı. Sunucunun çalıştığından emin olun.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Giriş başarısız (HTTP ${res.status})`)
  }
  return data
}