import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WeeklyStats from './WeeklyStats'

const stats = {
  week: '2026-11-30',
  total: { done: 2, total: 4, rate: 50 },
  byArea: [
    { area: 'language', done: 2, total: 3, rate: 67 },
    { area: 'motor', done: 0, total: 1, rate: 0 },
    { area: 'social', done: 0, total: 0, rate: null },
    { area: 'cognitive', done: 0, total: 0, rate: null },
    { area: 'self_care', done: 0, total: 0, rate: null },
  ],
}

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('WeeklyStats', () => {
  it('shows the total rate and the rate for each area (FR-M7-02)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(stats))

    render(<WeeklyStats childId={1} week="2026-11-30" />)

    expect(await screen.findByText('Bu hafta tamamlanan görevler: %50 (2/4)')).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Dil' }).getAttribute('aria-valuenow')).toBe('67')
    expect(screen.getByText('%67 (2/3)')).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'Motor' }).getAttribute('aria-valuenow')).toBe('0')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/children/1/stats?week=2026-11-30',
      expect.any(Object)
    )
  })

  it('shows "Görev yok" for an area without tasks (FR-M7-03)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(stats))

    render(<WeeklyStats childId={1} week="2026-11-30" />)

    const list = await screen.findByRole('list', { name: 'Alanlara göre tamamlama' })
    expect(within(list).getAllByText('Görev yok')).toHaveLength(3)
  })

  it('says there are no tasks this week when the total has no rate', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ ...stats, total: { done: 0, total: 0, rate: null } })
    )

    render(<WeeklyStats childId={1} week="2026-12-14" />)

    expect(await screen.findByText('Bu hafta görev yok.')).toBeTruthy()
  })

  it('shows an error when the statistics cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, false, 500))

    render(<WeeklyStats childId={1} week="2026-11-30" />)

    expect((await screen.findByRole('alert')).textContent).toBe('İstatistikler yüklenemedi.')
  })
})
