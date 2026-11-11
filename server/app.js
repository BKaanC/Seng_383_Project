const express = require('express');
const cors = require('cors');
const db = require('./db');
const { createEvent, ValidationError } = require('./services/eventService');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Walking skeleton (v0.0): read a child's events from SQLite.
// Login and access checks (M1, M2) are added in the next sprints.
app.get('/api/children/:childId/events', (req, res) => {
  const childId = Number(req.params.childId);
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ error: 'Invalid child id' });
  }

  const events = db
    .prepare(
      `SELECT id, child_id AS childId, title, description,
              start_time AS startTime, end_time AS endTime
       FROM events
       WHERE child_id = ?
       ORDER BY start_time`
    )
    .all(childId);

  res.json(events);
});

// FR-M3-01, FR-M3-05: add an event for a child.
app.post('/api/children/:childId/events', (req, res) => {
  const childId = Number(req.params.childId);
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ error: 'Invalid child id' });
  }
  try {
    res.status(201).json(createEvent(childId, req.body));
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

module.exports = app;
