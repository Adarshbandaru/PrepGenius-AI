import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { interviewApi } from '@/services/api'
import { useInterviewStore } from '@/store'
import toast from 'react-hot-toast'
import { TARGET_ROLES } from '@/utils/constants'
import { Loader2, Code2, MessageSquare, Cpu, ChevronRight, Zap, CheckCircle, Clock, BarChart2, Brain, BookOpen } from 'lucide-react'

const MODES = [
  {
    id: 'technical', icon: Cpu, title: 'Technical', color: '#818cf8',
    desc: 'DSA, System Design, frameworks based on your resume',
    tips: ['Explain your thought process clearly', 'Mention time/space complexity', 'Ask clarifying questions first'],
    duration: '20–40 min', questions: 10, type: 'Open-ended AI evaluation',
  },
  {
    id: 'hr', icon: MessageSquare, title: 'HR Round', color: '#6ee7b7',
    desc: 'Behavioral & situational questions using STAR methodology',
    tips: ['Use STAR: Situation, Task, Action, Result', 'Be specific with examples', 'Show impact and learning'],
    duration: '15–25 min', questions: 10, type: 'Open-ended AI evaluation',
  },
  {
    id: 'coding', icon: Code2, title: 'Live Coding', color: '#93c5fd',
    desc: 'Solve algorithmic problems in a Monaco editor with AI review',
    tips: ['Write clean, readable code', 'Handle edge cases', 'Optimize after the brute force'],
    duration: '30–45 min', questions: 10, type: 'Code execution + AI review',
  },
  {
    id: 'mcq', icon: Zap, title: 'MCQ Challenge', color: '#fcd34d',
    desc: 'Multiple choice questions with instant correct/wrong feedback',
    tips: ['All 10 questions pre-loaded — no waiting', 'Read all options before selecting', 'Explanation shown after each answer'],
    duration: '10–15 min', questions: 10, type: 'Auto-scored (instant)',
  },
]

const DIFF_INFO: Record<string, { label: string; sub: string; color: string }> = {
  easy:   { label: 'Easy',   sub: 'Fundamentals, core concepts',       color: '#6ee7b7' },
  medium: { label: 'Medium', sub: 'Industry-level questions',           color: '#93c5fd' },
  hard:   { label: 'Hard',   sub: 'Senior/lead-level challenges',       color: '#fca5a5' },
}

export default function InterviewSetupPage() {
  const [mode, setMode] = useState('technical')
  const [role, setRole] = useState(TARGET_ROLES[0])
  const [customRole, setCustomRole] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const { setSession } = useInterviewStore()
  const navigate = useNavigate()

  const selectedMode = MODES.find(m => m.id === mode)!
  const finalRole = customRole.trim() || role

  const { mutate: startInterview, isPending } = useMutation({
    mutationFn: () => interviewApi.start({ mode, targetRole: finalRole, difficulty }),
    onSuccess: (res) => {
      const { session } = res.data
      setSession(session._id, session.mode, session.targetRole)
      toast.success('Session started!')
      navigate(`/interview/session/${session._id}`)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to start'),
  })

  return (
    <div style={{ maxWidth: '1100px' }} className="fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Interview</p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Configure Session</h1>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT: Config ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Step 1: Mode */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Step 1 · Mode</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {MODES.map(({ id, icon: Icon, title, desc, color }) => (
                <div key={id} onClick={() => setMode(id)} style={{
                  padding: '1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                  border: mode === id ? `1px solid ${color}60` : '1px solid rgba(255,255,255,0.06)',
                  background: mode === id ? `${color}12` : 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <Icon size={15} color={mode === id ? color : 'rgba(255,255,255,0.3)'} />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: mode === id ? '#f1f5f9' : 'rgba(255,255,255,0.5)' }}>{title}</span>
                    {mode === id && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: color }} />}
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Role */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Step 2 · Target Role</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {TARGET_ROLES.map(r => (
                <button key={r} onClick={() => { setRole(r); setCustomRole('') }} style={{
                  padding: '0.4rem 0.875rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
                  border: role === r && !customRole ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  background: role === r && !customRole ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                  color: role === r && !customRole ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  fontSize: '0.8rem', fontWeight: 500,
                }}>{r}</button>
              ))}
            </div>
            <input
              value={customRole}
              onChange={e => setCustomRole(e.target.value)}
              placeholder="Or type a custom role…"
              style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Step 3: Difficulty */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Step 3 · Difficulty</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {(['easy', 'medium', 'hard'] as const).map(d => {
                const { label, sub, color } = DIFF_INFO[d]
                return (
                  <button key={d} onClick={() => setDifficulty(d)} style={{
                    padding: '0.875rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    border: difficulty === d ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.06)',
                    background: difficulty === d ? `${color}12` : 'rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: difficulty === d ? color : 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>{sub}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Live Preview Panel ── */}
        <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Session Summary */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.25rem' }}>Session Preview</p>

            {/* Mode badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${selectedMode.color}12`, border: `1px solid ${selectedMode.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <selectedMode.icon size={17} color={selectedMode.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>{selectedMode.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{selectedMode.type}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
              {[
                { icon: Brain, label: 'Role', value: finalRole.length > 20 ? finalRole.slice(0, 18) + '…' : finalRole },
                { icon: BarChart2, label: 'Difficulty', value: DIFF_INFO[difficulty].label },
                { icon: BookOpen, label: 'Questions', value: `${selectedMode.questions}` },
                { icon: Clock, label: 'Est. Time', value: selectedMode.duration },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '9px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.3rem' }}>
                    <Icon size={11} color="rgba(255,255,255,0.25)" />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Tips for this mode</p>
              {selectedMode.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', marginTop: '6px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => startInterview()}
              disabled={isPending}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '9px',
                background: isPending ? 'rgba(99,102,241,0.5)' : '#6366f1',
                color: 'white', fontWeight: 600, fontSize: '0.875rem',
                border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s',
              }}
              onMouseEnter={e => !isPending && ((e.currentTarget as HTMLButtonElement).style.background = '#4f46e5')}
              onMouseLeave={e => !isPending && ((e.currentTarget as HTMLButtonElement).style.background = '#6366f1')}
            >
              {isPending
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <>Start Session <ChevronRight size={14} /></>
              }
            </button>
          </div>

          {/* What to expect */}
          <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>What happens next</p>
            {[
              mode === 'mcq' ? '10 questions pre-loaded — all instant' : 'AI generates your first question',
              'Answer at your own pace',
              mode === 'mcq' ? 'Instant correct/wrong feedback per question' : 'Get AI feedback per answer',
              'Full results & score breakdown at the end',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', width: '18px', height: '18px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
