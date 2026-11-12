process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

function addEvent(childId, title, startTime, endTime) {
  db.prepare(
    `INSERT INTO events (child_id, title, description, start_time, end_time)
     VALUES (?, ?, NULL, ?, ?)`
  ).run(childId, title, startTime, endTime);
}

beforeEach(() => {
  db.exec('DELETE FROM events');
  // Week of Monday 9 November 2026 is 2026-11-09T00:00 up to 2026-11-16T00:00.
  addEvent(1, 'Sunday before', '2026-11-08T23:59:00', '2026-11-08T23:59:59');
  addEvent(1, 'Friday', '2026-11-13T10:00:00', '2026-11-13T11:00:00');
  addEvent(1, 'Monday start', '2026-11-09T00:00:00', '2026-11-09T01:00:00');
  addEvent(1, 'Sunday end', '2026-11-15T23:59:00', '2026-11-15T23:59:59');
  addEvent(1, 'Next Monday', '2026-11-16T00:00:00', '2026-11-16T01:00:00');
  addEvent(2, 'Other child', '2026-11-10T09:00:00', '2026-11-10T10:00:00');
});

describe('GET /api/children/:childId/events?week=YYYY-MM-DD (FR-M3-02)', () => {
  it('returns only the events of that week, Monday 00:00 to Sunday 23:59, sorted by start time', async () => {
    const res = await request(app).get('/api/children/1/events?week=2026-11-09');

    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.title)).toEqual(['Monday start', 'Friday', 'Sunday end']);
    expect(res.body[0]).toMatchObject({
      childId: 1,
      startTime: '2026-11-09T00:00:00',
      endTime: '2026-11-09T01:00:00',
    });
  });

  it('does not return events of another child', async () => {
    const res = await request(app).get('/api/children/2/events?week=2026-11-09');
    expect(res.body.map((e) => e.title)).toEqual(['Other child']);
  });

  it('returns the previous and next week correctly', async () => {
    const previous = await request(app).get('/api/children/1/events?week=2026-11-02');
    const next = await request(app).get('/api/children/1/events?week=2026-11-16');

    expect(previous.body.map((e) => e.title)).toEqual(['Sunday before']);
    expect(next.body.map((e) => e.title)).toEqual(['Next Monday']);
  });

  it('handles a week that crosses into the next month and year', async () => {
    addEvent(1, 'New year', '2027-01-03T12:00:00', '2027-01-03T13:00:00');

    const res = await request(app).get('/api/children/1/events?week=2026-12-28');
    expect(res.body.map((e) => e.title)).toEqual(['New year']);
  });

  it('returns an empty list for a week without events', async () => {
    const res = await request(app).get('/api/children/1/events?week=2026-12-07');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all of the child’s events when no week is given', async () => {
    const res = await request(app).get('/api/children/1/events');
    expect(res.body).toHaveLength(5);
  });

  it.each([
    ['a date in the wrong format', '09-11-2026', 'week must be in the format YYYY-MM-DD'],
    ['a date that does not exist', '2026-02-30', 'week must be in the format YYYY-MM-DD'],
    ['an empty value', '', 'week must be in the format YYYY-MM-DD'],
    ['a day that is not a Monday', '2026-11-11', 'week must be a Monday'],
  ])('rejects %s', async (_name, week, message) => {
    const res = await request(app).get(`/api/children/1/events?week=${week}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  it('rejects more than one week value', async () => {
    const res = await request(app).get('/api/children/1/events?week=2026-11-09&week=2026-11-16');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid child id', async () => {
    const res = await request(app).get('/api/children/0/events?week=2026-11-09');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid child id');
  });
});
