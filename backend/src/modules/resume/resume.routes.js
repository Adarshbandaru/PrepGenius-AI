const express = require('express')
const router = express.Router()
const { uploadResume, getParsed, analyzeResume } = require('./resume.controller')
const { authMiddleware } = require('../../middleware/auth')

router.use(authMiddleware)
router.post('/upload', uploadResume)
router.get('/parsed', getParsed)
router.post('/analyze', analyzeResume)   // ATS score + job recommendations

module.exports = router
