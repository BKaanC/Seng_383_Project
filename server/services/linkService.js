const db = require('../db')

const SPECIALIST_TYPES = ['teacher', 'psychologist', 'doctor', 'special_ed', 'coach']


class LinkError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// FR-M2-01: a parent links a registered specialist to their child.
function linkSpecialist(user, childId, body) {
  // FR-M2-08: only a parent, and only for their own child.
  if (user.role !== 'parent') {
    throw new LinkError(403, 'Only a parent can link a specialist')
  }
  const child = db
    .prepare("SELECT id, parent_id AS parentId FROM users WHERE id = ? AND role = 'child'")
    .get(childId)
  if (!child || child.parentId !== user.id) {
    throw new LinkError(403, 'No access to this child')
  }

  const { email, specialistType } = body || {}
  if (typeof email !== 'string' || !email.trim()) {
    throw new LinkError(400, 'Specialist email is required')
  }
  if (!SPECIALIST_TYPES.includes(specialistType)) {
    throw new LinkError(400, `Specialist type must be one of: ${SPECIALIST_TYPES.join(', ')}`)
  }

  // FR-M2-02: the email must belong to a registered specialist.
  const specialist = db
    .prepare("SELECT id, name FROM users WHERE email = ? AND role = 'specialist'")
    .get(email.trim().toLowerCase())
  if (!specialist) {
    throw new LinkError(404, 'No registered specialist with this email')
  }

  // FR-M2-07: the same specialist cannot be linked twice.
  const existing = db
    .prepare('SELECT id FROM specialist_links WHERE child_id = ? AND specialist_id = ?')
    .get(childId, specialist.id)
  if (existing) {
    throw new LinkError(400, 'This specialist is already linked to the child')
  }

  const result = db
    .prepare('INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)')
    .run(childId, specialist.id, specialistType)

  const link = db
    .prepare(
      `SELECT id, child_id AS childId, specialist_id AS specialistId,
              specialist_type AS specialistType, linked_at AS linkedAt
       FROM specialist_links WHERE id = ?`
    )
    .get(result.lastInsertRowid)
  return { ...link, name: specialist.name }
}

module.exports = { linkSpecialist, LinkError }