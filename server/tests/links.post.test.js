const os = require('os')
const path = require('path')
const fs = require('fs')


const dbFile = path.join(os.tmpdir(), `links-post-test-${process.pid}.db`)
process.env.DB_PATH = dbFile

const request = require('supertest')
const db = require('../db')
const app = require('../app')
const { signToken } = require('../auth')

const parentToken = signToken({ id: 2, role: 'parent' })
const otherParentToken = signToken({ id: 5, role: 'parent' })
const specialistToken = signToken({ id: 3, role: 'specialist' })

function link(token, body, childId = 1) {
  const req = request(app).post(`/api/children/${childId}/specialists`)
  if (token) req.set('Authorization', `Bearer ${token}`)
  return req.send(body)
}

beforeAll(() => {
  const insert = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, parent_id) VALUES (?, ?, ?, ?, ?, ?)'
  )
  insert.run(2, 'Parent', 'parent@test.com', 'x', 'parent', null)
  insert.run(5, 'Other Parent', 'other@test.com', 'x', 'parent', null)
  insert.run(1, 'Child', 'child@test.com', 'x', 'child', 2)
  insert.run(6, 'Other Child', 'child2@test.com', 'x', 'child', 5)
  insert.run(3, 'Zeynep', 'zeynep@test.com', 'x', 'specialist', null)
  insert.run(4, 'Murat', 'murat@test.com', 'x', 'specialist', null)
})

beforeEach(() => {
  db.exec('DELETE FROM specialist_links')
})

afterAll(() => {
  db.close()
  fs.rmSync(dbFile, { force: true })
})

describe('POST /api/children/:childId/specialists', () => {
  test('a parent links a registered specialist to their child', async () => {
    const res = await link(parentToken, { email: 'zeynep@test.com', specialistType: 'psychologist' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      childId: 1,
      specialistId: 3,
      name: 'Zeynep',
      specialistType: 'psychologist',
    })
    const count = db.prepare('SELECT COUNT(*) AS n FROM specialist_links WHERE child_id = 1').get().n
    expect(count).toBe(1)
  })

  test('ignores capital letters and spaces in the email', async () => {
    const res = await link(parentToken, { email: '  Zeynep@Test.com ', specialistType: 'doctor' })
    expect(res.status).toBe(201)
  })

  test('rejects an email that is not registered', async () => {
    const res = await link(parentToken, { email: 'nobody@test.com', specialistType: 'doctor' })
    expect(res.status).toBe(404)
  })

  test('rejects the email of a user who is not a specialist', async () => {
    const res = await link(parentToken, { email: 'other@test.com', specialistType: 'doctor' })
    expect(res.status).toBe(404)
  })

  test('rejects linking the same specialist twice', async () => {
    await link(parentToken, { email: 'zeynep@test.com', specialistType: 'psychologist' })
    const res = await link(parentToken, { email: 'zeynep@test.com', specialistType: 'doctor' })
    expect(res.status).toBe(400)
  })

  test('rejects an unknown specialist type', async () => {
    const res = await link(parentToken, { email: 'zeynep@test.com', specialistType: 'astronaut' })
    expect(res.status).toBe(400)
  })

  test('rejects a request without an email', async () => {
    const res = await link(parentToken, { specialistType: 'doctor' })
    expect(res.status).toBe(400)
  })

  test("rejects a parent who links a specialist to another parent's child", async () => {
    const res = await link(otherParentToken, { email: 'zeynep@test.com', specialistType: 'doctor' })
    expect(res.status).toBe(403)
  })

  test('rejects a user who is not a parent', async () => {
    const res = await link(specialistToken, { email: 'murat@test.com', specialistType: 'doctor' })
    expect(res.status).toBe(403)
  })

  test('rejects a request without a token', async () => {
    const res = await link(null, { email: 'zeynep@test.com', specialistType: 'doctor' })
    expect(res.status).toBe(401)
  })
})