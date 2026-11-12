const express = require('express');
const { listEvents, createEvent, ValidationError } = require('../services/eventService');

// M3 weekly schedule: /api/children/:childId/events
// Login and access checks (M1, M2) are added in the next sprints.
const router = express.Router({ mergeParams: true });

router.use((req, res, next) => {
  const childId = Number(req.params.childId);
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ error: 'Invalid child id' });
  }
  req.childId = childId;
  next();
});

// FR-M3-02: the child's events, optionally only one week (?week=YYYY-MM-DD, a Monday).
router.get('/', (req, res) => {
  res.json(listEvents(req.childId, req.query.week));
});

// FR-M3-01, FR-M3-05: add an event for a child.
router.post('/', (req, res) => {
  res.status(201).json(createEvent(req.childId, req.body));
});

router.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
