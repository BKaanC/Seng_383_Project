const express = require('express');
const { requireAuth } = require('../auth');
const { weeklyStats } = require('../services/statsService');
const { ValidationError, ForbiddenError, NotFoundError } = require('../services/taskService');

// M7 weekly statistics: /api/children/:childId/stats?week=YYYY-MM-DD
const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/', (req, res) => {
  const childId = Number(req.params.childId);
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ error: 'Invalid child id' });
  }
  res.json(weeklyStats(req.user, childId, req.query.week));
});

router.use((err, req, res, next) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof ForbiddenError) return res.status(403).json({ error: err.message });
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
  next(err);
});

module.exports = router;
