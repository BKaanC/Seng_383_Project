const db = require('../db');

// Thrown when the input is not valid. The route turns it into a 400 response.
class ValidationError extends Error {}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/; // 2026-11-04
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/; // 17:30
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

// Also rejects dates that match the format but do not exist, e.g. 2026-02-30.
function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value) {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

// FR-M3-01, FR-M3-05: checks the input and returns the values to store.
function validateNewEvent(input) {
  const { title, description, date, startTime, endTime } = input || {};

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
  if (!isValidDate(date)) {
    throw new ValidationError('date must be in the format YYYY-MM-DD');
  }
  if (!isValidTime(startTime)) {
    throw new ValidationError('startTime must be in the format HH:MM');
  }
  if (!isValidTime(endTime)) {
    throw new ValidationError('endTime must be in the format HH:MM');
  }
  // "HH:MM" strings compare correctly as text, e.g. "09:00" < "17:00".
  if (endTime <= startTime) {
    throw new ValidationError('endTime must be after startTime');
  }

  return {
    title: title.trim(),
    description: typeof description === 'string' && description.trim() ? description.trim() : null,
    // Same format as the existing rows: 2026-11-04T17:00:00
    startTime: `${date}T${startTime}:00`,
    endTime: `${date}T${endTime}:00`,
  };
}

function createEvent(childId, input) {
  const event = validateNewEvent(input);

  const result = db
    .prepare(
      `INSERT INTO events (child_id, title, description, start_time, end_time)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(childId, event.title, event.description, event.startTime, event.endTime);

  return db
    .prepare(
      `SELECT id, child_id AS childId, title, description,
              start_time AS startTime, end_time AS endTime
       FROM events
       WHERE id = ?`
    )
    .get(result.lastInsertRowid);
}

module.exports = { createEvent, ValidationError };
