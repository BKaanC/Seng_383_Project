process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../app');
const db = require('../db');
const { signToken } = require('../auth');

// Users: parent 2 with child 1, another parent 5 with child 6, specialist 3.
const users = {
  child: { id: 1, role: 'child' },
  parent: { id: 2, role: 'parent' },
  specialist: { id: 3, role: 'specialist' },
  otherParent: { id: 5, role: 'parent' },
  otherChild: { id: 6, role: 'child' },
};

function auth(user) {
  return { Authorization: `Bearer ${signToken(user)}` };
}

const valid = {
  title: '  Read for 20 minutes  ',
  description: 'Any book you like.',
  area: 'language',
  dueDate: '2026-11-25',
};

beforeEach(() => {
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM users');
  const insert = db.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, parent_id) VALUES (?, ?, ?, 'x', ?, ?)"
  );
  insert.run(2, 'Ayşe Demir', 'ayse@test.com', 'parent', null);
  insert.run(1, 'Ali Demir', 'ali@test.com', 'child', 2);
  insert.run(3, 'Zeynep Kaya', 'zeynep@test.com', 'specialist', null);
  insert.run(5, 'Can Öz', 'can@test.com', 'parent', null);
  insert.run(6, 'Ece Öz', 'ece@test.com', 'child', 5);
});

function assign(user = users.specialist, body = valid, childId = 1) {
  return request(app).post(`/api/children/${childId}/tasks`).set(auth(user)).send(body);
}

describe('POST /api/children/:childId/tasks', () => {
  it('lets a specialist assign a task and returns it as pending (FR-M4-01)', async () => {
    const res = await assign();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      childId: 1,
      assignedBy: 3,
      assignedByName: 'Zeynep Kaya',
      title: 'Read for 20 minutes',
      description: 'Any book you like.',
      area: 'language',
      dueDate: '2026-11-25',
      status: 'pending',
      completedAt: null,
    });
  });

  it('lets the parent of the child assign a task', async () => {
    const res = await assign(users.parent);
    expect(res.status).toBe(201);
    expect(res.body.assignedBy).toBe(2);
  });

  it.each([
    ['no title', { ...valid, title: '   ' }],
    ['no area', { ...valid, area: undefined }],
    ['an unknown area', { ...valid, area: 'music' }],
    ['no due date', { ...valid, dueDate: undefined }],
    ['a due date that does not exist', { ...valid, dueDate: '2026-02-30' }],
    ['a title that is too long', { ...valid, title: 'a'.repeat(101) }],
  ])('rejects a task with %s (FR-M4-05)', async (_, body) => {
    const res = await assign(users.specialist, body);
    expect(res.status).toBe(400);
    expect(db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n).toBe(0);
  });

  it('does not let a child assign tasks', async () => {
    const res = await assign(users.child);
    expect(res.status).toBe(403);
  });

  it('does not let a parent assign tasks to another family’s child', async () => {
    const res = await assign(users.otherParent);
    expect(res.status).toBe(403);
  });

  it('returns 404 when the child does not exist', async () => {
    const res = await assign(users.specialist, valid, 99);
    expect(res.status).toBe(404);
  });

  it('requires a login', async () => {
    const res = await request(app).post('/api/children/1/tasks').send(valid);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/children/:childId/tasks', () => {
  it('shows the child their own tasks (FR-M4-02)', async () => {
    await assign();
    await assign(users.parent, { ...valid, title: 'Tidy your room', area: 'self_care', dueDate: '2026-11-24' });

    const res = await request(app).get('/api/children/1/tasks').set(auth(users.child));

    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['Tidy your room', 'Read for 20 minutes']);
  });

  it('returns only the tasks due in the given week', async () => {
    await assign(users.specialist, { ...valid, title: 'Monday', dueDate: '2026-11-23' });
    await assign(users.specialist, { ...valid, title: 'Sunday', dueDate: '2026-11-29' });
    await assign(users.specialist, { ...valid, title: 'Next Monday', dueDate: '2026-11-30' });

    const res = await request(app)
      .get('/api/children/1/tasks?week=2026-11-23')
      .set(auth(users.child));

    expect(res.body.map((t) => t.title)).toEqual(['Monday', 'Sunday']);
  });

  it('rejects a week that is not a Monday', async () => {
    const res = await request(app)
      .get('/api/children/1/tasks?week=2026-11-25')
      .set(auth(users.child));
    expect(res.status).toBe(400);
  });

  it('does not show a child another child’s tasks', async () => {
    const res = await request(app).get('/api/children/6/tasks').set(auth(users.child));
    expect(res.status).toBe(403);
  });

  it('does not show a parent another family’s tasks', async () => {
    const res = await request(app).get('/api/children/1/tasks').set(auth(users.otherParent));
    expect(res.status).toBe(403);
  });

  it('rejects an invalid child id', async () => {
    const res = await request(app).get('/api/children/abc/tasks').set(auth(users.parent));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/tasks/:taskId', () => {
  it('lets the child mark their task done and the assigner sees it (FR-M4-03, FR-M4-04)', async () => {
    const { body: task } = await assign();

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set(auth(users.child))
      .send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    expect(typeof res.body.completedAt).toBe('string');

    const list = await request(app).get('/api/children/1/tasks').set(auth(users.specialist));
    expect(list.body[0].status).toBe('done');
  });

  it('does not let a child change another child’s task (FR-M4-06)', async () => {
    const { body: task } = await assign();

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set(auth(users.otherChild))
      .send({ status: 'done' });

    expect(res.status).toBe(403);
    expect(db.prepare('SELECT status FROM tasks WHERE id = ?').get(task.id).status).toBe('pending');
  });

  it('does not let a specialist mark a task done for the child', async () => {
    const { body: task } = await assign();
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set(auth(users.specialist))
      .send({ status: 'done' });
    expect(res.status).toBe(403);
  });

  it('rejects any status other than done', async () => {
    const { body: task } = await assign();
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set(auth(users.child))
      .send({ status: 'pending' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a task that does not exist', async () => {
    const res = await request(app)
      .patch('/api/tasks/999')
      .set(auth(users.child))
      .send({ status: 'done' });
    expect(res.status).toBe(404);
  });

  it('rejects an invalid task id', async () => {
    const res = await request(app)
      .patch('/api/tasks/abc')
      .set(auth(users.child))
      .send({ status: 'done' });
    expect(res.status).toBe(400);
  });
});
