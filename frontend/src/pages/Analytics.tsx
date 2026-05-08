import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/services/api'
import { useAuthStore } from '@/store'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts'
import { TrendingUp, AlertTriangle, Trophy, Target, Zap, Brain } from 'lucide-react'

const COLORS = ['#6270f3', '#8b5cf6', '#60d9fa', '#4ade80', '#facc15', '#f87171', '#fb923c', '#a78bfa', '#34d399', '#f472b6']

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const { data: dash } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
    enabled: !!user,
  })
  const { data: prog } = useQuery({
    queryKey: ['analytics-progress'],
    queryFn: () => analyticsApi.progress().then(r => r.data),
    enabled: !!user,
  })

  const progress = prog?.improvement ?? []
  const topicScores: { topic: string; score: number }[] = dash?.topicScores
    ? Object.entries(dash.topicScores).map(([topic, score]) => ({ topic, score: Number(score) }))
    : []
  const radarData = topicScores.slice(0, 8).map(({ topic, score }) => ({ subject: topic.length > 16 ? topic.slice(0, 16) + '…' : topic, A: score, fullMark: 10 }))
  const weakTopics: string[] = dash?.weakTopics?.filter(Boolean) ?? []
  const strongTopics: string[] = dash?.strongTopics?.filter(Boolean) ?? []
  const avgScore = dash?.averageScore ?? 0
  const totalSessions = dash?.totalSessions ?? 0

  // Compute MCQ accuracy if available
  const mcqCorrect = dash?.mcqCorrect
  const mcqTotal = dash?.mcqTotal

  const barHeight = Math.max(220, topicScores.length * 36)

  return (
    <div style={{ maxWidth: '1100px' }} className="fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.25rem' }}>Performance Analytics</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Deep insights into your interview performance and improvement trends</p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: Trophy, label: 'Overall Score', value: `${avgScore.toFixed(1)}/10`, color: '#facc15', sub: avgScore >= 7 ? 'Great work!' : 'Keep practicing' },
          { icon: Target, label: 'Total Sessions', value: totalSessions, color: '#6270f3', sub: `${totalSessions} completed` },
          { icon: TrendingUp, label: 'Strong Topics', value: strongTopics.length, color: '#4ade80', sub: strongTopics.slice(0, 2).join(', ') || 'None yet' },
          { icon: AlertTriangle, label: 'Weak Topics', value: weakTopics.length, color: '#f87171', sub: weakTopics.slice(0, 2).join(', ') || 'None yet' },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem' }}>{label}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Score Progress */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} color="#6270f3" /> Score Progress
          </h2>
          {progress.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              Complete sessions to see your progress
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={progress} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6270f3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6270f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.82rem' }} />
                <Area type="monotone" dataKey="score" stroke="#6270f3" strokeWidth={2.5} fill="url(#pGrad)" dot={{ fill: '#6270f3', r: 3 }} activeDot={{ r: 6, fill: '#a4bbfd' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar Chart */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={16} color="#8b5cf6" /> Topic Proficiency
          </h2>
          {radarData.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              Answer questions to build your proficiency map
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>

        {/* Topic Scores Bar */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#4ade80" /> Topic Scores
          </h2>
          {topicScores.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              No topic data yet — start an interview session
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={barHeight}>
              <BarChart data={topicScores} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="topic" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip
                  contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.82rem' }}
                  formatter={(v: any) => [`${v}/10`, 'Score']}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                  {topicScores.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weak / Strong Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(248,113,113,0.15)', flex: 1 }}>
            <h3 style={{ fontWeight: 700, color: '#f87171', fontSize: '0.88rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={14} /> Weak Topics
            </h3>
            {weakTopics.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No weak topics yet 🎉</p>
            ) : weakTopics.map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0', borderBottom: i < weakTopics.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(74,222,128,0.15)', flex: 1 }}>
            <h3 style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.88rem', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy size={14} /> Strong Topics
            </h3>
            {strongTopics.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Score 8+ to build strong topics</p>
            ) : strongTopics.map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.45rem 0', borderBottom: i < strongTopics.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
