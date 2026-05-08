export interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  resume?: {
    url: string
    parsed: ParsedResume
  }
  createdAt: string
}

export interface ParsedResume {
  skills: string[]
  experience: Experience[]
  education: Education[]
  projects: Project[]
}

export interface Experience {
  company: string
  role: string
  duration: string
  description?: string
}

export interface Education {
  degree: string
  institute: string
  year: string
}

export interface Project {
  name: string
  description: string
  tech: string[]
}

export interface Question {
  _id?: string
  question: string
  topic: string
  subtopic?: string
  mode: 'technical' | 'hr' | 'coding'
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface QuestionAnswer {
  questionId?: string
  question: string
  topic: string
  difficulty: string
  userAnswer: string
  aiScore: number
  aiFeedback: AiFeedback
  timeTaken: number
  answeredAt: string
}

export interface AiFeedback {
  strengths: string[]
  improvements: string[]
  suggestion: string
  topicAccuracy: string
  confidenceLevel: string
  keyMissingPoints: string[]
}

export interface InterviewSession {
  _id: string
  userId: string
  mode: 'technical' | 'hr' | 'coding'
  targetRole: string
  status: 'active' | 'completed' | 'abandoned'
  questions: QuestionAnswer[]
  overallScore: number
  weakTopics: string[]
  startedAt: string
  completedAt?: string
}

export interface Analytics {
  totalSessions: number
  averageScore: number
  topicScores: Record<string, number>
  weakTopics: string[]
  strongTopics: string[]
  improvement: { date: string; score: number }[]
  lastUpdated: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}
