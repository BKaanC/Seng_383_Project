import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows the events returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          childId: 1,
          title: 'Speech therapy session',
          description: 'Weekly session.',
          startTime: '2026-11-02T10:00:00',
          endTime: '2026-11-02T10:45:00',
        },
      ],
    })

    render(<App />)

    expect(await screen.findByText('Speech therapy session')).toBeTruthy()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/children/1/events')
  })

  it('shows an error message when the API is not reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    render(<App />)

    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})
