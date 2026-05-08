const axios = require('axios')
const Session = require('../../models/Session')
const User = require('../../models/User')

// POST /api/v1/interview/start
exports.startSession = async (req, res) => {
  const { mode, targetRole, difficulty = 'medium' } = req.body
  if (!mode || !targetRole) {
    return res.status(400).json({ success: false, message: 'mode and targetRole required' })
  }

  const user = await User.findById(req.user._id)
  const resumeContext = user?.resume?.parsed ?? null

  let questionPool = []
  let firstQuestion = null

  if (mode === 'mcq') {
    // ── PRE-GENERATE ALL 10 MCQs IN ONE SHOT (fastest possible) ──
    console.log('[MCQ] Pre-generating 10 questions...')
    try {
      const aiRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/ai/generate-mcq`,
        { targetRole, mode: 'technical', difficulty, count: 10, question_number: 1 },
        { timeout: 60000 }
      )
      questionPool = aiRes.data.questions ?? []
    } catch (e) {
      console.warn('[MCQ] Pre-gen failed, using fallback pool:', e.message)
      questionPool = getMcqFallbackPool(targetRole, difficulty)
    }
    // Pad to 10 if AI returned fewer
    while (questionPool.length < 10) {
      const fb = getMcqFallbackPool(targetRole, difficulty)
      questionPool.push(fb[questionPool.length % fb.length])
    }
    firstQuestion = questionPool[0]
  } else {
    // Standard modes: generate first question only
    firstQuestion = { question: `Tell me about your experience relevant to the ${targetRole} role.`, topic: 'Introduction', difficulty }
    try {
      const aiRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/ai/generate-questions`,
        { targetRole, mode, difficulty, count: 1, parsed_resume: resumeContext, weak_topics: [] },
        { timeout: 30000 }
      )
      if (aiRes.data.questions?.[0]) firstQuestion = aiRes.data.questions[0]
    } catch (e) { console.warn('[Interview] AI gen failed:', e.message) }
  }

  const session = await Session.create({
    userId: req.user._id, mode, targetRole, difficulty, totalQuestions: 10,
    questionPool,
  })

  res.status(201).json({
    success: true, session, currentQuestion: firstQuestion,
    questionIndex: 0, totalQuestions: 10,
  })
}

// Helper: deterministic fallback pool of 10 MCQs
function getMcqFallbackPool(role, difficulty) {
  return [
    { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct_index: 1, explanation: 'Binary search halves the search space each step → O(log n).', topic: 'Algorithms', difficulty },
    { question: 'Which HTTP method is idempotent?', options: ['POST', 'PATCH', 'PUT', 'DELETE'], correct_index: 2, explanation: 'PUT replaces the resource — calling it multiple times has the same result.', topic: 'HTTP', difficulty },
    { question: 'What does SQL JOIN do?', options: ['Deletes duplicates', 'Combines rows from tables', 'Sorts results', 'Creates a table'], correct_index: 1, explanation: 'JOIN combines rows from two or more tables based on a related column.', topic: 'Databases', difficulty },
    { question: 'What is a closure in JavaScript?', options: ['A browser event', 'A function with access to its outer scope', 'A type of loop', 'An error handler'], correct_index: 1, explanation: 'A closure retains access to variables in its enclosing scope even after the outer function returns.', topic: 'JavaScript', difficulty },
    { question: 'What does Git rebase do?', options: ['Deletes a branch', 'Merges with a merge commit', 'Moves commits onto a new base', 'Reverts last commit'], correct_index: 2, explanation: 'Rebase replays commits on top of another branch, creating a linear history.', topic: 'Git', difficulty },
    { question: 'What is the purpose of an index in a database?', options: ['Compress data', 'Speed up queries', 'Encrypt columns', 'Validate constraints'], correct_index: 1, explanation: 'Indexes allow the database engine to find rows faster without scanning the entire table.', topic: 'Databases', difficulty },
    { question: 'What is a Promise in JavaScript?', options: ['A variable type', 'A class', 'An object representing async completion', 'A CSS property'], correct_index: 2, explanation: 'A Promise represents the eventual result of an asynchronous operation.', topic: 'JavaScript', difficulty },
    { question: 'Which sorting algorithm has O(n log n) average time?', options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort'], correct_index: 2, explanation: 'Quick Sort averages O(n log n) due to partitioning — worst case O(n²) with bad pivots.', topic: 'Algorithms', difficulty },
    { question: 'What does REST stand for?', options: ['Remote Execution Standard Tool', 'Representational State Transfer', 'Reliable Event Streaming Tech', 'Resource Endpoint Service Type'], correct_index: 1, explanation: 'REST (Representational State Transfer) is an architectural style for distributed hypermedia.', topic: 'Web Development', difficulty },
    { question: 'What is Docker used for?', options: ['Database management', 'Containerizing applications', 'Version control', 'Load balancing'], correct_index: 1, explanation: 'Docker packages apps and their dependencies into containers for consistent environments.', topic: 'DevOps', difficulty },
  ]
}

// GET /api/v1/interview/history
exports.getHistory = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = 10
  const sessions = await Session.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-questions')
  const total = await Session.countDocuments({ userId: req.user._id })
  res.json({ success: true, sessions, total, page, pages: Math.ceil(total / limit) })
}

// GET /api/v1/interview/:id
exports.getSession = async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' })

  const answeredCount = session.questions.length
  let currentQuestion = null

  if (session.status === 'active' && answeredCount < session.totalQuestions) {
    if (session.mode === 'mcq' && session.questionPool?.length > answeredCount) {
      // ── INSTANT: serve from pre-generated pool (no AI call) ──
      currentQuestion = session.questionPool[answeredCount]
    } else if (session.mode !== 'mcq') {
      try {
        const user = await User.findById(req.user._id)
        const aiRes = await axios.post(
          `${process.env.AI_SERVICE_URL}/ai/generate-questions`,
          {
            targetRole: session.targetRole, mode: session.mode,
            difficulty: session.difficulty, count: 1,
            parsed_resume: user?.resume?.parsed ?? null,
            weak_topics: session.weakTopics ?? [],
          },
          { timeout: 30000 }
        )
        currentQuestion = aiRes.data.questions?.[0] ?? null
      } catch {}
    }
  }

  res.json({
    success: true, session, currentQuestion,
    questionIndex: answeredCount, totalQuestions: session.totalQuestions,
  })
}

// POST /api/v1/interview/:id/answer
exports.submitAnswer = async (req, res) => {
  const { answer, timeTaken = 0, question: currentQuestion = 'Interview question',
    topic: currentTopic = 'General', difficulty } = req.body

  if (!answer) {
    return res.status(400).json({ success: false, message: 'Answer required' })
  }

  const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })
  if (!session || session.status !== 'active') {
    return res.status(404).json({ success: false, message: 'Active session not found' })
  }

  const diff = difficulty || session.difficulty

  // MCQ Mode: auto-score based on selected option index
  if (session.mode === 'mcq') {
    const { selectedIndex } = req.body
    const isCorrect = selectedIndex === req.body.correctIndex
    const mcqResult = {
      question: currentQuestion,
      topic: currentTopic,
      difficulty: diff,
      userAnswer: answer,
      mcqOptions: req.body.options || [],
      correctIndex: req.body.correctIndex ?? 0,
      selectedIndex: selectedIndex ?? 0,
      isCorrect,
      explanation: req.body.explanation || '',
      aiScore: isCorrect ? 10 : 0,
      aiFeedback: {
        strengths: isCorrect ? ['Correct answer selected!'] : [],
        improvements: isCorrect ? [] : ['Review this topic'],
        suggestion: req.body.explanation || '',
        topicAccuracy: isCorrect ? 'High' : 'Low',
        confidenceLevel: 'N/A',
        keyMissingPoints: [],
      },
      timeTaken,
      answeredAt: new Date(),
    }
    session.questions.push(mcqResult)
    const sessionComplete = session.questions.length >= session.totalQuestions
    if (sessionComplete) { session.status = 'completed'; session.completedAt = new Date() }
    await session.save()
    return res.json({ success: true, result: mcqResult, sessionComplete })
  }

  // Standard Mode: AI evaluation
  let evaluation = {
    aiScore: 6,
    grade: 'Good',
    aiFeedback: {
      strengths: ['Answer provided'],
      improvements: ['Could elaborate more with examples'],
      suggestion: 'Use the STAR method for behavioral questions.',
      topicAccuracy: 'Medium', confidenceLevel: 'Medium', keyMissingPoints: [],
    },
  }
  try {
    const aiRes = await axios.post(
      `${process.env.AI_SERVICE_URL}/ai/evaluate-answer`,
      { question: currentQuestion, answer, mode: session.mode, topic: currentTopic, difficulty: diff },
      { timeout: 30000 }
    )
    if (aiRes.data.aiScore !== undefined) evaluation = aiRes.data
  } catch (e) {
    console.warn('[Interview] AI eval failed, using fallback:', e.message)
  }

  const result = {
    question: currentQuestion, topic: currentTopic, difficulty: diff,
    userAnswer: answer, aiScore: evaluation.aiScore,
    aiFeedback: evaluation.aiFeedback, timeTaken, answeredAt: new Date(),
  }
  session.questions.push(result)

  if (evaluation.aiScore < 5 && currentTopic && !session.weakTopics.includes(currentTopic)) {
    session.weakTopics.push(currentTopic)
  }
  if (evaluation.aiScore >= 8 && currentTopic) {
    session.strongTopics = session.strongTopics || []
    if (!session.strongTopics.includes(currentTopic)) session.strongTopics.push(currentTopic)
  }

  const sessionComplete = session.questions.length >= session.totalQuestions
  if (sessionComplete) {
    session.status = 'completed'
    session.completedAt = new Date()
  }
  await session.save()

  res.json({ success: true, result, sessionComplete })
}

// POST /api/v1/interview/:id/next
exports.nextQuestion = async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })
  if (!session || session.status !== 'active') {
    return res.status(404).json({ success: false, message: 'Active session not found' })
  }

  if (session.mode === 'mcq' && session.questionPool?.length > session.questions.length) {
    // ── INSTANT: serve from pre-generated pool ──
    const nextQ = session.questionPool[session.questions.length]
    return res.json({
      success: true, question: nextQ,
      questionIndex: session.questions.length,
      totalQuestions: session.totalQuestions,
    })
  }

  // Standard modes: adaptive AI question
  const user = await User.findById(req.user._id)
  let question = {
    question: `Describe a challenging problem you faced as a ${session.targetRole} and how you resolved it.`,
    topic: 'Problem Solving', difficulty: session.difficulty,
  }
  try {
    const aiRes = await axios.post(
      `${process.env.AI_SERVICE_URL}/ai/adaptive-next`,
      {
        targetRole: session.targetRole, mode: session.mode, difficulty: session.difficulty,
        weak_topics: session.weakTopics ?? [], answered_topics: session.questions.map(q => q.topic),
        session_history: session.questions.slice(-3), parsed_resume: user?.resume?.parsed ?? null,
      },
      { timeout: 30000 }
    )
    if (aiRes.data.question) question = aiRes.data.question
  } catch {}

  res.json({
    success: true, question,
    questionIndex: session.questions.length,
    totalQuestions: session.totalQuestions,
  })
}

// POST /api/v1/interview/:id/end
exports.endSession = async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' })
  session.status = 'completed'
  session.completedAt = new Date()
  await session.save()
  res.json({ success: true, session })
}
