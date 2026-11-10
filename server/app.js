const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const { signToken, requireAuth } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// M1: log in with email and password, receive a signed token.
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db
    .prepare(
      'SELECT id, name, password_hash AS passwordHash, role FROM users WHERE email = ?'
    )
    .get(email.trim().toLowerCase());

  // Same message for unknown email and wrong password (FR-M1-02).
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, role: user.role },
  });
});


app.get('/api/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  res.json(user);
});

// M1: Login and access checks
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

module.exports = app;
