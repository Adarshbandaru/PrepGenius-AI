import { useNavigate } from 'react-router-dom'
import { Brain, Zap, Target, BarChart3, Code2, MessageSquare, ArrowRight, Star, CheckCircle2 } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Question Generation', desc: 'GPT-4 powered questions tailored to your resume and target role', color: '#6270f3' },
  { icon: Target, title: 'Adaptive Difficulty', desc: 'Questions adapt in real-time based on your performance', color: '#8b5cf6' },
  { icon: Code2, title: 'Live Coding Interviews', desc: 'Monaco editor with Judge0 code execution and AI review', color: '#60d9fa' },
  { icon: MessageSquare, title: 'HR Round Practice', desc: 'Behavioral interviews with STAR method scoring', color: '#4ade80' },
  { icon: BarChart3, title: 'Performance Analytics', desc: 'Detailed insights on weak topics and score trends', color: '#facc15' },
  { icon: Zap, title: 'Instant AI Feedback', desc: 'Real-time evaluation with improvement suggestions', color: '#f87171' },
]

const stats = [
  { value: '10K+', label: 'Mock Interviews' },
  { value: '500+', label: 'Question Topics' },
  { value: '95%', label: 'Success Rate' },
  { value: '4.9★', label: 'User Rating' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-900)', overflowX: 'hidden' }}>
      {/* Ambient BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,112,243,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-15%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '30%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,217,250,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 5%', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #6270f3, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(98,112,243,0.5)' }}>
            <Brain size={22} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#e2e8f0' }}>PrepGenius <span style={{ color: '#6270f3' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/auth/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('/auth/register')}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '6rem 5% 4rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(98,112,243,0.15)', border: '1px solid rgba(98,112,243,0.3)', borderRadius: '100px', padding: '0.4rem 1.25rem', marginBottom: '2rem' }}>
          <Star size={14} color="#6270f3" fill="#6270f3" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a4bbfd' }}>Powered by GPT-4 & Gemini AI</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', color: '#e2e8f0' }}>
          Ace Every Interview with<br />
          <span className="gradient-text">AI-Powered Preparation</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.5)', maxWidth: '640px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Upload your resume, choose your role, and get personalized mock interviews with real-time AI feedback, adaptive questioning, and performance analytics.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '0.875rem 2.5rem', fontSize: '1.05rem' }} onClick={() => navigate('/auth/register')}>
            Start Free Interview <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1.05rem' }} onClick={() => navigate('/auth/login')}>
            View Demo
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {stats.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6270f3' }}>{value}</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '4rem 5%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.75rem' }}>
          Everything You Need to <span className="gradient-text">Succeed</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: '3rem', fontSize: '1.05rem' }}>
          A complete interview preparation ecosystem powered by cutting-edge AI
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', maxWidth: '1100px', margin: '0 auto' }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass-card" style={{ padding: '1.75rem', transition: 'transform 0.2s ease', cursor: 'default' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interview Modes */}
      <section style={{ padding: '4rem 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '3rem' }}>
          3 Interview <span className="gradient-text">Modes</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { title: '⚙️ Technical', color: '#6270f3', items: ['Data Structures & Algorithms', 'System Design', 'Framework-specific Q&A', 'Resume-based questions'] },
            { title: '💬 HR Round', color: '#4ade80', items: ['Behavioral questions', 'STAR method evaluation', 'Culture fit assessment', 'Situation-based scenarios'] },
            { title: '💻 Coding', color: '#60d9fa', items: ['Live Monaco editor', 'Judge0 code execution', 'Multiple languages', 'Complexity analysis'] },
          ].map(({ title, color, items }) => (
            <div key={title} className="glass-card" style={{ padding: '1.75rem', border: `1px solid ${color}22` }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color, marginBottom: '1rem' }}>{title}</h3>
              {items.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={14} color={color} />
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 5%', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#e2e8f0', marginBottom: '1rem' }}>
            Ready to Land Your <span className="gradient-text">Dream Job?</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Join thousands of developers who cracked top tech interviews with PrepGenius AI.
          </p>
          <button className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }} onClick={() => navigate('/auth/register')}>
            Start Preparing Now — Free <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem 5%', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>
        © 2026 PrepGenius AI. Built with ❤️ using GPT-4, React & FastAPI.
      </footer>
    </div>
  )
}
