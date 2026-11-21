import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Root from './Root'

const PARENT = { id: 2, name: 'Ayşe Demir', role: 'parent' }
const CHILD = { id: 1, name: 'Ali Demir', role: 'child' }

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Root />
    </MemoryRouter>,
  )
}

function logInAs(user) {
  sessionStorage.setItem(
    'synergy.session',
    JSON.stringify({ token: 'test-token', user }),
  )
}

// The role screens show the weekly schedule, which fetches events.
function mockEmptySchedule() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [],
  })
}

describe('Root', () => {
  it('shows the login form when nobody is logged in', () => {
    renderAt('/')

    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeTruthy()
  })

  it('sends a visitor who is not logged in from a role screen to the login form', () => {
    renderAt('/parent')

    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeTruthy()
  })

  it('shows the screen of the logged-in role after a successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'test-token', user: PARENT }),
    })

    renderAt('/login')
    fireEvent.change(screen.getByLabelText('E-posta'), {
      target: { value: 'ayse@test.com' },
    })
    fireEvent.change(screen.getByLabelText('Şifre'), {
      target: { value: 'Test1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(
      await screen.findByRole('heading', { name: 'Ebeveyn ekranı' }),
    ).toBeTruthy()
    expect(sessionStorage.getItem('synergy.session')).toContain('test-token')
  })

  it("redirects a user who opens another role's screen to their own", async () => {
    logInAs(CHILD)
    mockEmptySchedule()

    renderAt('/parent')

    expect(
      await screen.findByRole('heading', { name: 'Çocuk ekranı' }),
    ).toBeTruthy()
  })

  it('redirects a logged-in user from the login form to their own screen', async () => {
    logInAs(CHILD)
    mockEmptySchedule()

    renderAt('/login')

    expect(
      await screen.findByRole('heading', { name: 'Çocuk ekranı' }),
    ).toBeTruthy()
  })

  it('logs out: clears the session and shows the login form again', () => {
    logInAs(PARENT)
    mockEmptySchedule()

    renderAt('/parent')
    fireEvent.click(screen.getByRole('button', { name: 'Çıkış yap' }))

    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeTruthy()
    expect(sessionStorage.getItem('synergy.session')).toBeNull()
  })
})