import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'
import { LayoutDashboard, FileText, Mic, BarChart3, User, LogOut, Zap } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume', icon: FileText, label: 'Resume' },
  { to: '/interview/setup', icon: Mic, label: 'Interview' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function AppLayout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    navigate('/')
    toast.success('Logged out')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', minHeight: '100vh',
        background: '#0d0d14',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '1.75rem 0.875rem',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0 0.5rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '0.9rem' }}>P</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9', letterSpacing: '-0.01em' }}>PrepGenius</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>AI Platform</div>
          </div>
        </div>

        {/* Quick Start */}
        <button
          onClick={() => navigate('/interview/setup')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '9px', background: '#6366f1', color: 'white', fontWeight: 600, fontSize: '0.82rem', border: 'none', cursor: 'pointer', marginBottom: '2rem', transition: 'background 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
          onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
        >
          <Zap size={14} /> Start Interview
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.625rem',
              padding: '0.625rem 0.875rem', borderRadius: '8px', textDecoration: 'none',
              fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.15s',
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.38)',
              border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: '220px', flex: 1, minHeight: '100vh', padding: '2.5rem', overflow: 'auto', background: '#0a0a0f' }}>
        <Outlet />
      </main>
    </div>
  )
}
