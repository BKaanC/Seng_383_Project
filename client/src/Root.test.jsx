import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Root from './Root'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('Root', () => {
  it('shows the login form when nobody is logged in', () => {
    render(<Root />)

    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeTruthy()
  })

  it('shows the screen of the logged-in role after a successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { id: 2, name: 'Ayşe Demir', role: 'parent' },
      }),
    })

    render(<Root />)
    fireEvent.change(screen.getByLabelText('E-posta'), {
      target: { value: 'ayse@test.com' },
    })
    fireEvent.change(screen.getByLabelText('Şifre'), {
      target: { value: 'Test1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))

    expect(await screen.findByText('Ebeveyn ekranı')).toBeTruthy()
    expect(sessionStorage.getItem('synergy.session')).toContain('test-token')
  })
})