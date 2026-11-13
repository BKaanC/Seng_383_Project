import { describe, expect, it } from 'vitest'
import { addDays, mondayOf, today, weekDays, weekLabel } from './week'

describe('today', () => {
  it('uses the local date, not UTC', () => {
    // 13 November 2026, 00:30 local time.
    expect(today(new Date(2026, 10, 13, 0, 30))).toBe('2026-11-13')
  })

  it('pads the month and the day with zeros', () => {
    expect(today(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('addDays', () => {
  it('moves forward and back', () => {
    expect(addDays('2026-11-09', 7)).toBe('2026-11-16')
    expect(addDays('2026-11-09', -7)).toBe('2026-11-02')
  })

  it('crosses the end of a month and a year', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('mondayOf', () => {
  it.each([
    ['a Monday', '2026-11-09'],
    ['a Wednesday', '2026-11-11'],
    ['a Sunday', '2026-11-15'],
  ])('returns the Monday of the week for %s', (_name, date) => {
    expect(mondayOf(date)).toBe('2026-11-09')
  })

  it('goes back into the previous month and year', () => {
    expect(mondayOf('2027-01-03')).toBe('2026-12-28')
  })
})

describe('weekDays', () => {
  it('returns the seven days from Monday to Sunday', () => {
    expect(weekDays('2026-11-30')).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-05',
      '2026-12-06',
    ])
  })
})

describe('weekLabel', () => {
  it('shows the month once when the week is in one month', () => {
    expect(weekLabel('2026-11-09')).toBe('9–15 Kasım 2026')
  })

  it('shows both months when the week crosses into the next month', () => {
    expect(weekLabel('2026-11-30')).toBe('30 Kasım – 6 Aralık 2026')
  })

  it('shows both years when the week crosses into the next year', () => {
    expect(weekLabel('2026-12-28')).toBe('28 Aralık 2026 – 3 Ocak 2027')
  })
})
