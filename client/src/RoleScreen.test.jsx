import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RoleScreen from './RoleScreen'

const parent = { id: 2, name: 'Ayşe Demir', role: 'parent' }
const specialist = { id: 3, name: 'Zeynep Kaya', role: 'specialist' }
const child = { id: 1, name: 'Ali Demir', role: 'child' }

const swimming = {
  id: 7,
  childId: 1,
  title: 'Yüzme',
  description: null,
  startTime: '2026-11-20T17:00:00',
  endTime: '2026-11-20T18:00:00',
}

// A small fake API: GET returns the saved events, POST saves one.
function fakeApi() {
  const saved = []
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    if (options.method === 'POST') {
      saved.push(swimming)
      return { ok: true, status: 201, json: async () => swimming }
    }
    return { ok: true, status: 200, json: async () => [...saved] }
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 20, 9, 0)) // Friday 20 November 2026
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('RoleScreen', () => {
  it.each([
    ['a parent', parent],
    ['a specialist', specialist],
  ])('shows the add event form and the schedule of the demo child to %s (FR-M3-01)', async (_name, user) => {
    fakeApi()

    render(<RoleScreen user={user} />)

    expect(screen.getByRole('form', { name: 'Etkinlik ekle' })).toBeTruthy()
    await screen.findByText('Pazartesi, 16 Kasım')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/children/1/events?week=2026-11-16',
      expect.anything()
    )
  })

  it('shows a child their own schedule without the add event form (FR-M3-04)', async () => {
    fakeApi()

    render(<RoleScreen user={{ ...child, id: 5 }} />)

    await screen.findByText('Pazartesi, 16 Kasım')
    expect(screen.queryByRole('form', { name: 'Etkinlik ekle' })).toBeNull()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/children/5/events?week=2026-11-16',
      expect.anything()
    )
  })

  it('shows a new event in the schedule right after it is added', async () => {
    fakeApi()

    render(<RoleScreen user={parent} />)
    const friday = await screen.findByRole('region', { name: 'Cuma, 20 Kasım' })
    expect(within(friday).getByText('Etkinlik yok')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: 'Yüzme' } })
    fireEvent.change(screen.getByLabelText('Başlangıç'), { target: { value: '17:00' } })
    fireEvent.change(screen.getByLabelText('Bitiş'), { target: { value: '18:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    expect(await within(friday).findByText('Yüzme')).toBeTruthy()
    expect(within(friday).getByText('17:00–18:00')).toBeTruthy()
  })
})
