const db = require('../db');

// Thrown when the input is not valid. The route turns it into a 400 response.
class ValidationError extends Error {}

// Thrown when the user may not see or change the data. The route turns it into a 403.
class ForbiddenError extends Error {}

// Thrown when the task or child does not exist. The route turns it into a 404.
class NotFoundError extends Error {}

const AREAS = ['language', 'motor', 'social', 'cognitive', 'self_care'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/; // 2026-11-25
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

// Also rejects dates that match the format but do not exist, e.g. 2026-02-30.
function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(date, days) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// FR-M4-01, FR-M4-05: title, area and due date are required.
function validateNewTask(input) {
  const { title, description, area, dueDate } = input || {};

  if (typeof title !== 'string' || !title.trim()) {
    throw new ValidationError('title is required');
  }
  if (title.trim().length > TITLE_MAX_LENGTH) {
    throw new ValidationError(`title must be at most ${TITLE_MAX_LENGTH} characters`);
  }
  if (description !== undefined && description !== null && typeof description !== 'string') {
    throw new ValidationError('description must be text');
  }
  if (typeof description === 'string' && description.trim().length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`description must be at most ${DESCRIPTION_MAX_LENGTH} characters`);
  }
  if (!AREAS.includes(area)) {
    throw new ValidationError(`area must be one of: ${AREAS.join(', ')}`);
  }
  if (!isValidDate(dueDate)) {
    throw new ValidationError('dueDate must be in the format YYYY-MM-DD');
  }

  return {
    title: title.trim(),
    description: typeof description === 'string' && description.trim() ? description.trim() : null,
    area,
    dueDate,
  };
}

function findChild(childId) {
  const child = db
    .prepare("SELECT id, parent_id AS parentId FROM users WHERE id = ? AND role = 'child'")
    .get(childId);
  if (!child) throw new NotFoundError('Child not found');
  return child;
}

// A child sees only their own tasks and a parent only their own child's.
// Specialists are allowed for now; the link check (FR-M2-05) is added with M2.
function checkChildAccess(user, child) {
  if (user.role === 'child' && user.id !== child.id) {
    throw new ForbiddenError('You can only see your own tasks');
  }
  if (user.role === 'parent' && user.id !== child.parentId) {
    throw new ForbiddenError('This is not your child');
  }
}

const SELECT_TASK = `SELECT t.id, t.child_id AS childId, t.assigned_by AS assignedBy,
                            u.name AS assignedByName, t.title, t.description, t.area,
                            t.due_date AS dueDate, t.status, t.completed_at AS completedAt
                     FROM tasks t JOIN users u ON u.id = t.assigned_by`;

// FR-M4-02, FR-M4-04: the child's tasks, optionally only those due in one week
// (?week=YYYY-MM-DD, a Monday).
function listTasks(user, childId, week) {
  const child = findChild(childId);
  checkChildAccess(user, child);

  if (week === undefined) {
    return db
      .prepare(`${SELECT_TASK} WHERE t.child_id = ? ORDER BY t.due_date, t.id`)
      .all(child.id);
  }
  if (!isValidDate(week) || new Date(`${week}T00:00:00Z`).getUTCDay() !== 1) {
    throw new ValidationError('week must be a Monday in the format YYYY-MM-DD');
  }
  return db
    .prepare(
      `${SELECT_TASK} WHERE t.child_id = ? AND t.due_date >= ? AND t.due_date < ?
       ORDER BY t.due_date, t.id`
    )
    .all(child.id, week, addDays(week, 7));
}

// FR-M4-01: a parent or specialist assigns a task to the child.
function createTask(user, childId, input) {
  if (user.role !== 'parent' && user.role !== 'specialist') {
    throw new ForbiddenError('Only a parent or a specialist can assign tasks');
  }
  const child = findChild(childId);
  checkChildAccess(user, child);
  const task = validateNewTask(input);

  const result = db
    .prepare(
      `INSERT INTO tasks (child_id, assigned_by, title, description, area, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(child.id, user.id, task.title, task.description, task.area, task.dueDate);

  return db.prepare(`${SELECT_TASK} WHERE t.id = ?`).get(result.lastInsertRowid);
}

// FR-M4-03, FR-M4-06: only the child the task belongs to can mark it done.
function completeTask(user, taskId, input) {
  const { status } = input || {};
  if (status !== 'done') {
    throw new ValidationError('status must be "done"');
  }
  const task = db.prepare('SELECT id, child_id AS childId, status FROM tasks WHERE id = ?').get(taskId);
  if (!task) throw new NotFoundError('Task not found');
  if (user.role !== 'child' || user.id !== task.childId) {
    throw new ForbiddenError('Only the child the task belongs to can mark it done');
  }

  if (task.status !== 'done') {
    db.prepare("UPDATE tasks SET status = 'done', completed_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      task.id
    );
  }
  return db.prepare(`${SELECT_TASK} WHERE t.id = ?`).get(task.id);
}

module.exports = {
  AREAS,
  listTasks,
  createTask,
  completeTask,
  ValidationError,
  ForbiddenError,
  NotFoundError,
};
