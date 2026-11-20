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

// M4: tasks assigned to the demo child by the specialist (3) and the parent (2).
const sampleTasks = [
  { childId: CHILD_ID, assignedBy: 3, title: 'Name five animals', description: 'Look at the picture book and name the animals.', area: 'language', dueDate: '2026-11-05' },
  { childId: CHILD_ID, assignedBy: 3, title: 'Read for 20 minutes', description: 'Any book you like.', area: 'language', dueDate: '2026-11-24' },
  { childId: CHILD_ID, assignedBy: 2, title: 'Tidy your room', description: null, area: 'self_care', dueDate: '2026-11-26' },
];

const insertUser = db.prepare(
  `INSERT INTO users (id, name, email, password_hash, role, parent_id)
   VALUES (@id, @name, @email, @passwordHash, @role, @parentId)`
);
const insertEvent = db.prepare(
  'INSERT INTO events (child_id, title, description, start_time, end_time) VALUES (@childId, @title, @description, @start, @end)'
);

const insertTask = db.prepare(
  `INSERT INTO tasks (child_id, assigned_by, title, description, area, due_date)
   VALUES (@childId, @assignedBy, @title, @description, @area, @dueDate)`
);

const reseed = db.transaction((users, events, tasks) => {
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM events');
  
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'events', 'tasks')");
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
  for (const t of tasks) insertTask.run(t);
});

reseed(sampleUsers, sampleEvents, sampleTasks);
console.log(
  `Seeded ${sampleUsers.length} users, ${sampleEvents.length} events and ${sampleTasks.length} tasks.`
);