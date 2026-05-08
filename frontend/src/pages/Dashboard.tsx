import { useQuery } from '@tanstack/react-query'
import { analyticsApi, interviewApi } from '@/services/api'
import { useAuthStore } from '@/store'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowRight, Clock, CheckCircle, XCircle, ChevronRight, Sparkles, BarChart2 } from 'lucide-react'

// ── Clean score badge (no ring, no glow) ──────────────────
const ScoreBadge = ({ score, mode }: { score: number; mode: string }) => {
  const isMcq = mode === 'mcq'
  // Neutral text-based indicator only
  const label = score >= 8 ? 'High' : score >= 5 ? 'Mid' : score > 0 ? 'Low' : '—'
  const dot = score >= 8 ? '#6ee7b7' : score >= 5 ? '#93c5fd' : score > 0 ? '#fca5a5' : 'rgba(255,255,255,0.15)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '52px', gap: '3px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{score > 0 ? score.toFixed(1) : '—'}</span>
      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

const MODE_LABELS: Record<string, string> = { technical: 'Technical', hr: 'HR', coding: 'Coding', mcq: 'MCQ' }

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: analytics } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
    enabled: !!user, staleTime: 1000 * 60 * 5,
  })

  const { data: historyData } = useQuery({
    queryKey: ['interview-history'],
    queryFn: () => interviewApi.history(1).then(r => r.data),
    enabled: !!user, staleTime: 1000 * 60 * 5,
  })

  const sessions = historyData?.sessions ?? []
  const avg = analytics?.averageScore ?? 0
  const total = analytics?.totalSessions ?? 0
  const weak = analytics?.weakTopics?.filter(Boolean) ?? []
  const strong = analytics?.strongTopics?.filter(Boolean) ?? []
  const progress = analytics?.improvement ?? []

  return (
    <div style={{ maxWidth: '1100px' }} className="fade-in-up">

      {/* ── Header ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Dashboard
        </p>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          {total === 0 ? 'No sessions yet — start your first interview below.' : `${total} session${total > 1 ? 's' : ''} completed · Keep building momentum.`}
        </p>
      </div>

      {/* ── Stat Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {[
          { label: 'Avg Score', value: avg ? `${avg.toFixed(1)}` : '—', sub: 'out of 10' },
          { label: 'Sessions', value: total || '0', sub: 'completed' },
          { label: 'Strong Topics', value: strong.length || '0', sub: strong[0] || 'none yet' },
          { label: 'To Improve', value: weak.length || '0', sub: weak[0] || 'none yet' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: 'rgba(15,15,25,0.95)', padding: '1.4rem 1.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Score Trend */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</p>
              <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>Score Trend</h2>
            </div>
            <BarChart2 size={18} color="rgba(255,255,255,0.2)" />
          </div>
          {progress.length === 0 ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.85rem' }}>
              Complete sessions to see your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={progress} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => {
                    try { return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) } catch { return v }
                  }}
                />
                <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#13131d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#a5b4fc' }}
                  labelFormatter={(v) => {
                    try { return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return v }
                  }}
                  formatter={(v: any) => [`${Number(v).toFixed(1)}/10`, 'Score']}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#sg)" dot={false} activeDot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Start Interview CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '14px', padding: '1.5rem', flex: 1 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
              <Sparkles size={16} color="#818cf8" />
            </div>
            <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Start Interview</h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Adaptive AI session tailored to your resume and target role.
            </p>
            <button
              onClick={() => navigate('/interview/setup')}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#6366f1', color: 'white', fontWeight: 600, fontSize: '0.82rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}
            >
              Begin Session <ArrowRight size={14} />
            </button>
          </div>

          {/* Focus Areas — only if data exists */}
          {weak.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Focus Areas</p>
              {weak.slice(0, 3).map((t: string, i: number) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0', borderBottom: i < Math.min(weak.length, 3) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Sessions ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</p>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>Recent Sessions</h2>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.35rem 0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Clock size={28} style={{ margin: '0 auto 0.75rem', color: 'rgba(255,255,255,0.1)' }} />
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>No sessions yet. Start your first interview!</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 32px', gap: '1rem', padding: '0 0.75rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem' }}>
              {['Session', 'Mode', 'Questions', 'Score', ''].map(h => (
                <span key={h} style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {/* Rows */}
            {sessions.slice(0, 6).map((s: any, i: number) => {
              const score = s.overallScore || 0
              const isMcq = s.mode === 'mcq'
              const correctCount = isMcq ? s.questions?.filter((q: any) => q.isCorrect).length : null
              return (
                <div
                  key={s._id}
                  onClick={() => navigate(`/interview/result/${s._id}`)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 32px', gap: '1rem', padding: '0.75rem', borderRadius: '9px', cursor: 'pointer', transition: 'background 0.15s', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{s.targetRole}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.15rem' }}>{new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                    {MODE_LABELS[s.mode] || s.mode}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                    {s.questions?.length || 0}
                  </span>
                  <div style={{ textAlign: 'center' }}>
                    {isMcq && correctCount !== null && (s.questions?.length || 0) > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <CheckCircle size={12} color="#6ee7b7" />
                        <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{correctCount}/{s.questions?.length}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.88rem', color: score > 0 ? '#e2e8f0' : 'rgba(255,255,255,0.2)', fontWeight: score > 0 ? 600 : 400 }}>
                        {score > 0 ? `${score.toFixed(1)}` : '—'}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
