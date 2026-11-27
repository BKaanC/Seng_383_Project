process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { signToken } = require('../auth');
const { completionRate } = require('../services/statsService');

const users = {
  child: { id: 1, role: 'child' },
  parent: { id: 2, role: 'parent' },
  specialist: { id: 3, role: 'specialist' },
  otherParent: { id: 5, role: 'parent' },
};

function auth(user) {
  return { Authorization: `Bearer ${signToken(user)}` };
}

const WEEK = '2026-11-30';

beforeEach(() => {
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM users');
  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, parent_id) VALUES (?, ?, ?, 'x', ?, ?)"
  );
  insertUser.run(2, 'Ayşe Demir', 'ayse@test.com', 'parent', null);
  insertUser.run(1, 'Ali Demir', 'ali@test.com', 'child', 2);
  insertUser.run(3, 'Zeynep Kaya', 'zeynep@test.com', 'specialist', null);
  insertUser.run(5, 'Can Öz', 'can@test.com', 'parent', null);
  insertUser.run(6, 'Ece Öz', 'ece@test.com', 'child', 5);

  const insertTask = db.prepare(
    `INSERT INTO tasks (child_id, assigned_by, title, area, due_date, status)
     VALUES (?, 3, ?, ?, ?, ?)`
  );
  // In the week of 30 Nov: language 2 of 3 done, motor 0 of 1.
  insertTask.run(1, 'Read', 'language', '2026-11-30', 'done');
  insertTask.run(1, 'Name animals', 'language', '2026-12-02', 'done');
  insertTask.run(1, 'Tell a story', 'language', '2026-12-06', 'pending');
  insertTask.run(1, 'Jump rope', 'motor', '2026-12-03', 'pending');
  // Outside the week and for another child: not counted.
  insertTask.run(1, 'Last week', 'social', '2026-11-29', 'done');
  insertTask.run(1, 'Next week', 'social', '2026-12-07', 'done');
  insertTask.run(6, 'Other child', 'language', '2026-12-01', 'done');
});

function getStats(user, week = WEEK, childId = 1) {
  return request(app).get(`/api/children/${childId}/stats?week=${week}`).set(auth(user));
}

describe('completionRate', () => {
  it('rounds to a whole percentage and is null without tasks (FR-M7-01, FR-M7-03)', () => {
    expect(completionRate(2, 3)).toBe(67);
    expect(completionRate(0, 1)).toBe(0);
    expect(completionRate(4, 4)).toBe(100);
    expect(completionRate(0, 0)).toBeNull();
  });
});

describe('GET /api/children/:childId/stats', () => {
  it('returns the completion rate for the week in total and by area (FR-M7-02)', async () => {
    const res = await getStats(users.parent);

    expect(res.status).toBe(200);
    expect(res.body.week).toBe(WEEK);
    expect(res.body.total).toEqual({ done: 2, total: 4, rate: 50 });
    const byArea = Object.fromEntries(res.body.byArea.map((a) => [a.area, a]));
    expect(byArea.language).toEqual({ area: 'language', done: 2, total: 3, rate: 67 });
    expect(byArea.motor).toEqual({ area: 'motor', done: 0, total: 1, rate: 0 });
  });

  it('lists every area and gives no rate for an area without tasks (FR-M7-03)', async () => {
    const res = await getStats(users.parent);

    expect(res.body.byArea.map((a) => a.area)).toEqual([
      'language',
      'motor',
      'social',
      'cognitive',
      'self_care',
    ]);
    const social = res.body.byArea.find((a) => a.area === 'social');
    expect(social).toEqual({ area: 'social', done: 0, total: 0, rate: null });
  });

  it('gives no total rate for a week without tasks', async () => {
    const res = await getStats(users.parent, '2026-12-14');
    expect(res.body.total).toEqual({ done: 0, total: 0, rate: null });
  });

  it('shows the statistics to a specialist (FR-M7-04)', async () => {
    const res = await getStats(users.specialist);
    expect(res.status).toBe(200);
  });

  it('does not show the statistics to another family’s parent', async () => {
    const res = await getStats(users.otherParent);
    expect(res.status).toBe(403);
  });

  it('does not show the statistics to the child', async () => {
    const res = await getStats(users.child);
    expect(res.status).toBe(403);
  });

  it('rejects a week that is missing or not a Monday', async () => {
    expect((await request(app).get('/api/children/1/stats').set(auth(users.parent))).status).toBe(400);
    expect((await getStats(users.parent, '2026-12-01')).status).toBe(400);
  });

  it('returns 404 for a child that does not exist and 400 for an invalid id', async () => {
    expect((await getStats(users.specialist, WEEK, 99)).status).toBe(404);
    expect((await getStats(users.specialist, WEEK, 'abc')).status).toBe(400);
  });

  it('requires a login', async () => {
    const res = await request(app).get(`/api/children/1/stats?week=${WEEK}`);
    expect(res.status).toBe(401);
  });
});
