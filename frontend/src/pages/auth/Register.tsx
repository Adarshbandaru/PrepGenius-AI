import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const benefits = ['AI-generated personalized questions', 'Real-time answer scoring', 'Weak topic detection', 'Performance analytics dashboard']

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.register({ name: data.name, email: data.email, password: data.password })
      setAuth(res.data.user, res.data.accessToken)
      toast.success('Account created! Welcome to PrepGenius AI 🚀')
      navigate('/resume')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--color-surface-900)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(98,112,243,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', maxWidth: '900px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Left — Benefits */}
        <div style={{ flex: 1, display: 'none' }} className="lg-show">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(98,112,243,0.15)', border: '1px solid rgba(98,112,243,0.3)', borderRadius: '100px', padding: '0.4rem 1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a4bbfd' }}>🚀 Free Forever Plan</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1.2, marginBottom: '1rem' }}>
            Your AI-Powered Interview Coach
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Get personalized mock interviews, instant AI feedback, and data-driven insights to land your dream role.
          </p>
          {benefits.map((b) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <CheckCircle2 size={18} color="#6270f3" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Right — Form */}
        <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', flex: '0 0 440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #6270f3, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 0 30px rgba(98,112,243,0.4)' }}>
              <Brain size={28} color="white" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.25rem' }}>Create Account</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Start your AI prep journey today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input {...register('name')} placeholder="John Doe" className="input-field" style={{ paddingLeft: '2.75rem' }} />
              </div>
              {errors.name && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" style={{ paddingLeft: '2.75rem' }} />
              </div>
              {errors.email && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" className="input-field" style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.password.message}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                <input {...register('confirmPassword')} type="password" placeholder="Re-enter password" className="input-field" style={{ paddingLeft: '2.75rem' }} />
              </div>
              {errors.confirmPassword && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.875rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Create Account</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Already have an account?{' '}
            <Link to="/auth/login" style={{ color: '#a4bbfd', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
