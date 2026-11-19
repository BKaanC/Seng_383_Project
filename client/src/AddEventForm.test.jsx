import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AddEventForm from './AddEventForm'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function fill({ title, date, startTime, endTime, description }) {
  if (title !== undefined) {
    fireEvent.change(screen.getByLabelText('Başlık'), { target: { value: title } })
  }
  if (date !== undefined) {
    fireEvent.change(screen.getByLabelText('Tarih'), { target: { value: date } })
  }
  if (startTime !== undefined) {
    fireEvent.change(screen.getByLabelText('Başlangıç'), { target: { value: startTime } })
  }
  if (endTime !== undefined) {
    fireEvent.change(screen.getByLabelText('Bitiş'), { target: { value: endTime } })
  }
  if (description !== undefined) {
    fireEvent.change(screen.getByLabelText('Açıklama (isteğe bağlı)'), {
      target: { value: description },
    })
  }
}

const valid = {
  title: 'Yüzme',
  date: '2026-11-20',
  startTime: '17:00',
  endTime: '18:00',
  description: 'Havlu getir.',
}

const saved = {
  id: 7,
  childId: 1,
  title: 'Yüzme',
  description: 'Havlu getir.',
  startTime: '2026-11-20T17:00:00',
  endTime: '2026-11-20T18:00:00',
}

function mockAnswer(status, body) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
}

describe('AddEventForm (FR-M3-01)', () => {
  it('starts with today as the date', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 19, 9, 0))

    render(<AddEventForm childId={1} />)

    expect(screen.getByLabelText('Tarih').value).toBe('2026-11-19')
  })

  it('sends the event to the API with the login token', async () => {
    sessionStorage.setItem(
      'synergy.session',
      JSON.stringify({ token: 'test-token', user: { id: 2, name: 'Ayşe', role: 'parent' } })
    )
    mockAnswer(201, saved)

    render(<AddEventForm childId={1} />)
    fill(valid)
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    await screen.findByRole('status')
    const [url, options] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('/api/children/1/events')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer test-token')
    expect(JSON.parse(options.body)).toEqual(valid)
  })

  it('reports the saved event, shows a message and clears the form', async () => {
    mockAnswer(201, saved)
    const onAdded = vi.fn()

    render(<AddEventForm childId={1} onAdded={onAdded} />)
    fill(valid)
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    expect((await screen.findByRole('status')).textContent).toBe('"Yüzme" eklendi.')
    expect(onAdded).toHaveBeenCalledWith(saved)
    expect(screen.getByLabelText('Başlık').value).toBe('')
    expect(screen.getByLabelText('Başlangıç').value).toBe('')
  })

  it('disables the button while the event is being saved', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}))

    render(<AddEventForm childId={1} />)
    fill(valid)
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    expect(screen.getByRole('button', { name: 'Ekle' }).disabled).toBe(true)
  })
})

describe('AddEventForm checks (FR-M3-05)', () => {
  it.each([
    ['an end time before the start time', { endTime: '16:00' }, 'Bitiş saati başlangıç saatinden sonra olmalı.'],
    ['an end time equal to the start time', { endTime: '17:00' }, 'Bitiş saati başlangıç saatinden sonra olmalı.'],
    ['a blank title', { title: '   ' }, 'Başlık gerekli.'],
    ['a missing date', { date: '' }, 'Tarih gerekli.'],
    ['a missing start time', { startTime: '' }, 'Başlangıç ve bitiş saati gerekli.'],
  ])('rejects %s without calling the API', (_name, change, message) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    render(<AddEventForm childId={1} />)
    fill({ ...valid, ...change })
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    expect(screen.getByRole('alert').textContent).toBe(message)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows the error from the server and keeps the input', async () => {
    mockAnswer(400, { error: 'title must be at most 100 characters' })
    const onAdded = vi.fn()

    render(<AddEventForm childId={1} onAdded={onAdded} />)
    fill(valid)
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'title must be at most 100 characters'
    )
    expect(onAdded).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Başlık').value).toBe('Yüzme')
    expect(screen.getByRole('button', { name: 'Ekle' }).disabled).toBe(false)
  })

  it('shows a message when the server is not reachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    render(<AddEventForm childId={1} />)
    fill(valid)
    fireEvent.click(screen.getByRole('button', { name: 'Ekle' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Sunucuya ulaşılamadı. Sunucunun çalıştığından emin olun.'
    )
  })
})
