process.env.DB_PATH = ':memory:';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

const valid = {
  title: '  Swimming  ',
  description: 'Bring a towel.',
  date: '2026-11-04',
  startTime: '17:00',
  endTime: '18:00',
};

beforeEach(() => {
  db.exec('DELETE FROM events');
});

describe('POST /api/children/:childId/events', () => {
  it('adds an event and returns it with status 201', async () => {
    const res = await request(app).post('/api/children/1/events').send(valid);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      childId: 1,
      title: 'Swimming',
      description: 'Bring a towel.',
      startTime: '2026-11-04T17:00:00',
      endTime: '2026-11-04T18:00:00',
    });
    expect(typeof res.body.id).toBe('number');
  });

  it('makes the new event visible in the child’s event list', async () => {
    await request(app).post('/api/children/1/events').send(valid);

    const list = await request(app).get('/api/children/1/events');
    expect(list.body.map((e) => e.title)).toEqual(['Swimming']);
  });

  it('stores a missing or blank description as null', async () => {
    const { description, ...withoutDescription } = valid;
    const missing = await request(app).post('/api/children/1/events').send(withoutDescription);
    const blank = await request(app)
      .post('/api/children/1/events')
      .send({ ...valid, description: '   ' });

    expect(missing.status).toBe(201);
    expect(missing.body.description).toBeNull();
    expect(blank.body.description).toBeNull();
  });

  it('rejects an event that ends before it starts (FR-M3-05)', async () => {
    const res = await request(app)
      .post('/api/children/1/events')
      .send({ ...valid, startTime: '18:00', endTime: '17:00' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('endTime must be after startTime');
  });

  it('rejects an event that ends when it starts', async () => {
    const res = await request(app)
      .post('/api/children/1/events')
      .send({ ...valid, startTime: '17:00', endTime: '17:00' });

    expect(res.status).toBe(400);
  });

  it.each([
    ['a missing title', { title: undefined }, 'title is required'],
    ['a blank title', { title: '   ' }, 'title is required'],
    ['a too long title', { title: 'x'.repeat(101) }, 'title must be at most 100 characters'],
    ['a description that is not text', { description: 5 }, 'description must be text'],
    [
      'a too long description',
      { description: 'x'.repeat(501) },
      'description must be at most 500 characters',
    ],
    ['a date in the wrong format', { date: '04-11-2026' }, 'date must be in the format YYYY-MM-DD'],
    ['a date that does not exist', { date: '2026-02-30' }, 'date must be in the format YYYY-MM-DD'],
    ['an invalid start time', { startTime: '25:00' }, 'startTime must be in the format HH:MM'],
    ['an invalid end time', { endTime: '9:00' }, 'endTime must be in the format HH:MM'],
  ])('rejects %s', async (_name, change, message) => {
    const res = await request(app)
      .post('/api/children/1/events')
      .send({ ...valid, ...change });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  it('rejects a request without a body', async () => {
    const res = await request(app).post('/api/children/1/events');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid child id', async () => {
    const res = await request(app).post('/api/children/abc/events').send(valid);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid child id');
  });

  it('does not save anything when the event is rejected', async () => {
    await request(app)
      .post('/api/children/1/events')
      .send({ ...valid, startTime: '18:00', endTime: '17:00' });

    const list = await request(app).get('/api/children/1/events');
    expect(list.body).toEqual([]);
  });
});
