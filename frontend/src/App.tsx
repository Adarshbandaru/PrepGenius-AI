import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import api from '@/services/api'
import LandingPage from '@/pages/Landing'
import LoginPage from '@/pages/auth/Login'
import RegisterPage from '@/pages/auth/Register'
import DashboardPage from '@/pages/Dashboard'
import ResumePage from '@/pages/Resume'
import InterviewSetupPage from '@/pages/interview/Setup'
import InterviewSessionPage from '@/pages/interview/Session'
import InterviewResultPage from '@/pages/interview/Result'
import AnalyticsPage from '@/pages/Analytics'
import ProfilePage from '@/pages/Profile'
import AppLayout from '@/components/layout/AppLayout'
import { Loader2 } from 'lucide-react'

// ─── Auth Initializer ─────────────────────────────────────
// Runs ONCE on mount — validates the stored token against the server.
// Shows a spinner until resolved so protected routes NEVER flash.
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken, setAuth, clearAuth } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      // If no token at all — nothing to validate, mark ready immediately
      const storedToken = accessToken || localStorage.getItem('accessToken')
      if (!storedToken && !isAuthenticated) {
        setReady(true)
        return
      }

      // Try to validate the current token with /auth/me
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        // Token is valid — make sure store is up to date
        setAuth(res.data.user, storedToken!)
        setReady(true)
      } catch {
        // Token is invalid — try silent refresh via httpOnly cookie
        try {
          const refreshRes = await api.post('/auth/refresh')
          const newToken = refreshRes.data.accessToken
          localStorage.setItem('accessToken', newToken)
          // Now get user info
          const meRes = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${newToken}` },
          })
          setAuth(meRes.data.user, newToken)
          setReady(true)
        } catch {
          // Both failed — clear everything and go to login
          clearAuth()
          setReady(true)
        }
      }
    }
    init()
  }, []) // Only runs once on mount

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0f', gap: '1rem',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #6270f3, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>P</span>
        </div>
        <Loader2 size={24} color="#6270f3" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return <>{children}</>
}

// ─── Route Guards ─────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

// ─── App ──────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/interview/setup" element={<InterviewSetupPage />} />
            <Route path="/interview/session/:id" element={<InterviewSessionPage />} />
            <Route path="/interview/result/:id" element={<InterviewResultPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  )
}
