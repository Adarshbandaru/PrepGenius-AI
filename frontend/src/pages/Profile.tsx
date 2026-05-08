import { useAuthStore } from '@/store'
import { User, Mail, Calendar, Award } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()
  return (
    <div style={{ maxWidth: '700px' }} className="fade-in-up">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '2rem' }}>Profile</h1>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #6270f3, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800, color: 'white', boxShadow: '0 0 30px rgba(98,112,243,0.4)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#e2e8f0' }}>{user?.name}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(98,112,243,0.15)', border: '1px solid rgba(98,112,243,0.3)', padding: '0.2rem 0.75rem', borderRadius: '100px', marginTop: '0.35rem' }}>
              <Award size={12} color="#6270f3" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a4bbfd', textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
          </div>
        </div>
        {[
          { icon: User, label: 'Full Name', value: user?.name },
          { icon: Mail, label: 'Email', value: user?.email },
          { icon: Calendar, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color="rgba(255,255,255,0.4)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.15rem' }}>{label}</div>
              <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{value ?? '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
