const Session = require('../../models/Session')

// GET /api/v1/analytics/dashboard
exports.getDashboard = async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id, status: 'completed' })
  const totalSessions = sessions.length

  const averageScore = totalSessions > 0
    ? sessions.reduce((s, sess) => s + (sess.overallScore || 0), 0) / totalSessions : 0

  const topicMap = {}
  const weakMap = {}
  const strongMap = {}

  sessions.forEach(sess => {
    sess.questions.forEach(q => {
      if (!q.topic) return
      if (!topicMap[q.topic]) topicMap[q.topic] = { total: 0, count: 0 }
      topicMap[q.topic].total += q.aiScore
      topicMap[q.topic].count++
    })
    sess.weakTopics?.forEach(t => { weakMap[t] = (weakMap[t] || 0) + 1 })
    sess.strongTopics?.forEach(t => { strongMap[t] = (strongMap[t] || 0) + 1 })
  })

  const topicScores = {}
  Object.entries(topicMap).forEach(([t, v]) => {
    topicScores[t] = +(v.total / v.count).toFixed(2)
  })

  const weakTopics = Object.entries(weakMap).sort(([,a],[,b]) => b-a).map(([t]) => t).slice(0, 5)
  const strongTopics = Object.entries(strongMap).sort(([,a],[,b]) => b-a).map(([t]) => t).slice(0, 5)
  const improvement = sessions.slice(-10).map(s => ({
    date: s.completedAt || s.createdAt,
    score: +((s.overallScore || 0)).toFixed(2),
  }))

  res.json({
    success: true, totalSessions,
    averageScore: +averageScore.toFixed(2),
    topicScores, weakTopics, strongTopics, improvement,
    lastUpdated: new Date(),
  })
}

// GET /api/v1/analytics/weak-topics
exports.getWeakTopics = async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id, status: 'completed' })
  const weakMap = {}
  sessions.forEach(s => s.weakTopics?.forEach(t => { weakMap[t] = (weakMap[t] || 0) + 1 }))
  const weakTopics = Object.entries(weakMap)
    .sort(([,a],[,b]) => b-a)
    .map(([topic, count]) => ({ topic, count }))
  res.json({ success: true, weakTopics })
}

// GET /api/v1/analytics/progress
exports.getProgress = async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id, status: 'completed' })
    .sort({ createdAt: 1 }).limit(20)
  const improvement = sessions.map((s, i) => ({
    date: `Session ${i + 1}`,
    score: +((s.overallScore || 0)).toFixed(2),
    mode: s.mode,
  }))
  res.json({ success: true, improvement })
}

// GET /api/v1/analytics/session/:id
exports.getSessionAnalytics = async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' })
  res.json({ success: true, session })
}
