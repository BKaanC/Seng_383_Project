// Helpers for the weekly schedule (FR-M3-02, FR-M3-03).
// Dates are passed around as 'YYYY-MM-DD' strings, the same format the API uses
// for ?week=. The calculations use UTC so the result does not depend on the
// time zone of the browser.

function parse(dateString) {
  return new Date(`${dateString}T00:00:00Z`)
}

function format(date) {
  return date.toISOString().slice(0, 10)
}

// Today's date in the user's own time zone, e.g. '2026-11-13'.
export function today(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDays(dateString, days) {
  const date = parse(dateString)
  date.setUTCDate(date.getUTCDate() + days)
  return format(date)
}

// The Monday of the week the date is in. Weeks run from Monday to Sunday.
export function mondayOf(dateString) {
  const daysSinceMonday = (parse(dateString).getUTCDay() + 6) % 7
  return addDays(dateString, -daysSinceMonday)
}

// The seven dates of the week, Monday first.
export function weekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

const dayAndMonth = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})
const monthName = new Intl.DateTimeFormat('tr-TR', { month: 'long', timeZone: 'UTC' })

// e.g. '9–15 Kasım 2026', '30 Kasım – 6 Aralık 2026', '28 Aralık 2026 – 3 Ocak 2027'
export function weekLabel(monday) {
  const start = parse(monday)
  const end = parse(addDays(monday, 6))
  const startYear = start.getUTCFullYear()
  const endYear = end.getUTCFullYear()

  if (startYear !== endYear) {
    return `${dayAndMonth.format(start)} ${startYear} – ${dayAndMonth.format(end)} ${endYear}`
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${dayAndMonth.format(start)} – ${dayAndMonth.format(end)} ${endYear}`
  }
  return `${start.getUTCDate()}–${end.getUTCDate()} ${monthName.format(end)} ${endYear}`
}
