import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertCircle } from 'lucide-react'
import { login } from '../api/auth'
import Card from '../components/common/Card'
import Field from '../components/common/Field'
import Btn from '../components/common/Btn'
import Spinner from '../components/common/Spinner'

/**
 * LoginPage component.
 * @param {Object} props
 * @param {function(import('../types').Persona): void} props.onLogin
 * @returns {React.ReactElement}
 */
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await login(username, password)
      onLogin(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} className="animate-fade">
        <Card glow>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={24} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Log in to access your connections</p>
          </div>
          <form onSubmit={handleLogin}>
            <Field label="Username" value={username} onChange={setUsername} placeholder="admin" required />
            <Field label="Password" value={password} onChange={setPassword} password required />
            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 11, color: 'var(--accent-red)' }}>
                <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />{error}
              </div>
            )}
            <Btn variant="primary" size="lg" disabled={loading || !username || !password} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? <Spinner size={14} /> : 'Sign In'}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
