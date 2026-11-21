import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TaskList from './TaskList'

const pending = {
  id: 7,
  childId: 1,
  assignedBy: 3,
  assignedByName: 'Zeynep Kaya',
  title: 'Read for 20 minutes',
  description: 'Any book you like.',
  area: 'language',
  dueDate: '2026-11-24',
  status: 'pending',
  completedAt: null,
}

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TaskList', () => {
  it('shows the child their tasks with area, due date and assigner', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([pending]))

    render(<TaskList childId={1} role="child" />)

    expect(await screen.findByText('Read for 20 minutes')).toBeTruthy()
    expect(screen.getByText(/Dil · Son tarih 24\.11\.2026 · Zeynep Kaya/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Görevlerim' })).toBeTruthy()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/children/1/tasks', expect.any(Object))
  })

  it('lets the child mark a task done', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([pending]))
      .mockResolvedValueOnce(jsonResponse({ ...pending, status: 'done' }))

    render(<TaskList childId={1} role="child" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tamamladım' }))

    expect(await screen.findByText('Tamamlandı')).toBeTruthy()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/tasks/7')
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual({ status: 'done' })
  })

  it('shows a parent the status and no done button', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([pending]))

    render(<TaskList childId={1} role="parent" />)

    expect(await screen.findByText('Bekliyor')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tamamladım' })).toBeNull()
  })

  it('lets a specialist assign a task that then appears in the list', async () => {
    const created = { ...pending, id: 8, title: 'Tidy your room', area: 'self_care', dueDate: '2026-11-26' }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(created, true, 201))

    render(<TaskList childId={1} role="specialist" />)
    expect(await screen.findByText('Henüz görev yok.')).toBeTruthy()

    const form = screen.getByRole('form', { name: 'Görev ata' })
    fireEvent.change(within(form).getByLabelText('Başlık'), { target: { value: 'Tidy your room' } })
    fireEvent.change(within(form).getByLabelText('Gelişim alanı'), { target: { value: 'self_care' } })
    fireEvent.change(within(form).getByLabelText('Son tarih'), { target: { value: '2026-11-26' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Görevi ata' }))

    expect(await screen.findByText('Tidy your room')).toBeTruthy()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/children/1/tasks')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toMatchObject({
      title: 'Tidy your room',
      area: 'self_care',
      dueDate: '2026-11-26',
    })
  })

  it('shows the server error when a task cannot be saved', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ error: 'dueDate must be in the format YYYY-MM-DD' }, false, 400))

    render(<TaskList childId={1} role="parent" />)
    await screen.findByText('Henüz görev yok.')

    const form = screen.getByRole('form', { name: 'Görev ata' })
    fireEvent.change(within(form).getByLabelText('Başlık'), { target: { value: 'Draw a tree' } })
    fireEvent.change(within(form).getByLabelText('Son tarih'), { target: { value: '2026-11-26' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Görevi ata' }))

    expect((await screen.findByRole('alert')).textContent).toContain('dueDate must be')
  })

  it('shows an error when the tasks cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    render(<TaskList childId={1} role="child" />)

    expect((await screen.findByRole('alert')).textContent).toBe('Görevler yüklenemedi.')
  })
})
