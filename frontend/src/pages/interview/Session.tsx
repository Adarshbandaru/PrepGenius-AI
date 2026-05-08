import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { interviewApi } from '@/services/api'
import { useInterviewStore } from '@/store'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import { Clock, ChevronRight, Send, Loader2, Flag, Cpu, MessageSquare, Code2 } from 'lucide-react'

function Timer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000)
    return () => clearInterval(interval)
  }, [startTime])
  const m = Math.floor(elapsed / 60000)
  const s = Math.floor((elapsed % 60000) / 1000)
  return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: elapsed > 120000 ? '#f87171' : '#e2e8f0' }}>{m}:{s.toString().padStart(2, '0')}</span>
}

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mode, questionIndex, totalQuestions, currentQuestion: storeQuestion, setQuestion, addAnswer, resetSession } = useInterviewStore()
  const [answer, setAnswer] = useState('')
  const [code, setCode] = useState('// Write your solution here\n')
  const [selectedMcqIndex, setSelectedMcqIndex] = useState<number | null>(null)
  const [mcqSubmitted, setMcqSubmitted] = useState(false)
  const [questionStart, setQuestionStart] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [ending, setEnding] = useState(false)

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => interviewApi.getSession(id!).then((r) => r.data),
    enabled: !!id,
  })

  const session = sessionData?.session
  // Use Zustand store as primary (updated immediately on MCQ advance)
  // Fall back to React Query data on first load
  const currentQ = storeQuestion ?? sessionData?.currentQuestion

  useEffect(() => {
    // Seed the store from API on first load
    const apiQ = sessionData?.currentQuestion
    if (apiQ && !storeQuestion) {
      setQuestion(apiQ, sessionData.questionIndex ?? 0, sessionData.totalQuestions ?? 10)
      setQuestionStart(Date.now())
      setAnswer('')
      setCode('// Write your solution here\n')
      setSelectedMcqIndex(null)
      setMcqSubmitted(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData?.currentQuestion])

  const handleSubmit = async (mcqIdx?: number) => {
    // MCQ mode: use the directly passed index (avoids stale state closure bug)
    const isMcq = mode === 'mcq' || session?.mode === 'mcq'
    const resolvedMcqIdx = mcqIdx !== undefined ? mcqIdx : selectedMcqIndex
    const finalAnswer = isMcq
      ? (resolvedMcqIdx !== null && resolvedMcqIdx !== undefined ? currentQ?.options?.[resolvedMcqIdx] : '')
      : (mode === 'coding' ? code : answer)
    if (!finalAnswer?.trim()) { toast.error(isMcq ? 'Select an option first' : 'Please provide an answer'); return }
    setSubmitting(true)
    try {
      const timeTaken = Math.floor((Date.now() - questionStart) / 1000)
      const payload: any = {
        answer: finalAnswer, timeTaken,
        question: currentQ?.question,
        topic: currentQ?.topic,
        difficulty: currentQ?.difficulty,
      }
      if (isMcq) {
        payload.selectedIndex = resolvedMcqIdx
        payload.correctIndex = currentQ?.correct_index ?? currentQ?.correctIndex
        payload.options = currentQ?.options
        payload.explanation = currentQ?.explanation
      }
      const res = await interviewApi.submitAnswer(id!, payload)
      addAnswer(res.data.result)
      if (isMcq) {
        setMcqSubmitted(true)
        const correct = res.data.result.isCorrect
        toast[correct ? 'success' : 'error'](correct ? '✅ Correct! +10 points' : `❌ Wrong — ${currentQ?.explanation?.slice(0, 80) || 'Review this topic'}`)
        // Auto advance after 2.5s
        setTimeout(async () => {
          if (res.data.sessionComplete) {
            navigate(`/interview/result/${id}`); resetSession()
          } else {
            const nextRes = await interviewApi.nextQuestion(id!)
            // Reset all UI state BEFORE setting new question (prevents flash of old state)
            setMcqSubmitted(false)
            setSelectedMcqIndex(null)
            setAnswer('')
            setQuestionStart(Date.now())
            setQuestion(nextRes.data.question, nextRes.data.questionIndex, nextRes.data.totalQuestions)
          }
        }, 2500)
      } else {
        toast.success(`Score: ${res.data.result.aiScore}/10 ✨`)
        if (res.data.sessionComplete) {
          navigate(`/interview/result/${id}`); resetSession()
        } else {
          const nextRes = await interviewApi.nextQuestion(id!)
          setQuestion(nextRes.data.question, nextRes.data.questionIndex, nextRes.data.totalQuestions)
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const handleEnd = async () => {
    if (!window.confirm('End this interview session?')) return
    setEnding(true)
    try {
      await interviewApi.endSession(id!)
      navigate(`/interview/result/${id}`)
      resetSession()
    } catch { toast.error('Failed to end session') }
    finally { setEnding(false) }
  }

  const ModeIcon = { technical: Cpu, hr: MessageSquare, coding: Code2 }[session?.mode ?? 'technical'] ?? Cpu
  const modeColor = { technical: '#6270f3', hr: '#4ade80', coding: '#60d9fa' }[session?.mode ?? 'technical'] ?? '#6270f3'

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 size={40} color="#6270f3" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const progress = totalQuestions ? ((questionIndex) / totalQuestions) * 100 : 0

  return (
    <div style={{ maxWidth: '900px' }} className="fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `${modeColor}18`, border: `1px solid ${modeColor}44`, padding: '0.4rem 1rem', borderRadius: '100px' }}>
            <ModeIcon size={15} color={modeColor} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: modeColor, textTransform: 'capitalize' }}>{session?.mode} Interview</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{session?.targetRole}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            <Clock size={14} />
            <Timer startTime={questionStart} />
          </div>
          <button className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }} onClick={handleEnd} disabled={ending}>
            <Flag size={14} /> {ending ? 'Ending...' : 'End Session'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6270f3, #8b5cf6)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem', marginTop: '-1rem' }}>
        <span>Question {questionIndex + 1}</span>
        <span>{totalQuestions} total</span>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ background: 'rgba(98,112,243,0.15)', border: '1px solid rgba(98,112,243,0.3)', color: '#a4bbfd', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
              {currentQ.topic}
            </span>
            <span style={{
              padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600,
              background: { easy: 'rgba(74,222,128,0.1)', medium: 'rgba(250,204,21,0.1)', hard: 'rgba(248,113,113,0.1)' }[currentQ.difficulty as string] ?? 'rgba(255,255,255,0.05)',
              color: { easy: '#4ade80', medium: '#facc15', hard: '#f87171' }[currentQ.difficulty as string] ?? '#e2e8f0',
              border: `1px solid ${{ easy: 'rgba(74,222,128,0.3)', medium: 'rgba(250,204,21,0.3)', hard: 'rgba(248,113,113,0.3)' }[currentQ.difficulty as string] ?? 'rgba(255,255,255,0.1)'}`,
            }}>
              {currentQ.difficulty}
            </span>
          </div>
          <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.7, fontWeight: 500 }}>{currentQ.question}</p>
        </div>
      )}

      {/* Answer Area */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.875rem' }}>
          {(mode === 'mcq' || session?.mode === 'mcq') ? '🎯 Choose the correct answer' : mode === 'coding' ? '💻 Your Code' : '✍️ Your Answer'}
        </label>

        {(mode === 'mcq' || session?.mode === 'mcq') ? (
          !currentQ?.options?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Loading options...</p>
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(currentQ?.options || []).map((opt: string, idx: number) => {
              const isSelected = selectedMcqIndex === idx
              const isCorrect = currentQ?.correct_index === idx || currentQ?.correctIndex === idx
              let borderColor = 'rgba(255,255,255,0.08)'
              let bg = 'rgba(255,255,255,0.02)'
              if (mcqSubmitted) {
                if (isCorrect) { borderColor = '#4ade80'; bg = 'rgba(74,222,128,0.1)' }
                else if (isSelected && !isCorrect) { borderColor = '#f87171'; bg = 'rgba(248,113,113,0.1)' }
              } else if (isSelected) { borderColor = '#6270f3'; bg = 'rgba(98,112,243,0.12)' }
              return (
                <button key={idx} disabled={mcqSubmitted || submitting}
                  onClick={() => {
                    if (mcqSubmitted || submitting) return
                    setSelectedMcqIndex(idx)   // update visual highlight
                    handleSubmit(idx)           // pass idx directly — no stale state
                  }}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '10px', cursor: mcqSubmitted ? 'default' : 'pointer',
                    border: `2px solid ${borderColor}`, background: bg, color: '#e2e8f0',
                    textAlign: 'left', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${borderColor}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                    {['A','B','C','D'][idx]}
                  </span>
                  {opt}
                  {mcqSubmitted && isCorrect && <span style={{ marginLeft: 'auto', color: '#4ade80', fontSize: '1.1rem' }}>✓</span>}
                  {mcqSubmitted && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', color: '#f87171', fontSize: '1.1rem' }}>✗</span>}
                </button>
              )
            })}
            {mcqSubmitted && currentQ?.explanation && (
              <div style={{ padding: '0.875rem 1rem', borderRadius: '10px', background: 'rgba(98,112,243,0.1)', border: '1px solid rgba(98,112,243,0.2)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                💡 <strong style={{ color: '#a4bbfd' }}>Explanation:</strong> {currentQ.explanation}
              </div>
            )}
          </div>
          )  // closes options ternary
        ) : mode === 'coding' ? (
          <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Editor height="340px" defaultLanguage="javascript" theme="vs-dark" value={code}
              onChange={(v) => setCode(v ?? '')}
              options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 12 }, fontFamily: 'JetBrains Mono, monospace', scrollBeyondLastLine: false }} />
          </div>
        ) : (
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder={mode === 'hr' ? 'Use the STAR method: Situation → Task → Action → Result...' : 'Explain your approach, mention time/space complexity, edge cases...'}
            className="input-field" rows={8} style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }} />
        )}
      </div>

      {/* Submit — hide for MCQ (auto-submits on click) */}
      {(mode !== 'mcq' && session?.mode !== 'mcq') && (
        <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
          onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> AI Evaluating...</>
            : <><Send size={16} /> Submit Answer <ChevronRight size={16} /></>}
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
