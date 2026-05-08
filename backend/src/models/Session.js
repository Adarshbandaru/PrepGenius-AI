const mongoose = require('mongoose')

const questionAnswerSchema = new mongoose.Schema({
  question: String,
  topic: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  userAnswer: String,
  aiScore: { type: Number, min: 0, max: 10, default: 0 },
  // MCQ-specific fields
  mcqOptions: [String],
  correctIndex: Number,
  selectedIndex: Number,
  isCorrect: Boolean,
  explanation: String,
  aiFeedback: {
    strengths: [String],
    improvements: [String],
    suggestion: String,
    topicAccuracy: String,
    confidenceLevel: String,
    keyMissingPoints: [String],
  },
  timeTaken: { type: Number, default: 0 },
  answeredAt: { type: Date, default: Date.now },
}, { _id: false })

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mode: { type: String, enum: ['technical', 'hr', 'coding', 'mcq'], required: true },
  targetRole: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  questions: [questionAnswerSchema],
  questionPool: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Pre-generated MCQ pool
  overallScore: { type: Number, default: 0 },
  weakTopics: [String],
  strongTopics: [String],
  totalQuestions: { type: Number, default: 10 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true })

// Auto-compute overallScore before save
sessionSchema.pre('save', async function () {
  if (this.questions && this.questions.length > 0) {
    if (this.mode === 'mcq') {
      // MCQ: average ALL questions (wrong = 0, correct = 10) — never exclude zeros
      const total = this.questions.reduce((s, q) => s + (q.aiScore ?? 0), 0)
      this.overallScore = parseFloat((total / this.questions.length).toFixed(2))
    } else {
      // Text modes: only include questions that were AI-evaluated (score > 0 means evaluated)
      const scored = this.questions.filter(q => q.aiScore > 0)
      if (scored.length > 0) {
        this.overallScore = parseFloat(
          (scored.reduce((s, q) => s + q.aiScore, 0) / scored.length).toFixed(2)
        )
      }
    }
  }
})

module.exports = mongoose.model('InterviewSession', sessionSchema)
