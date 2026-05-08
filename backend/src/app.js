require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const path = require('path')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/errorHandler')

// Routes
const authRoutes = require('./modules/auth/auth.routes')
const resumeRoutes = require('./modules/resume/resume.routes')
const interviewRoutes = require('./modules/interview/interview.routes')
const analyticsRoutes = require('./modules/analytics/analytics.routes')

const app = express()

// Connect DB
connectDB()

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

// CORS — allow frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Body parsing (must come before routes)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/resume', resumeRoutes)
app.use('/api/v1/interview', interviewRoutes)
app.use('/api/v1/analytics', analyticsRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PrepGenius Backend', timestamp: new Date() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` })
})

// Global error handler — must be last, must have 4 params for Express 5
app.use(errorHandler)

module.exports = app
