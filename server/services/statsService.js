const db = require('../db');
const {
  AREAS,
  isValidDate,
  addDays,
  findChild,
  ValidationError,
  ForbiddenError,
} = require('./taskService');

// FR-M7-01: completed tasks divided by the tasks due in the week, as a whole
// percentage. FR-M7-03: null when there are no tasks, so the screen can say "no tasks".
function completionRate(done, total) {
  return total === 0 ? null : Math.round((done / total) * 100);
}

function summary(done, total) {
  return { done, total, rate: completionRate(done, total) };
}

// FR-M7-04: the parent of the child and specialists see the statistics.
// The link check for specialists (FR-M2-05) comes with M2.
function checkStatsAccess(user, child) {
  if (user.role === 'parent' && user.id === child.parentId) return;
  if (user.role === 'specialist') return;
  throw new ForbiddenError('Only the parent and linked specialists can see the statistics');
}

// FR-M7-01, FR-M7-02: the week's completion rate in total and for each area.
function weeklyStats(user, childId, week) {
  if (!isValidDate(week) || new Date(`${week}T00:00:00Z`).getUTCDay() !== 1) {
    throw new ValidationError('week must be a Monday in the format YYYY-MM-DD');
  }
  const child = findChild(childId);
  checkStatsAccess(user, child);

  const rows = db
    .prepare(
      `SELECT area,
              COUNT(*) AS total,
              SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
       FROM tasks
       WHERE child_id = ? AND due_date >= ? AND due_date < ?
       GROUP BY area`
    )
    .all(child.id, week, addDays(week, 7));

  const byArea = AREAS.map((area) => {
    const row = rows.find((r) => r.area === area);
    return { area, ...summary(row ? row.done : 0, row ? row.total : 0) };
  });
  const done = byArea.reduce((sum, a) => sum + a.done, 0);
  const total = byArea.reduce((sum, a) => sum + a.total, 0);

  return { week, total: summary(done, total), byArea };
}

module.exports = { completionRate, weeklyStats };
