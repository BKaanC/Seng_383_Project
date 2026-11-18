import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WeeklySchedule from './WeeklySchedule'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function mockEvents(events) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => events,
  })
}

const events = [
  {
    id: 1,
    childId: 1,
    title: 'Speech therapy session',
    description: 'Weekly session.',
    startTime: '2026-11-09T10:00:00',
    endTime: '2026-11-09T10:45:00',
  },
  {
    id: 2,
    childId: 1,
    title: 'Swimming',
    description: null,
    startTime: '2026-11-13T17:00:00',
    endTime: '2026-11-13T18:00:00',
  },
  {
    id: 3,
    childId: 1,
    title: 'Reading time',
    description: null,
    startTime: '2026-11-13T19:30:00',
    endTime: '2026-11-13T20:00:00',
  },
]

describe('WeeklySchedule (FR-M3-02)', () => {
  it('asks the API for the events of the given week', async () => {
    mockEvents([])

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    expect(await screen.findByText('Pazartesi, 9 Kasım')).toBeTruthy()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/children/1/events?week=2026-11-09',
      expect.anything()
    )
  })

  it('shows the week as the title and the seven days from Monday to Sunday', async () => {
    mockEvents([])

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('9–15 Kasım 2026')
    const days = await screen.findAllByRole('heading', { level: 3 })
    expect(days.map((day) => day.textContent)).toEqual([
      'Pazartesi, 9 Kasım',
      'Salı, 10 Kasım',
      'Çarşamba, 11 Kasım',
      'Perşembe, 12 Kasım',
      'Cuma, 13 Kasım',
      'Cumartesi, 14 Kasım',
      'Pazar, 15 Kasım',
    ])
  })

  it('shows each event under its own day with its time', async () => {
    mockEvents(events)

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    const monday = await screen.findByRole('region', { name: 'Pazartesi, 9 Kasım' })
    expect(within(monday).getByText('Speech therapy session')).toBeTruthy()
    expect(within(monday).getByText('10:00–10:45')).toBeTruthy()
    expect(within(monday).getByText('Weekly session.')).toBeTruthy()

    const friday = screen.getByRole('region', { name: 'Cuma, 13 Kasım' })
    const titles = within(friday)
      .getAllByRole('listitem')
      .map((item) => within(item).getByRole('strong').textContent)
    expect(titles).toEqual(['Swimming', 'Reading time'])
  })

  it('shows "Etkinlik yok" on days without events', async () => {
    mockEvents(events)

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    const tuesday = await screen.findByRole('region', { name: 'Salı, 10 Kasım' })
    expect(within(tuesday).getByText('Etkinlik yok')).toBeTruthy()
    expect(screen.getAllByText('Etkinlik yok')).toHaveLength(5)
  })

  it('shows the current week when no week is given', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 18, 12, 0)) // Wednesday 18 November 2026
    mockEvents([])

    render(<WeeklySchedule childId={1} />)

    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('16–22 Kasım 2026')
    await screen.findByText('Pazartesi, 16 Kasım')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/children/1/events?week=2026-11-16',
      expect.anything()
    )
  })

  it('sends the saved login token', async () => {
    sessionStorage.setItem(
      'synergy.session',
      JSON.stringify({ token: 'test-token', user: { id: 2, name: 'Ayşe', role: 'parent' } })
    )
    mockEvents([])

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    await screen.findByText('Pazartesi, 9 Kasım')
    const [, options] = globalThis.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer test-token')
  })

  it('shows a loading message until the events arrive', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    expect(screen.getByText('Yükleniyor…')).toBeTruthy()
  })

  it('shows an error message when the API is not reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    expect(await screen.findByRole('alert')).toBeTruthy()
  })

  it('shows an error message when the API answers with an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)

    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})

describe('WeeklySchedule week buttons (FR-M3-03)', () => {
  it('moves to the next week and loads its events', async () => {
    mockEvents([])

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)
    await screen.findByText('Pazartesi, 9 Kasım')
    fireEvent.click(screen.getByRole('button', { name: 'Sonraki hafta →' }))

    expect(await screen.findByText('Pazartesi, 16 Kasım')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('16–22 Kasım 2026')
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      '/api/children/1/events?week=2026-11-16',
      expect.anything()
    )
  })

  it('moves to the previous week, also across a month', async () => {
    mockEvents([])

    render(<WeeklySchedule childId={1} initialWeek="2026-11-02" />)
    await screen.findByText('Pazartesi, 2 Kasım')
    fireEvent.click(screen.getByRole('button', { name: '← Önceki hafta' }))

    expect(await screen.findByText('Pazartesi, 26 Ekim')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('26 Ekim – 1 Kasım 2026')
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      '/api/children/1/events?week=2026-10-26',
      expect.anything()
    )
  })

  it('does not show a late answer for a week the user already left', async () => {
    let answerFirstWeek
    vi.spyOn(globalThis, 'fetch')
      .mockReturnValueOnce(new Promise((resolve) => (answerFirstWeek = resolve)))
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<WeeklySchedule childId={1} initialWeek="2026-11-09" />)
    fireEvent.click(screen.getByRole('button', { name: 'Sonraki hafta →' }))
    await screen.findByText('Pazartesi, 16 Kasım')

    answerFirstWeek({ ok: true, json: async () => events })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.queryByText('Speech therapy session')).toBeNull()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('16–22 Kasım 2026')
  })
})
