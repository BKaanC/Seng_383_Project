const express = require('express');
const { requireAuth } = require('../auth');
const {
  listTasks,
  createTask,
  completeTask,
  ValidationError,
  ForbiddenError,
  NotFoundError,
} = require('../services/taskService');

// M4 tasks. Every request needs a login (FR-M1-04).
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function handleErrors(err, req, res, next) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof ForbiddenError) return res.status(403).json({ error: err.message });
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
  next(err);
}

// /api/children/:childId/tasks
const childTasksRouter = express.Router({ mergeParams: true });
childTasksRouter.use(requireAuth);
childTasksRouter.use((req, res, next) => {
  const childId = parseId(req.params.childId);
  if (!childId) return res.status(400).json({ error: 'Invalid child id' });
  req.childId = childId;
  next();
});

childTasksRouter.get('/', (req, res) => {
  res.json(listTasks(req.user, req.childId, req.query.week));
});

childTasksRouter.post('/', (req, res) => {
  res.status(201).json(createTask(req.user, req.childId, req.body));
});

childTasksRouter.use(handleErrors);

// /api/tasks/:taskId
const tasksRouter = express.Router();
tasksRouter.use(requireAuth);

tasksRouter.patch('/:taskId', (req, res) => {
  const taskId = parseId(req.params.taskId);
  if (!taskId) return res.status(400).json({ error: 'Invalid task id' });
  res.json(completeTask(req.user, taskId, req.body));
});

tasksRouter.use(handleErrors);

module.exports = { childTasksRouter, tasksRouter };
