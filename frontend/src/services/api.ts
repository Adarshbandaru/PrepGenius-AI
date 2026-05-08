import axios from 'axios'
import { API_BASE } from '@/utils/constants'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach + proactively refresh expiring tokens ──────
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken')
  if (!token) return config

  // Proactively refresh if token expires in < 60 seconds
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]))
    const expiresIn = exp - Math.floor(Date.now() / 1000)

    if (expiresIn < 60 && !config.url?.includes('/auth/')) {
      // Token about to expire — refresh silently BEFORE the request
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
          .then(r => r.data.accessToken)
          .finally(() => { refreshPromise = null })
      }
      try {
        const newToken = await refreshPromise
        localStorage.setItem('accessToken', newToken)
        config.headers.Authorization = `Bearer ${newToken}`
        return config
      } catch {
        // Refresh failed — let request proceed, response interceptor will handle
      }
    }
  } catch { /* invalid token format — let it through */ }

  config.headers.Authorization = `Bearer ${token}`
  return config
})

// Track if a refresh is already in progress to prevent parallel refresh calls
let refreshPromise: Promise<string> | null = null

// ─── Response interceptor — auto-refresh on 401 ──────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Only handle 401 once per request, and never for the refresh endpoint itself
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true

      try {
        // Deduplicate: if refresh already in-flight, wait for it
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
            .then((r) => r.data.accessToken)
            .finally(() => { refreshPromise = null })
        }

        const newToken = await refreshPromise
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)

      } catch {
        // Refresh failed — clear auth state and redirect cleanly
        localStorage.removeItem('accessToken')
        // Use replace so back-button doesn't loop
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.replace('/auth/login')
        }
      }
    }

    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ─── Resume ──────────────────────────────────────────────
export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('resume', file)
    return api.post('/resume/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getParsed: () => api.get('/resume/parsed'),
  analyze: () => api.post('/resume/analyze'),
}

// ─── Interview ───────────────────────────────────────────
export const interviewApi = {
  start: (data: { mode: string; targetRole: string; difficulty: string }) =>
    api.post('/interview/start', data),
  getSession: (id: string) => api.get(`/interview/${id}`),
  submitAnswer: (id: string, data: { answer: string; timeTaken: number; question?: string; topic?: string; difficulty?: string }) =>
    api.post(`/interview/${id}/answer`, data),
  nextQuestion: (id: string) => api.post(`/interview/${id}/next`),
  endSession: (id: string) => api.post(`/interview/${id}/end`),
  history: (page = 1) => api.get(`/interview/history?page=${page}`),
}

// ─── Analytics ───────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  weakTopics: () => api.get('/analytics/weak-topics'),
  progress: () => api.get('/analytics/progress'),
  session: (id: string) => api.get(`/analytics/session/${id}`),
}

export default api
