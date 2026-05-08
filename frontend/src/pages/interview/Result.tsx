import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/services/api'
import { Trophy, AlertTriangle, CheckCircle2, TrendingUp, Clock, ChevronLeft,
  RotateCcw, ArrowRight, XCircle, Target, Zap } from 'lucide-react'

// ─── Premium Score Display (no ring) ─────────────────────
const ScoreHero = ({ score, total, isMcq }: { score: number; total: number; isMcq: boolean }) => {
  const pct = isMcq ? (score / 10) * 100 : (score / 10) * 100
  const grade = score >= 9 ? { label: 'Excellent', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', emoji: '🏆' }
    : score >= 7 ? { label: 'Very Good', color: '#60d9fa', bg: 'rgba(96,217,250,0.12)', emoji: '🎯' }
    : score >= 5 ? { label: 'Good', color: '#facc15', bg: 'rgba(250,204,21,0.12)', emoji: '📈' }
    : score >= 3 ? { label: 'Fair', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', emoji: '💪' }
    : { label: 'Needs Work', color: '#f87171', bg: 'rgba(248,113,113,0.12)', emoji: '📚' }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Grade badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        background: grade.bg, border: `1px solid ${grade.color}44`,
        borderRadius: '100px', padding: '0.4rem 1.25rem', marginBottom: '1.5rem',
      }}>
        <span style={{ fontSize: '1rem' }}>{grade.emoji}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: grade.color }}>{grade.label}</span>
      </div>

      {/* Big score number */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '5rem', fontWeight: 900, color: grade.color, lineHeight: 1, fontFamily: 'Inter' }}>
            {score.toFixed(1)}
          </span>
          <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/10</span>
        </div>
        {isMcq && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {Math.round(pct)}% correct answers
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: '320px', margin: '0 auto 0.5rem', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${grade.color}88, ${grade.color})`,
          borderRadius: '4px', transition: 'width 1.5s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
        {isMcq ? `${Math.round(pct / 10)} of 10 correct` : `Score out of 10`}
      </div>
    </div>
  )
}

export default function InterviewResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['session-result', id],
    queryFn: () => analyticsApi.session(id!).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6270f3, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trophy size={20} color="white" />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading your results...</p>
    </div>
  )

  const session = data?.session
  const questions = session?.questions ?? []
  const avg = session?.overallScore ?? 0
  const weak = session?.weakTopics ?? []
  const isMcq = session?.mode === 'mcq'
  const correctCount = isMcq ? questions.filter((q: any) => q.isCorrect).length : null
  const duration = session?.completedAt && session?.startedAt
    ? Math.floor((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : 0

  return (
    <div style={{ maxWidth: '900px' }} className="fade-in-up">
      <button className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/dashboard')}>
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      {/* ── Score Hero Card ── */}
      <div className="glass-card" style={{
        padding: '2.5rem 2rem', marginBottom: '1.25rem',
        background: 'linear-gradient(135deg, rgba(15,15,30,0.9), rgba(98,112,243,0.08))',
        border: '1px solid rgba(98,112,243,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,112,243,0.15), transparent)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Trophy size={18} color="#facc15" />
          <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
            {isMcq ? 'MCQ Challenge Complete!' : 'Interview Complete!'}
          </span>
        </div>

        <ScoreHero score={avg} total={questions.length} isMcq={!!isMcq} />

        {/* Stats row */}
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '360px', margin: '2rem auto 0' }}>
          {[
            { icon: Target, label: 'Questions', value: questions.length, color: '#6270f3' },
            { icon: Clock, label: 'Duration', value: `${duration}m`, color: '#60d9fa' },
            isMcq
              ? { icon: CheckCircle2, label: 'Correct', value: `${correctCount}/${questions.length}`, color: '#4ade80' }
              : { icon: AlertTriangle, label: 'Weak Topics', value: weak.length, color: '#f87171' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Icon size={16} color={color} style={{ margin: '0 auto 0.4rem' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weak Topics ── */}
      {weak.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid rgba(248,113,113,0.15)' }}>
          <h2 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} color="#f87171" /> Focus Areas for Next Session
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {weak.map((t: string) => (
              <span key={t} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5', padding: '0.35rem 0.875rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Q&A Breakdown ── */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={16} color="#6270f3" /> Question Breakdown
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {questions.map((q: any, i: number) => {
            const score = q.aiScore ?? 0
            const isWrong = isMcq && !q.isCorrect
            const scoreColor = isMcq ? (q.isCorrect ? '#4ade80' : '#f87171') : (score >= 7 ? '#4ade80' : score >= 5 ? '#facc15' : '#f87171')

            return (
              <div key={i} style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${isWrong ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.04)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: q.aiFeedback || q.explanation ? '0.75rem' : 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      {isMcq
                        ? (q.isCorrect ? <CheckCircle2 size={13} color="#4ade80" /> : <XCircle size={13} color="#f87171" />)
                        : <Zap size={13} color="#6270f3" />}
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>Q{i+1} · {q.topic}</span>
                    </div>
                    <p style={{ color: '#e2e8f0', fontWeight: 500, lineHeight: 1.5, fontSize: '0.9rem' }}>{q.question}</p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: scoreColor }}>{score}<span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/10</span></div>
                    {isMcq && <div style={{ fontSize: '0.7rem', color: scoreColor, fontWeight: 600 }}>{q.isCorrect ? 'Correct' : 'Wrong'}</div>}
                  </div>
                </div>

                {/* MCQ explanation */}
                {isMcq && q.explanation && (
                  <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(98,112,243,0.07)', borderRadius: '8px', borderLeft: '3px solid #6270f3', fontSize: '0.8rem', color: '#a4bbfd', lineHeight: 1.6 }}>
                    💡 {q.explanation}
                  </div>
                )}

                {/* Text answer feedback */}
                {!isMcq && q.aiFeedback && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    {q.aiFeedback.strengths?.length > 0 && (
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strengths</span>
                        {q.aiFeedback.strengths.map((s: string) => (
                          <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.25rem' }}>
                            <CheckCircle2 size={11} color="#4ade80" style={{ marginTop: '3px', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.aiFeedback.improvements?.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Improve</span>
                        {q.aiFeedback.improvements.map((s: string) => (
                          <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.25rem' }}>
                            <AlertTriangle size={11} color="#f87171" style={{ marginTop: '3px', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.aiFeedback.suggestion && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(98,112,243,0.07)', borderRadius: '8px', borderLeft: '3px solid #6270f3' }}>
                        <span style={{ fontSize: '0.78rem', color: '#a4bbfd', lineHeight: 1.5 }}>💡 {q.aiFeedback.suggestion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }} onClick={() => navigate('/interview/setup')}>
          <RotateCcw size={16} /> New Interview
        </button>
        <button className="btn btn-primary" style={{ flex: 1, padding: '0.875rem' }} onClick={() => navigate('/analytics')}>
          View Analytics <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
