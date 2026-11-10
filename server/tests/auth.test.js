const os = require('os');
const path = require('path');
const fs = require('fs');

const dbFile = path.join(os.tmpdir(), `auth-test-${process.pid}.db`);
process.env.DB_PATH = dbFile;

const request = require('supertest');
const bcrypt = require('bcryptjs');
const db = require('../db');
const app = require('../app');

beforeAll(() => {
  db.exec('DELETE FROM users');
  const hash = bcrypt.hashSync('Test1234', 4);
  const insert = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, parent_id) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insert.run(2, 'Ayse Demir', 'ayse@test.com', hash, 'parent', null);
  insert.run(1, 'Ali Demir', 'ali@test.com', hash, 'child', 2);
});

afterAll(() => {
  db.close();
  fs.rmSync(dbFile, { force: true });
});

describe('POST /api/login', () => {
  test('returns a token and the role stored on the account', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'ali@test.com', password: 'Test1234' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.role).toBe('child');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  test('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'ali@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('gives the same error for an unknown email and a wrong password', async () => {
    const wrongPassword = await request(app)
      .post('/api/login')
      .send({ email: 'ali@test.com', password: 'wrong' });
    const unknownEmail = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@test.com', password: 'Test1234' });
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  test('rejects a request without email or password', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/me (requireAuth)', () => {
  test('rejects a request without a token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  test('rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('returns the user for a valid token', async () => {
    const login = await request(app)
      .post('/api/login')
      .send({ email: 'ayse@test.com', password: 'Test1234' });
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('parent');
  });
});