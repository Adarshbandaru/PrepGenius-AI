const express = require('express')
const router = express.Router()
const { startSession, getSession, submitAnswer, nextQuestion, endSession, getHistory } = require('./interview.controller')
const { authMiddleware } = require('../../middleware/auth')

router.use(authMiddleware)
router.post('/start', startSession)
router.get('/history', getHistory)
router.get('/:id', getSession)
router.post('/:id/answer', submitAnswer)
router.post('/:id/next', nextQuestion)
router.post('/:id/end', endSession)

module.exports = router
