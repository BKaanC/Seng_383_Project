const express = require('express')
const { requireAuth } = require('../auth')
const { linkSpecialist, LinkError } = require('../services/linkService')

const router = express.Router()


router.post('/children/:childId/specialists', requireAuth, (req, res) => {
  const childId = Number(req.params.childId)
  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ error: 'Invalid child id' })
  }
  try {
    res.status(201).json(linkSpecialist(req.user, childId, req.body))
  } catch (err) {
    if (err instanceof LinkError) {
      return res.status(err.status).json({ error: err.message })
    }
    throw err
  }
})

module.exports = router