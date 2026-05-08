import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    { name: 'prepgenius-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }) }
  )
)

// ─── Interview Store ─────────────────────────────────────
interface InterviewState {
  sessionId: string | null
  mode: string | null
  targetRole: string | null
  currentQuestion: any | null
  questionIndex: number
  totalQuestions: number
  answers: any[]
  isLoading: boolean
  setSession: (id: string, mode: string, role: string) => void
  setQuestion: (q: any, index: number, total: number) => void
  addAnswer: (answer: any) => void
  setLoading: (v: boolean) => void
  resetSession: () => void
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: null,
  mode: null,
  targetRole: null,
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  answers: [],
  isLoading: false,
  setSession: (sessionId, mode, targetRole) => set({ sessionId, mode, targetRole }),
  setQuestion: (currentQuestion, questionIndex, totalQuestions) =>
    set({ currentQuestion, questionIndex, totalQuestions }),
  addAnswer: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
  setLoading: (isLoading) => set({ isLoading }),
  resetSession: () =>
    set({ sessionId: null, mode: null, targetRole: null, currentQuestion: null, questionIndex: 0, totalQuestions: 0, answers: [] }),
}))
