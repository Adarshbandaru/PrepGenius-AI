import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resumeApi } from '@/services/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'
import { Upload, CheckCircle2, Loader2, Briefcase, GraduationCap, Code2, Wrench,
  Zap, TrendingUp, Target, Award, AlertTriangle, ChevronRight, Brain, Sparkles } from 'lucide-react'

// ─── ATS Score Ring ───────────────────────────────────────
const ScoreRing = ({ score, size = 120, label }: { score: number; size?: number; label?: string }) => {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#4ade80' : score >= 55 ? '#facc15' : '#f87171'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 8px ${color})` }} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={color}
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: size > 100 ? '1.6rem' : '1rem', fontWeight: 800, fontFamily: 'Inter' }}>
          {score}
        </text>
      </svg>
      {label && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{label}</span>}
    </div>
  )
}

// ─── Demand Badge ─────────────────────────────────────────
const DemandBadge = ({ demand }: { demand: string }) => {
  const map: any = { High: '#4ade80', Medium: '#facc15', Low: '#f87171' }
  const color = map[demand] || '#e2e8f0'
  return <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, padding: '0.15rem 0.55rem', borderRadius: '100px' }}>{demand} Demand</span>
}

export default function ResumePage() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: resumeData, isLoading } = useQuery({
    queryKey: ['resume-parsed'],
    queryFn: () => resumeApi.getParsed().then(r => r.data),
    retry: false,
    enabled: !!user,
  })

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return }
    setUploading(true)
    setAnalysis(null)
    try {
      await resumeApi.upload(file)
      queryClient.invalidateQueries({ queryKey: ['resume-parsed'] })
      toast.success('Resume uploaded! 🎉 Now click "Analyze Profile" for AI insights.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setUploading(false) }
  }, [queryClient])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  })

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await resumeApi.analyze()
      setAnalysis(res.data.analysis)
      toast.success('AI analysis complete! 🚀')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Analysis failed')
    } finally { setAnalyzing(false) }
  }

  const parsed = resumeData?.parsed

  return (
    <div style={{ maxWidth: '960px' }} className="fade-in-up">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.25rem' }}>Resume Intelligence</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Upload your resume → Get ATS score, job recommendations & skill gap analysis</p>
      </div>

      {/* Upload Zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? '#6270f3' : parsed ? '#4ade8066' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center', cursor: 'pointer',
        background: isDragActive ? 'rgba(98,112,243,0.08)' : parsed ? 'rgba(74,222,128,0.03)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s ease', marginBottom: '1.5rem',
      }}>
        <input {...getInputProps()} />
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 size={40} color="#6270f3" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#a4bbfd', fontWeight: 600 }}>Uploading & parsing your resume...</p>
          </div>
        ) : parsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <CheckCircle2 size={36} color="#4ade80" />
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '1rem' }}>Resume Uploaded Successfully!</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>Drop a new file to replace · {parsed.skills?.length || 0} skills detected</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(98,112,243,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={24} color="#6270f3" />
            </div>
            <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{isDragActive ? 'Drop here' : 'Drag & drop your resume'}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>or <span style={{ color: '#6270f3', fontWeight: 600 }}>click to browse</span> · PDF or DOCX · Max 5MB</p>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {parsed && !analyzing && (
        <button onClick={handleAnalyze} className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginBottom: '2rem', fontSize: '1rem', background: 'linear-gradient(135deg, #6270f3, #8b5cf6)' }}>
          {analysis ? <><Sparkles size={18} /> Re-analyze with AI</> : <><Brain size={18} /> Analyze My Profile — Get ATS Score & Job Matches</>}
        </button>
      )}
      {analyzing && (
        <div style={{ textAlign: 'center', padding: '2rem', marginBottom: '2rem', background: 'rgba(98,112,243,0.08)', borderRadius: '16px', border: '1px solid rgba(98,112,243,0.2)' }}>
          <Loader2 size={32} color="#6270f3" style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
          <p style={{ color: '#a4bbfd', fontWeight: 600 }}>AI is analyzing your profile...</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Computing ATS score · Finding best-fit roles · Detecting skill gaps</p>
        </div>
      )}

      {/* ── AI INTELLIGENCE PANEL ── */}
      {analysis && (
        <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}>

          {/* Row 1: ATS Score + Readiness + Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* ATS Score */}
            <div className="glass-card" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(98,112,243,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(98,112,243,0.25)' }}>
              <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="#6270f3" /> ATS Score
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <ScoreRing score={analysis.ats_score} size={120} />
                <div style={{ flex: 1 }}>
                  {Object.entries(analysis.ats_breakdown || {}).map(([key, val]: any) => (
                    <div key={key} style={{ marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.25rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                        <span style={{ color: '#a4bbfd' }}>{val}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${val}%`, background: val >= 70 ? '#4ade80' : val >= 50 ? '#facc15' : '#f87171', borderRadius: '2px', transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Readiness + Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={15} color="#facc15" /> Interview Readiness</h4>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: analysis.interview_readiness >= 70 ? '#4ade80' : '#facc15' }}>{analysis.interview_readiness}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analysis.interview_readiness}%`, background: 'linear-gradient(90deg, #6270f3, #4ade80)', borderRadius: '4px', transition: 'width 1.2s ease' }} />
                </div>
              </div>
              <div className="glass-card" style={{ padding: '1.25rem', flex: 1 }}>
                <h4 style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={14} color="#6270f3" /> AI Profile Summary</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.6 }}>{analysis.profile_summary}</p>
              </div>
            </div>
          </div>

          {/* Row 2: Job Recommendations */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#4ade80" /> Best-Fit Job Roles for You
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {(analysis.recommended_roles || []).map((role: any, i: number) => {
                const matchColor = role.match_pct >= 85 ? '#4ade80' : role.match_pct >= 70 ? '#facc15' : '#f87171'
                return (
                  <div key={i} style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${matchColor}33`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle at top right, ${matchColor}22, transparent)`, borderRadius: '0 12px 0 0' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>{role.role}</div>
                        <div style={{ color: matchColor, fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>{role.match_pct}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>match</div>
                      </div>
                      <DemandBadge demand={role.demand} />
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{role.why}</p>
                    <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>💰 {role.salary_range}</div>
                    {role.missing_skills?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.35rem' }}>Skill Gap:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {role.missing_skills.map((s: string) => (
                            <span key={s} style={{ fontSize: '0.7rem', background: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.2)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Row 3: Strengths + Improvements + Certifications */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.88rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={15} /> Your Strengths</h4>
              {(analysis.strengths || []).map((s: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ color: '#4ade80', marginTop: '1px', flexShrink: 0 }}>✓</span>{s}
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, color: '#f87171', fontSize: '0.88rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={15} /> Improvements</h4>
              {(analysis.improvements || []).map((s: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ color: '#f87171', marginTop: '1px', flexShrink: 0 }}>→</span>{s}
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, color: '#facc15', fontSize: '0.88rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={15} /> Recommended Certs</h4>
              {(analysis.top_certifications || []).map((cert: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ color: '#facc15', marginTop: '1px', flexShrink: 0 }}>🎓</span>{cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PARSED DATA ── */}
      {isLoading && <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#6270f3' }} /></div>}

      {parsed && !isLoading && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {parsed.skills?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}><Wrench size={16} color="#6270f3" /> Skills Detected ({parsed.skills.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {parsed.skills.map((s: string) => (
                  <span key={s} style={{ background: 'rgba(98,112,243,0.15)', border: '1px solid rgba(98,112,243,0.3)', color: '#a4bbfd', padding: '0.3rem 0.875rem', borderRadius: '100px', fontSize: '0.82rem', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {parsed.education?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}><GraduationCap size={16} color="#4ade80" /> Education</h3>
              {parsed.education.map((e: any, i: number) => (
                <div key={i} style={{ padding: '0.75rem 0', borderBottom: i < parsed.education.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{e.degree}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>{e.institute} · {e.year}</div>
                </div>
              ))}
            </div>
          )}
          {parsed.experience?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}><Briefcase size={16} color="#8b5cf6" /> Experience</h3>
              {parsed.experience.map((e: any, i: number) => (
                <div key={i} style={{ padding: '0.75rem 0', borderBottom: i < parsed.experience.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{e.role}</div>
                  <div style={{ color: '#a4bbfd', fontSize: '0.85rem' }}>{e.company} · {e.duration}</div>
                  {e.description && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.25rem', lineHeight: 1.5 }}>{e.description}</p>}
                </div>
              ))}
            </div>
          )}
          {parsed.projects?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}><Code2 size={16} color="#60d9fa" /> Projects</h3>
              {parsed.projects.map((p: any, i: number) => (
                <div key={i} style={{ padding: '0.75rem 0', borderBottom: i < parsed.projects.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>{p.name}</div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>{p.description}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {p.tech?.map((t: string) => <span key={t} style={{ background: 'rgba(96,217,250,0.1)', border: '1px solid rgba(96,217,250,0.2)', color: '#60d9fa', padding: '0.15rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA if no analysis yet */}
          {!analysis && (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(98,112,243,0.1), rgba(139,92,246,0.07))', borderRadius: '14px', border: '1px dashed rgba(98,112,243,0.3)' }}>
              <Brain size={32} color="#6270f3" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: '#a4bbfd', fontWeight: 600, marginBottom: '0.35rem' }}>Get Your AI-Powered Career Report</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginBottom: '1rem' }}>ATS Score · Best-fit job roles with salary ranges · Skill gap analysis · Certification roadmap</p>
              <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                <Sparkles size={16} /> Analyze Now — It's Free
              </button>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
