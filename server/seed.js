const bcrypt = require('bcryptjs');
const db = require('./db');


const DEMO_PASSWORD = 'Test1234';
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

const CHILD_ID = 1;
const sampleUsers = [
  { id: 2, name: 'Ayşe Demir', email: 'ayse@test.com', role: 'parent', parentId: null },
  { id: 1, name: 'Ali Demir', email: 'ali@test.com', role: 'child', parentId: 2 },
  { id: 3, name: 'Zeynep Kaya', email: 'zeynep@test.com', role: 'specialist', parentId: null },
  { id: 4, name: 'Murat Yıldız', email: 'murat@test.com', role: 'specialist', parentId: null },
];

const sampleEvents = [
  {
    childId: CHILD_ID,
    title: 'Speech therapy session',
    description: 'Weekly session with the speech therapist.',
    start: '2026-11-02T10:00:00',
    end: '2026-11-02T10:45:00',
  },
  {
    childId: CHILD_ID,
    title: 'Reading time',
    description: 'Read one chapter of a book together.',
    start: '2026-11-03T16:00:00',
    end: '2026-11-03T16:30:00',
  },
];

const insertUser = db.prepare(
  `INSERT INTO users (id, name, email, password_hash, role, parent_id)
   VALUES (@id, @name, @email, @passwordHash, @role, @parentId)`
);
const insertEvent = db.prepare(
  'INSERT INTO events (child_id, title, description, start_time, end_time) VALUES (@childId, @title, @description, @start, @end)'
);

const reseed = db.transaction((users, events) => {
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM events');
  
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'events')");
  for (const u of users) {
    insertUser.run({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      parentId: u.parentId,
    });
  }
  for (const e of events) insertEvent.run(e);
});

reseed(sampleUsers, sampleEvents);
console.log(`Seeded ${sampleUsers.length} users and ${sampleEvents.length} events.`);