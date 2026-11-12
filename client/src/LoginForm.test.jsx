import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoginForm from './LoginForm'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function fillAndSubmit(email, password) {
  fireEvent.change(screen.getByLabelText('E-posta'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Şifre'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
}

describe('LoginForm', () => {
  it('sends the credentials and passes the session to onLogin', async () => {
    const session = {
      token: 'test-token',
      user: { id: 1, name: 'Ali Demir', role: 'child' },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => session,
    })
    const onLogin = vi.fn()

    render(<LoginForm onLogin={onLogin} />)
    fillAndSubmit('ali@test.com', 'Test1234')

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(session))
    const [url, options] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('/api/login')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      email: 'ali@test.com',
      password: 'Test1234',
    })
  })

  it('shows the error message sent by the server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid email or password' }),
    })
    const onLogin = vi.fn()

    render(<LoginForm onLogin={onLogin} />)
    fillAndSubmit('ali@test.com', 'wrong')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Invalid email or password')
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('shows a message when the server is not reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    render(<LoginForm onLogin={vi.fn()} />)
    fillAndSubmit('ali@test.com', 'Test1234')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Sunucuya ulaşılamadı')
  })
})