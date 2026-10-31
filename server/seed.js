const db = require('./db');

const sampleEvents = [
  {
    childId: 1,
    title: 'Speech therapy session',
    description: 'Weekly session with the speech therapist.',
    start: '2026-11-02T10:00:00',
    end: '2026-11-02T10:45:00',
  },
  {
    childId: 1,
    title: 'Reading time',
    description: 'Read one chapter of a book together.',
    start: '2026-11-03T16:00:00',
    end: '2026-11-03T16:30:00',
  },
];

const insert = db.prepare(
  'INSERT INTO events (child_id, title, description, start_time, end_time) VALUES (@childId, @title, @description, @start, @end)'
);
const reseed = db.transaction((rows) => {
  db.exec('DELETE FROM events');
  // Reset AUTOINCREMENT so seeded ids always start at 1.
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'events'");
  for (const row of rows) insert.run(row);
});

reseed(sampleEvents);
console.log(`Seeded ${sampleEvents.length} events.`);