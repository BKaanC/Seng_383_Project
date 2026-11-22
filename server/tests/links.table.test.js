const os = require('os');
const path = require('path');
const fs = require('fs');

const dbFile = path.join(os.tmpdir(), `links-table-test-${process.pid}.db`);
process.env.DB_PATH = dbFile;

const db = require('../db');

const insertUser = db.prepare(
  'INSERT INTO users (id, name, email, password_hash, role, parent_id) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertLink = db.prepare(
  'INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)'
);

beforeAll(() => {
  insertUser.run(2, 'Parent', 'parent@test.com', 'x', 'parent', null);
  insertUser.run(1, 'Child', 'child@test.com', 'x', 'child', 2);
  insertUser.run(3, 'Specialist', 'specialist@test.com', 'x', 'specialist', null);
});

beforeEach(() => {
  db.exec('DELETE FROM specialist_links');
});

afterAll(() => {
  db.close();
  fs.rmSync(dbFile, { force: true });
});

describe('specialist_links table', () => {
  test('stores a link and fills in the link date', () => {
    insertLink.run(1, 3, 'psychologist');
    const link = db
      .prepare('SELECT specialist_type, linked_at FROM specialist_links WHERE child_id = 1')
      .get();
    expect(link.specialist_type).toBe('psychologist');
    expect(link.linked_at).toBeTruthy();
  });

  test('does not allow the same specialist twice for the same child', () => {
    insertLink.run(1, 3, 'psychologist');
    expect(() => insertLink.run(1, 3, 'doctor')).toThrow(/UNIQUE/);
  });

  test('does not allow an unknown specialist type', () => {
    expect(() => insertLink.run(1, 3, 'astronaut')).toThrow(/CHECK/);
  });
});