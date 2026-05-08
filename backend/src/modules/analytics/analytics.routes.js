const express = require('express')
const router = express.Router()
const { getDashboard, getWeakTopics, getProgress, getSessionAnalytics } = require('./analytics.controller')
const { authMiddleware } = require('../../middleware/auth')

router.use(authMiddleware)
router.get('/dashboard', getDashboard)
router.get('/weak-topics', getWeakTopics)
router.get('/progress', getProgress)
router.get('/session/:id', getSessionAnalytics)

module.exports = router
