process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeEach(() => {
  db.exec('DELETE FROM events');
  db.prepare(
    `INSERT INTO events (child_id, title, description, start_time, end_time)
     VALUES (?, ?, ?, ?, ?)`
  ).run(1, 'Reading time', 'Read one chapter.', '2026-11-03T16:00:00', '2026-11-03T16:30:00');
  db.prepare(
    `INSERT INTO events (child_id, title, description, start_time, end_time)
     VALUES (?, ?, ?, ?, ?)`
  ).run(1, 'Speech therapy session', null, '2026-11-02T10:00:00', '2026-11-02T10:45:00');
  db.prepare(
    `INSERT INTO events (child_id, title, description, start_time, end_time)
     VALUES (?, ?, ?, ?, ?)`
  ).run(2, 'Other child event', null, '2026-11-02T09:00:00', '2026-11-02T09:30:00');
});

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/children/:childId/events', () => {
  it('returns only the events of the given child, sorted by start time', async () => {
    const res = await request(app).get('/api/children/1/events');
    expect(res.status).toBe(200);
    expect(res.body.map((e) => e.title)).toEqual(['Speech therapy session', 'Reading time']);
    expect(res.body[0]).toMatchObject({ childId: 1, startTime: '2026-11-02T10:00:00' });
  });

  it('returns an empty list for a child with no events', async () => {
    const res = await request(app).get('/api/children/99/events');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('rejects an invalid child id', async () => {
    const res = await request(app).get('/api/children/abc/events');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
