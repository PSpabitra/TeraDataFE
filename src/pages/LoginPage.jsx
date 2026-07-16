import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertCircle, RefreshCw } from 'lucide-react'
import { login, getCaptcha } from '../api/auth'
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
  const [email, setEmail] = useState('admin@teramigrate.com')
  const [password, setPassword] = useState('admin')
  const [captchaData, setCaptchaData] = useState(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loadCaptcha = async () => {
    try {
      const data = await getCaptcha()
      setCaptchaData(data)
      setCaptchaAnswer('')
    } catch (err) {
      console.error('Failed to load captcha', err)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await login(email, password, captchaData?.captcha_id, captchaAnswer)
      onLogin(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      await loadCaptcha() // Refresh CAPTCHA on failure
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
            <Field label="Email" value={email} onChange={setEmail} placeholder="admin@teramigrate.com" required />
            <Field label="Password" value={password} onChange={setPassword} password required />
            
            {captchaData && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Security Check
                  </label>
                  <button type="button" onClick={loadCaptcha} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ 
                    flex: 1, 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border-dim)', 
                    borderRadius: 'var(--radius)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}>
                    {captchaData.question}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Field 
                      placeholder="Answer" 
                      value={captchaAnswer} 
                      onChange={setCaptchaAnswer} 
                      required 
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 11, color: 'var(--accent-red)' }}>
                <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />{error}
              </div>
            )}
            <Btn variant="primary" size="lg" disabled={loading || !email || !password || !captchaAnswer} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? <Spinner size={14} /> : 'Sign In'}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
