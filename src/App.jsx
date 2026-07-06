import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { useWebSocket } from './useWebSocket.js'
import {
  Database, Zap, GitBranch, Play, CheckCircle, AlertCircle,
  Loader2, ChevronRight, Server, Cloud, Activity, BarChart2,
  FileText, Settings, RefreshCw, Table2, Workflow, Eye,
  Shield, ArrowRight, Circle, Check, X, Info, Clock,
  Terminal, Layers, Search, Filter, TrendingUp, AlertTriangle, LogOut
} from 'lucide-react'

const CLIENT_ID = `ui-${Math.random().toString(36).slice(2, 9)}`
const API = 'http://localhost:3007'

// ─── Tiny primitives ──────────────────────────────────────────────────────────
const Badge = ({ children, color = 'cyan', size = 'sm' }) => {
  const colors = {
    cyan: 'background:rgba(56,189,248,0.1);color:#38bdf8;border-color:rgba(56,189,248,0.25)',
    green: 'background:rgba(16,185,129,0.1);color:#10b981;border-color:rgba(16,185,129,0.25)',
    amber: 'background:rgba(245,158,11,0.1);color:#f59e0b;border-color:rgba(245,158,11,0.25)',
    red: 'background:rgba(239,68,68,0.1);color:#ef4444;border-color:rgba(239,68,68,0.25)',
    violet: 'background:rgba(139,92,246,0.1);color:#8b5cf6;border-color:rgba(139,92,246,0.25)',
    gray: 'background:rgba(100,116,139,0.12);color:#8ba3c7;border-color:rgba(100,116,139,0.2)',
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '2px 7px' : '3px 10px',
      borderRadius: 20, border: '1px solid', fontSize: size === 'sm' ? 10 : 11,
      fontWeight: 500, letterSpacing: '0.04em',
      ...(Object.fromEntries(colors[color].split(';').map(s => s.split(':').map(x => x.trim())).filter(a => a.length === 2)))
    }}>{children}</span>
  )
}

const Spinner = ({ size = 14 }) => <Loader2 size={size} className="spin" />

const StatusDot = ({ status }) => {
  const cfg = {
    connected: { color: '#10b981', label: 'Connected' },
    connecting: { color: '#f59e0b', label: 'Connecting' },
    disconnected: { color: '#4a6080', label: 'Disconnected' },
    error: { color: '#ef4444', label: 'Error' },
  }[status] || { color: '#4a6080', label: status }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: cfg.color,
        boxShadow: status === 'connected' ? `0 0 6px ${cfg.color}` : 'none',
        animation: status === 'connecting' ? 'pulse-dot 1.2s ease infinite' : 'none'
      }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{cfg.label}</span>
    </span>
  )
}

const Btn = ({ children, onClick, variant = 'primary', disabled = false, size = 'md', icon, style }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid',
    borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '0.03em',
    transition: 'all 0.15s ease', opacity: disabled ? 0.45 : 1,
    padding: size === 'sm' ? '5px 12px' : size === 'lg' ? '10px 22px' : '7px 16px',
    fontSize: size === 'sm' ? 11 : size === 'lg' ? 13 : 12,
  }
  const variants = {
    primary: { background: 'var(--accent-cyan)', color: '#080a0e', borderColor: 'var(--accent-cyan)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-mid)' },
    danger: { background: 'var(--red-dim)', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' },
    success: { background: 'var(--green-dim)', color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.3)' },
    violet: { background: 'var(--violet-dim)', color: 'var(--accent-violet)', borderColor: 'rgba(139,92,246,0.3)' },
  }
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant], ...style }}>
      {icon && icon}{children}
    </button>
  )
}

const Card = ({ children, style, glow }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid',
    borderColor: glow ? 'var(--border-glow)' : 'var(--border-dim)',
    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
    boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-card)',
    ...style
  }}>{children}</div>
)

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{children}</h3>
    {sub && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{sub}</p>}
  </div>
)

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = ['Connect', 'Discover', 'Analyze', 'Replicate', 'Done']

const StepBar = ({ current, onStepClick }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 4px' }}>
    {STEPS.map((s, i) => {
      const done = i < current, active = i === current
      const clickable = done && !!onStepClick
      return (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div
            onClick={clickable ? () => onStepClick(i) : undefined}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: clickable ? 'pointer' : 'default' }}
            title={clickable ? `Go back to ${s}` : undefined}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done ? 'var(--accent-green)' : active ? 'var(--accent-cyan)' : 'var(--bg-surface)',
              border: `1px solid ${done ? 'var(--accent-green)' : active ? 'var(--accent-cyan)' : 'var(--border-dim)'}`,
              fontSize: 10, fontWeight: 600, color: done || active ? '#080a0e' : 'var(--text-muted)',
              boxShadow: active ? '0 0 12px rgba(56,189,248,0.4)' : done ? '0 0 8px rgba(16,185,129,0.3)' : 'none',
              transition: 'all 0.2s ease',
              ...(clickable ? { outline: 'none' } : {})
            }}>
              {done ? <Check size={12} /> : i + 1}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: '0.06em',
              color: active ? 'var(--accent-cyan)' : done ? 'var(--accent-green)' : 'var(--text-dim)',
              textTransform: 'uppercase',
              textDecoration: clickable ? 'underline dotted' : 'none',
              textUnderlineOffset: 3
            }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 1, margin: '0 8px', marginBottom: 18,
              background: i < current ? 'var(--accent-green)' : 'var(--border-dim)',
              transition: 'background 0.3s ease'
            }} />
          )}
        </div>
      )
    })}
  </div>
)

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = 'text', placeholder = '', required, password }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{
      display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5
    }}>
      {label}{required && <span style={{ color: 'var(--accent-red)', marginLeft: 3 }}>*</span>}
    </label>
    <input
      type={password ? 'password' : type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-primary)',
        fontSize: 12, outline: 'none', transition: 'border-color 0.15s',
        fontFamily: 'var(--font-mono)'
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
      onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
    />
  </div>
)

// ─── Agent Status Bar ─────────────────────────────────────────────────────────
const AgentBar = ({ agentStatuses }) => {
  const agents = ['connector', 'discovery', 'insight', 'replication']
  const icons = { connector: Server, discovery: Search, insight: Zap, replication: GitBranch, log: FileText }
  const colors = {
    IDLE: '#4a6080', CONNECTING_SOURCE: '#f59e0b', CONNECTING_TARGET: '#f59e0b',
    SCANNING_SOURCE: '#38bdf8', SCANNING_TARGET: '#38bdf8',
    ANALYZING_SOURCE: '#8b5cf6', ANALYZING_TARGET: '#8b5cf6',
    REPLICATION_STARTED: '#f97316', REPLICATION_RUNNING: '#f97316', COMPLETE: '#10b981',
    ERROR: '#ef4444'
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {agents.map(a => {
        const status = agentStatuses[a] || 'IDLE'
        const Icon = icons[a]
        const color = colors[status] || '#4a6080'
        const active = status !== 'IDLE'
        return (
          <div key={a} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: active ? `rgba(${color.replace('#', '').match(/.{2}/g).map(h => parseInt(h, 16)).join(',')},0.1)` : 'var(--bg-surface)',
            border: `1px solid ${active ? color + '44' : 'var(--border-dim)'}`,
            transition: 'all 0.3s ease'
          }}>
            <Icon size={11} style={{ color, animation: active ? 'spin 1.5s linear infinite' : 'none' }} />
            <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? color : 'var(--text-dim)' }}>
              {a}
            </span>
            {active && status !== 'IDLE' && (
              <span style={{ fontSize: 9, color: 'var(--text-muted)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Login Page ────────────────────────────────────────────────────────────
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
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      onLogin(data)
      navigate('/migration')
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

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = ({ persona }) => {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' }}>

      {/* Top Nav */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={16} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>TeraMigrate</span>
        </div>
        <div>
          {persona ? (
            <Btn variant="primary" onClick={() => navigate('/migration')}>Go to Dashboard</Btn>
          ) : (
            <Btn variant="ghost" onClick={() => navigate('/login')}>Sign In</Btn>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div className="animate-fade" style={{ maxWidth: 800 }}>
          <Badge color="violet" size="lg" style={{ marginBottom: 24, fontSize: 12, padding: '4px 12px' }}>
            Next-Gen ETL Migration
          </Badge>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Automate Your Journey from <br />
            <span style={{ color: 'var(--accent-cyan)' }}>Teradata</span> to Modern Cloud
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Seamlessly transition your legacy ETL workloads to Databricks and Snowflake. AI-powered discovery, automated gap analysis, and intelligent code conversion.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {persona ? (
              <Btn variant="primary" size="lg" icon={<Play size={16} />} onClick={() => navigate('/migration')} style={{ padding: '14px 32px', fontSize: 14 }}>
                Continue Migration ({persona.username})
              </Btn>
            ) : (
              <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/login')} style={{ padding: '14px 32px', fontSize: 14 }}>
                Get Started
              </Btn>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, maxWidth: 1000, width: '100%', marginTop: 80 }} className="animate-fade">
          <Card style={{ textAlign: 'left', padding: 24 }}>
            <Search size={24} style={{ color: 'var(--accent-cyan)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Automated Discovery</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Connect directly to Teradata to discover databases, tables, views, and complex stored procedures automatically.
            </p>
          </Card>
          <Card style={{ textAlign: 'left', padding: 24 }}>
            <Activity size={24} style={{ color: 'var(--accent-violet)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Gap Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Identify syntax incompatibilities and structural differences between Teradata and your target cloud platform before migrating.
            </p>
          </Card>
          <Card style={{ textAlign: 'left', padding: 24 }}>
            <Zap size={24} style={{ color: 'var(--accent-green)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Intelligent Migration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Automatically convert legacy SQL, migrate table structures, and orchestrate real-time replication pipelines.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, borderTop: '1px solid var(--border-dim)' }}>
        &copy; {new Date().getFullYear()} TeraMigrate Platform. Designed for modern data teams.
      </footer>
    </div>
  )
}

// ─── Step 1: Connect ──────────────────────────────────────────────────────────
const ConnectStep = ({ send, wsStatus, onComplete, persona }) => {
  const [src, setSrc] = useState({ platform: 'teradata', host: '', username: '', password: '', database: '', port: '1025' })
  const [tgt, setTgt] = useState({ platform: 'databricks', host: '', token: '', cluster_id: '', warehouse_id: '', username: '', password: '', database: '', schema: 'PUBLIC' })
  const [savedCreds, setSavedCreds] = useState({})
  const [srcResult, setSrcResult] = useState(null)
  const [tgtResult, setTgtResult] = useState(null)
  const [srcLoading, setSrcLoading] = useState(false)
  const [tgtLoading, setTgtLoading] = useState(false)

  const srcRef = useRef(src)
  const tgtRef = useRef(tgt)
  useEffect(() => { srcRef.current = src; tgtRef.current = tgt }, [src, tgt])

  useEffect(() => {
    if (persona?.id) {
      fetch(`${API}/api/v1/connections/?persona_id=${persona.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.credentials) {
            const credsMap = {}
            data.credentials.forEach(c => {
              credsMap[c.platform] = c
            })
            setSavedCreds(credsMap)
            const c = credsMap['teradata'] || {}
            setSrc(p => ({
              ...p,
              host: c.host || '',
              username: c.username || '',
              password: c.password || '',
              database: c.database_name || '',
              port: String(c.port || '1025')
            }))
            const dbCred = data.credentials.find(c => c.platform === 'databricks')
            const sfCred = data.credentials.find(c => c.platform === 'snowflake')
            if (dbCred) {
              setTgt({
                platform: 'databricks',
                host: dbCred.host || '',
                token: dbCred.token || '',
                cluster_id: dbCred.cluster_id || '',
                warehouse_id: dbCred.warehouse_id || '',
                username: '',
                password: '',
                database: ''
              })
            } else if (sfCred) {
              setTgt({
                platform: 'snowflake',
                host: sfCred.host || '',
                token: '',
                cluster_id: '',
                warehouse_id: sfCred.warehouse_id || '',
                username: sfCred.username || '',
                password: sfCred.password || '',
                database: sfCred.database_name || '',
                schema: sfCred.schema || 'PUBLIC'
              })
            }
          }
        }).catch(console.error)
    }
  }, [persona?.id])

  const handleSourcePlatformChange = (platform) => {
    const cred = savedCreds[platform] || {}
    setSrc({
      platform,
      host: cred.host || '',
      username: cred.username || '',
      password: cred.password || '',
      database: cred.database_name || '',
      port: String(cred.port || (platform === 'mysql' ? '3306' : '1025'))
    })
    setSrcResult(null)
  }

  const handlePlatformChange = (platform) => {
    const cred = savedCreds[platform] || {}
    setTgt({
      platform,
      host: cred.host || '',
      token: cred.token || '',
      cluster_id: cred.cluster_id || '',
      warehouse_id: cred.warehouse_id || '',
      username: cred.username || '',
      password: cred.password || '',
      database: cred.database_name || '',
      schema: cred.schema || 'PUBLIC'
    })
    setTgtResult(null)
  }

  const handleMsg = useCallback((msg) => {
    if (msg.type === 'connection_result') {
      if (msg.connection_type === 'source') {
        setSrcResult(msg.result); setSrcLoading(false)
        if (msg.result.status === 'connected' && persona?.id) {
          fetch(`${API}/api/v1/connections/save?persona_id=${persona.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...srcRef.current,
              port: parseInt(srcRef.current.port) || (srcRef.current.platform === 'mysql' ? 3306 : 1025)
            })
          }).then(() => {
            setSavedCreds(prev => ({ ...prev, [srcRef.current.platform]: srcRef.current }))
          }).catch(console.error)
        }
      }
      if (msg.connection_type === 'target') {
        setTgtResult(msg.result); setTgtLoading(false)
        if (msg.result.status === 'connected' && persona?.id) {
          fetch(`${API}/api/v1/connections/save?persona_id=${persona.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tgtRef.current)
          }).then(() => {
            setSavedCreds(prev => ({ ...prev, [tgtRef.current.platform]: tgtRef.current }))
          }).catch(console.error)
        }
      }
    }
  }, [persona?.id])

  // Expose handler to parent
  useEffect(() => { window.__connectHandler = handleMsg }, [handleMsg])

  const connectSrc = () => {
    setSrcLoading(true); setSrcResult(null)
    send('connect_source', {
      ...src,
      port: parseInt(src.port) || (src.platform === 'mysql' ? 3306 : 1025)
    })
  }
  const connectTgt = () => {
    setTgtLoading(true); setTgtResult(null)
    send('connect_target', { ...tgt })
  }

  const bothConnected = srcResult?.status === 'connected' && tgtResult?.status === 'connected'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="animate-fade">
      {/* Source */}
      <Card glow={srcResult?.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ padding: 7, background: 'rgba(56,189,248,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Source Platform</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{src.platform === 'mysql' ? 'MySQL Database' : 'Teradata Data Warehouse'}</div>
          </div>
          {srcResult && <Badge color={srcResult.status === 'connected' ? 'green' : 'red'} style={{ marginLeft: 'auto' }}>
            {srcResult.status}
          </Badge>}
        </div>

        {/* Source Platform Toggle buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => handleSourcePlatformChange('teradata')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: src.platform === 'teradata' ? 'var(--bg-active)' : 'transparent',
              borderColor: src.platform === 'teradata' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: src.platform === 'teradata' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Teradata
          </button>
          <button
            type="button"
            onClick={() => handleSourcePlatformChange('mysql')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: src.platform === 'mysql' ? 'var(--bg-active)' : 'transparent',
              borderColor: src.platform === 'mysql' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: src.platform === 'mysql' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            MySQL
          </button>
        </div>

        <Field label="Host" value={src.host} onChange={v => setSrc(p => ({ ...p, host: v }))} placeholder={src.platform === 'mysql' ? 'localhost' : 'teradata-host.company.com'} required />
        <Field label="Username" value={src.username} onChange={v => setSrc(p => ({ ...p, username: v }))} placeholder={src.platform === 'mysql' ? 'root' : 'dbc'} required />
        <Field label="Password" value={src.password} onChange={v => setSrc(p => ({ ...p, password: v }))} password required />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <Field label="Database" value={src.database} onChange={v => setSrc(p => ({ ...p, database: v }))} placeholder={src.platform === 'mysql' ? 'mydb' : 'PROD_DW'} />
          <Field label="Port" value={src.port} onChange={v => setSrc(p => ({ ...p, port: v }))} placeholder={src.platform === 'mysql' ? '3306' : '1025'} />
        </div>
        {srcResult?.status === 'failed' && (
          <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 11, color: 'var(--accent-red)' }}>
            <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />{srcResult.error}
          </div>
        )}
        {srcResult?.status === 'connected' && (
          <div style={{ padding: '10px 12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 500, marginBottom: 6 }}>
              <Check size={12} style={{ display: 'inline', marginRight: 5 }} />Connected successfully
            </div>
            {srcResult.metadata && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(srcResult.metadata).filter(([k]) => k !== 'database').map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}: </span>{String(v)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Btn onClick={connectSrc} disabled={srcLoading || !src.host || !src.username || wsStatus !== 'connected'}
          variant={srcResult?.status === 'connected' ? 'success' : 'primary'} size="sm"
          icon={srcLoading ? <Spinner size={11} /> : <Server size={11} />}>
          {srcLoading ? 'Connecting...' : srcResult?.status === 'connected' ? 'Reconnect' : `Connect ${src.platform === 'mysql' ? 'MySQL' : 'Teradata'}`}
        </Btn>
      </Card>

      {/* Target */}
      <Card glow={tgtResult?.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            padding: 7,
            background: tgt.platform === 'snowflake' ? 'rgba(56,189,248,0.1)' : 'rgba(139,92,246,0.1)',
            borderRadius: 'var(--radius)',
            border: `1px solid ${tgt.platform === 'snowflake' ? 'rgba(56,189,248,0.2)' : 'rgba(139,92,246,0.2)'}`
          }}>
            {tgt.platform === 'snowflake' ? (
              <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
            ) : (
              <Cloud size={16} style={{ color: 'var(--accent-violet)' }} />
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Target Platform</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {tgt.platform === 'snowflake' ? 'Snowflake Data Cloud' : 'Databricks Lakehouse'}
            </div>
          </div>
          {tgtResult && <Badge color={tgtResult.status === 'connected' ? 'green' : 'red'} style={{ marginLeft: 'auto' }}>
            {tgtResult.status}
          </Badge>}
        </div>

        {/* Target Platform Toggle buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => handlePlatformChange('databricks')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: tgt.platform === 'databricks' ? 'var(--bg-active)' : 'transparent',
              borderColor: tgt.platform === 'databricks' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: tgt.platform === 'databricks' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Databricks
          </button>
          <button
            type="button"
            onClick={() => handlePlatformChange('snowflake')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: tgt.platform === 'snowflake' ? 'var(--bg-active)' : 'transparent',
              borderColor: tgt.platform === 'snowflake' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: tgt.platform === 'snowflake' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Snowflake
          </button>
        </div>

        {tgt.platform === 'databricks' ? (
          <>
            <Field label="Workspace URL" value={tgt.host} onChange={v => setTgt(p => ({ ...p, host: v }))} placeholder="https://adb-xxx.azuredatabricks.net" required />
            <Field label="Access Token" value={tgt.token} onChange={v => setTgt(p => ({ ...p, token: v }))} password placeholder="dapi..." required />
            <Field label="Cluster ID" value={tgt.cluster_id} onChange={v => setTgt(p => ({ ...p, cluster_id: v }))} placeholder="0101-123456-abc" />
            <Field label="SQL Warehouse ID" value={tgt.warehouse_id} onChange={v => setTgt(p => ({ ...p, warehouse_id: v }))} placeholder="abc123def" />
          </>
        ) : (
          <>
            <Field label="Account URL / Host" value={tgt.host} onChange={v => setTgt(p => ({ ...p, host: v }))} placeholder="xy12345.snowflakecomputing.com" required />
            <Field label="Username" value={tgt.username || ''} onChange={v => setTgt(p => ({ ...p, username: v }))} placeholder="snowflake_user" required />
            <Field label="Password" value={tgt.password || ''} onChange={v => setTgt(p => ({ ...p, password: v }))} password placeholder="••••••••" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Database" value={tgt.database || ''} onChange={v => setTgt(p => ({ ...p, database: v }))} placeholder="MY_DATABASE" />
              <Field label="Warehouse" value={tgt.warehouse_id || ''} onChange={v => setTgt(p => ({ ...p, warehouse_id: v }))} placeholder="COMPUTE_WH" />
            </div>
            <Field label="Schema" value={tgt.schema || 'PUBLIC'} onChange={v => setTgt(p => ({ ...p, schema: v }))} placeholder="PUBLIC" />
          </>
        )}

        {tgtResult?.status === 'failed' && (
          <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 11, color: 'var(--accent-red)' }}>
            <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />{tgtResult.error}
          </div>
        )}
        {tgtResult?.status === 'connected' && (
          <div style={{ padding: '10px 12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 500, marginBottom: 6 }}>
              <Check size={12} style={{ display: 'inline', marginRight: 5 }} />Connected successfully
            </div>
            {tgtResult.metadata && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(tgtResult.metadata).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                    {Array.isArray(v) ? v.slice(0, 2).join(', ') : String(v)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Btn onClick={connectTgt} disabled={
          tgt.platform === 'databricks'
            ? (tgtLoading || !tgt.host || !tgt.token || wsStatus !== 'connected')
            : (tgtLoading || !tgt.host || !tgt.username || !tgt.password || wsStatus !== 'connected')
        }
          variant={tgtResult?.status === 'connected' ? 'success' : (tgt.platform === 'snowflake' ? 'primary' : 'violet')} size="sm"
          icon={tgtLoading ? <Spinner size={11} /> : (tgt.platform === 'snowflake' ? <Database size={11} /> : <Cloud size={11} />)}>
          {tgtLoading ? 'Connecting...' : tgtResult?.status === 'connected' ? 'Reconnect' : `Connect ${tgt.platform === 'databricks' ? 'Databricks' : 'Snowflake'}`}
        </Btn>
      </Card>

      {bothConnected && (
        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', paddingTop: 4 }} className="animate-fade">
          <Btn onClick={onComplete} variant="primary" size="lg" icon={<ChevronRight size={15} />}>
            Both platforms connected — Proceed to Discovery
          </Btn>
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Discover ─────────────────────────────────────────────────────────
const DiscoverStep = ({ send, sourceResult, targetResult, onComplete, srcCfg, tgtCfg }) => {
  const [srcResources, setSrcResources] = useState(null)
  const [tgtResources, setTgtResources] = useState(null)
  const [srcInsights, setSrcInsights] = useState(null)
  const [tgtInsights, setTgtInsights] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('source')

  const hasStartedRef = useRef(false)

  const startScan = useCallback(() => {
    setScanning(true); setSrcResources(null); setTgtResources(null)
    send('discover_source', { platform: srcCfg.platform || 'teradata', ...srcCfg })
    setTimeout(() => send('discover_target', { platform: tgtCfg.platform || 'databricks', ...tgtCfg }), 800)
  }, [send, srcCfg, tgtCfg])

  useEffect(() => {
    window.__discoveryHandler = (msg) => {
      if (msg.type === 'discovery_result') {
        if (msg.environment === 'source') { setSrcResources(msg.resources); setSrcInsights(msg.insights) }
        if (msg.environment === 'target') { setTgtResources(msg.resources); setTgtInsights(msg.insights); setScanning(false) }
      }
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      startScan()
    }
  }, [startScan])

  const StatPill = ({ label, value, color = 'cyan' }) => (
    <div style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: `var(--accent-${color})`, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{label}</div>
    </div>
  )

  const ResourceTable = ({ resources }) => {
    if (!resources) return null
    const datasets = resources.datasets || []
    const pipelines = resources.pipelines || []
    return (
      <div>
        {datasets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Table2 size={11} /> Datasets ({datasets.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Type', 'Schema', 'Rows', 'Size'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {datasets.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '6px 8px' }}><Badge color={d.type === 'VIEW' ? 'violet' : d.type === 'PROCEDURE' ? 'amber' : 'cyan'} size="sm">{d.type}</Badge></td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{d.schema || d.catalog || '—'}</td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{d.row_count?.toLocaleString() || '—'}</td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{d.size_mb ? `${d.size_mb}MB` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pipelines.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Workflow size={11} /> Pipelines ({pipelines.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Type', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {pipelines.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text-secondary)' }}>{p.type}</td>
                    <td style={{ padding: '6px 8px' }}><Badge color={p.status === 'ACTIVE' || p.status === 'RUNNING' ? 'green' : 'gray'}>{p.status || '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const InsightPanel = ({ insights }) => {
    if (!insights) return null
    return (
      <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--accent-violet)', fontWeight: 500 }}>
          <Zap size={12} /> AI Analysis
        </div>
        <p style={{ marginBottom: 8 }}>{insights.narrative}</p>
        {insights.report?.datasets?.quality_flags?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {insights.report.datasets.quality_flags.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {f.flag === 'CONTAINS_PII' ? <Shield size={11} style={{ color: 'var(--accent-red)' }} /> : <Info size={11} style={{ color: 'var(--accent-amber)' }} />}
                <span style={{ color: f.flag === 'CONTAINS_PII' ? 'var(--accent-red)' : 'var(--accent-amber)', fontWeight: 500 }}>{f.dataset}</span>
                <span style={{ color: 'var(--text-muted)' }}>{f.flag}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const bothDone = srcResources && tgtResources
  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Environment Discovery</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Scan both platforms, catalog all resources, generate AI insights</div>
        </div>
        {scanning ? (
          <Btn disabled={true} variant="primary" icon={<Spinner size={11} />}>
            Scanning...
          </Btn>
        ) : srcResources ? (
          <Btn onClick={startScan} variant="primary" icon={<RefreshCw size={11} />}>
            Re-scan
          </Btn>
        ) : null}
      </div>

      {(srcResources || tgtResources) && (
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['source', 'target'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '6px 16px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
                background: activeTab === t ? 'var(--bg-active)' : 'transparent',
                borderColor: activeTab === t ? 'var(--border-bright)' : 'var(--border-dim)',
                color: activeTab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {t === 'source' ? <Database size={11} /> : (tgtCfg?.platform === 'snowflake' ? <Database size={11} /> : <Cloud size={11} />)}
                {t === 'source' ? (srcCfg.platform === 'mysql' ? 'MySQL Source' : 'Teradata Source') : `${tgtCfg?.platform === 'snowflake' ? 'Snowflake' : 'Databricks'} Target`}
                {t === 'source' && srcResources && <Badge color="green" size="sm">✓</Badge>}
                {t === 'target' && tgtResources && <Badge color="green" size="sm">✓</Badge>}
              </button>
            ))}
          </div>

          {activeTab === 'source' && srcResources && (
            <Card className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
                <StatPill label="Datasets" value={srcResources.summary?.total_datasets || 0} color="cyan" />
                <StatPill label="Pipelines" value={srcResources.summary?.total_pipelines || 0} color="violet" />
                <StatPill label="Views" value={srcResources.summary?.total_views || 0} color="amber" />
                <StatPill label="Size GB" value={srcResources.summary?.total_size_gb || 0} color="green" />
                <StatPill label="Total Rows" value={((srcResources.datasets || []).reduce((s, d) => s + (d.row_count || 0), 0) / 1e6).toFixed(1) + 'M'} color="cyan" />
              </div>
              <ResourceTable resources={srcResources} />
              <InsightPanel insights={srcInsights} />
            </Card>
          )}
          {activeTab === 'target' && tgtResources && (
            <Card className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                <StatPill label="Datasets" value={tgtResources.summary?.total_datasets || 0} color="violet" />
                <StatPill label="Pipelines" value={tgtResources.summary?.total_pipelines || 0} color="violet" />
                <StatPill label="Size GB" value={tgtResources.summary?.total_size_gb || 0} color="green" />
                <StatPill label="Notebooks" value={tgtResources.summary?.total_notebooks || 0} color="amber" />
              </div>
              <ResourceTable resources={tgtResources} />
              <InsightPanel insights={tgtInsights} />
            </Card>
          )}
        </div>
      )}

      {bothDone && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <Btn onClick={() => onComplete(srcResources, tgtResources)} variant="primary" size="lg" icon={<ChevronRight size={15} />}>
            Proceed to Resource Selection
          </Btn>
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Analyze ──────────────────────────────────────────────────────────
const AnalyzeStep = ({ send, sourceResources, targetResources, onComplete, tgtCfg }) => {
  const [selected, setSelected] = useState([])
  const [targetTypes, setTargetTypes] = useState({})
  const [gapAnalysis, setGapAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    window.__insightHandler = (msg) => {
      if (msg.type === 'migration_insights') {
        setGapAnalysis(msg.result)
        setAnalyzing(false)
      }
    }
  }, [])

  const allItems = [
    ...(sourceResources?.datasets || []).map(d => ({ ...d, kind: 'dataset' })),
    ...(sourceResources?.pipelines || []).map(p => ({ ...p, kind: 'pipeline' }))
  ]

  const toggle = (item) => {
    setSelected(prev => prev.find(s => s.id === item.id)
      ? prev.filter(s => s.id !== item.id)
      : [...prev, item])
  }

  const analyze = () => {
    if (!selected.length) return
    setAnalyzing(true); setGapAnalysis(null)
    send('get_insights', {
      source_resources: sourceResources,
      target_resources: targetResources,
      selected_resources: selected.map(s => ({ name: s.name, type: s.kind === 'pipeline' ? 'pipeline' : 'dataset' }))
    })
  }

  const riskColor = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' }

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Selector */}
        <div>
          <SectionTitle
            children="Select Resources to Migrate"
            sub={`${selected.length} of ${allItems.length} selected`}
          />
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <Btn size="sm" variant="ghost" onClick={() => setSelected(allItems)}>Select all</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 380, overflowY: 'auto' }}>
            {allItems.map(item => {
              const sel = !!selected.find(s => s.id === item.id)
              const isPII = item.tags?.includes('PII')
              return (
                <div key={item.id} onClick={() => toggle(item)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 'var(--radius)', border: '1px solid', cursor: 'pointer',
                  borderColor: sel ? 'var(--accent-cyan)' : 'var(--border-dim)',
                  background: sel ? 'var(--cyan-dim)' : 'var(--bg-surface)',
                  transition: 'all 0.15s'
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, border: '1px solid', flexShrink: 0,
                    borderColor: sel ? 'var(--accent-cyan)' : 'var(--border-mid)',
                    background: sel ? 'var(--accent-cyan)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {sel && <Check size={10} style={{ color: '#080a0e' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.kind === 'pipeline' ? <Workflow size={11} style={{ color: 'var(--accent-violet)' }} /> : <Table2 size={11} style={{ color: 'var(--accent-cyan)' }} />}
                      {item.name}
                      {isPII && <Shield size={10} style={{ color: 'var(--accent-red)' }} />}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.schema || item.type} {item.row_count ? `· ${item.row_count.toLocaleString()} rows` : ''}</span>
                      {sel && (item.type === 'PROCEDURE' || item.type === 'STORED_PROCEDURE') && tgtCfg?.platform === 'databricks' && (
                        <select 
                          value={targetTypes[item.name] || 'DATABRICKS_WORKFLOW'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); setTargetTypes(p => ({...p, [item.name]: e.target.value})) }}
                          style={{
                            background: 'var(--bg-void)', border: '1px solid var(--border-dim)', borderRadius: 4,
                            color: 'var(--text-secondary)', fontSize: 9, padding: '2px 4px', outline: 'none'
                          }}
                        >
                          <option value="DATABRICKS_WORKFLOW">Pipeline (PySpark)</option>
                          <option value="DATABRICKS_SQL_SP">Stored Procedure (SQL)</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(item.tags || []).slice(0, 2).map(t => <Badge key={t} color="gray" size="sm">{t}</Badge>)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn onClick={analyze} disabled={!selected.length || analyzing} variant="primary"
              icon={analyzing ? <Spinner size={11} /> : <BarChart2 size={11} />}>
              {analyzing ? 'Analyzing...' : 'Run Gap Analysis'}
            </Btn>
          </div>
        </div>

        {/* Gap Analysis Results */}
        <div>
          <SectionTitle children="Migration Gap Analysis" sub="AI-powered readiness assessment" />
          {!gapAnalysis && !analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', gap: 10 }}>
              <BarChart2 size={28} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: 12 }}>Select resources and run analysis</span>
            </div>
          )}
          {analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <Spinner size={24} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Running AI gap analysis via Mistral...</span>
            </div>
          )}
          {gapAnalysis && (
            <div className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  ['New Creates', gapAnalysis.gap_analysis?.new_creates || 0, 'cyan'],
                  ['Incremental', gapAnalysis.gap_analysis?.incremental_updates || 0, 'green'],
                  ['High Risk', gapAnalysis.gap_analysis?.high_risk_items || 0, 'red'],
                  ['Total MB', Math.round(gapAnalysis.gap_analysis?.total_size_mb || 0), 'amber'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: `var(--accent-${c})`, fontFamily: 'var(--font-display)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Item rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {(gapAnalysis.gap_analysis?.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.replication_mode?.replace(/_/g, ' ')}</div>
                    </div>
                    <Badge color={item.exists_in_target ? 'green' : 'cyan'}>{item.exists_in_target ? 'UPDATE' : 'CREATE'}</Badge>
                    <Badge color={riskColor[item.risk] || 'gray'}>{item.risk}</Badge>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.estimated_duration_min}m</span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {(gapAnalysis.recommendations || []).length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {gapAnalysis.recommendations.map((r, i) => (
                    <div key={i} style={{
                      padding: '7px 10px', borderRadius: 'var(--radius)',
                      border: '1px solid', display: 'flex', gap: 8, alignItems: 'flex-start',
                      borderColor: r.type === 'WARNING' ? 'rgba(239,68,68,0.2)' : r.type === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)',
                      background: r.type === 'WARNING' ? 'var(--red-dim)' : r.type === 'SUCCESS' ? 'var(--green-dim)' : 'var(--cyan-dim)',
                    }}>
                      {r.type === 'WARNING' ? <AlertTriangle size={11} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 1 }} />
                        : r.type === 'SUCCESS' ? <CheckCircle size={11} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 1 }} />
                          : <Info size={11} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: 1 }} />}
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <Btn onClick={() => onComplete(selected, gapAnalysis, targetTypes)} variant="primary" size="lg" icon={<ChevronRight size={14} />}>
                  Start Replication
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Replicate ────────────────────────────────────────────────────────
const ReplicateStep = ({ send, selected, gapAnalysis, sourceResources, targetResources, srcCfg, tgtCfg, targetTypes, onComplete }) => {
  const [events, setEvents] = useState([])
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState(null)
  const logRef = useRef(null)

  useEffect(() => {
    window.__replicationHandler = (msg) => {
      if (msg.type === 'replication_progress') {
        const p = msg.progress
        setEvents(prev => [...prev, p])
        if (p.status === 'COMPLETED') { setDone(true); setSummary(p) }
      }
    }
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  const startReplication = () => {
    setStarted(true); setEvents([]); setDone(false)
    send('start_replication', {
      selected_resources: selected.map(s => ({
        ...s,
        id: s.id, name: s.name, type: s.kind || 'dataset',
        original_type: s.type,
        target_type: targetTypes?.[s.name] || undefined,
        columns: s.columns || [], row_count: s.row_count || 0, tags: s.tags || []
      })),
      source_platform: srcCfg?.platform || 'teradata',
      target_platform: tgtCfg?.platform || 'databricks',
      gap_analysis: gapAnalysis?.gap_analysis || {}
    })
  }

  const stepColor = {
    STARTED: '#38bdf8', ITEM_STARTED: '#8b5cf6', ITEM_COMPLETED: '#10b981',
    ITEM_FAILED: '#ef4444', COMPLETED: '#10b981', STEP: '#8ba3c7',
    BATCH_LOADED: '#38bdf8', DATASET_SUCCESS: '#10b981', PIPELINE_SUCCESS: '#10b981'
  }
  const stepIcon = {
    ITEM_COMPLETED: <Check size={11} />, ITEM_FAILED: <X size={11} />,
    COMPLETED: <CheckCircle size={11} />, BATCH_LOADED: <Activity size={11} />
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left: Queue */}
        <div>
          <SectionTitle children="Migration Queue" sub={`${selected.length} items selected`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto' }}>
            {selected.map((item, i) => {
              const itemEvents = events.filter(e => e.item === item.name)
              const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED')
              const failed = itemEvents.some(e => e.status === 'ITEM_FAILED')
              const running = started && !finished && !failed && itemEvents.length > 0
              const waiting = started && !finished && !failed && itemEvents.length === 0 && !done

              const batchEvt = itemEvents.filter(e => e.status === 'BATCH_LOADED').slice(-1)[0]
              const pct = batchEvt?.progress_pct

              return (
                <div key={item.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius)',
                  background: finished ? 'var(--green-dim)' : failed ? 'var(--red-dim)' : 'var(--bg-surface)',
                  border: `1px solid ${finished ? 'rgba(16,185,129,0.25)' : failed ? 'rgba(239,68,68,0.25)' : 'var(--border-dim)'}`,
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: finished ? 'var(--accent-green)' : failed ? 'var(--accent-red)' : running ? 'var(--accent-violet)' : 'var(--text-muted)' }}>
                      {finished ? <Check size={12} /> : failed ? <X size={12} /> : running ? <Spinner size={12} /> : <Circle size={12} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{item.kind?.toUpperCase() || 'DATASET'}</div>
                    </div>
                  </div>
                  {running && pct !== undefined && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ background: 'var(--bg-void)', borderRadius: 2, height: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-violet)', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{pct}%</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!started && (
            <div style={{ marginTop: 12 }}>
              <Btn onClick={startReplication} variant="primary" size="lg" icon={<Play size={13} />}>
                Start Migration
              </Btn>
            </div>
          )}
          {done && summary && (
            <div style={{ marginTop: 12, padding: '12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius)' }}>
              <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 12, marginBottom: 6 }}><Check size={12} style={{ display: 'inline', marginRight: 5 }} />Migration Complete</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {summary.completed} completed · {summary.failed} failed
              </div>
              <div style={{ marginTop: 10 }}>
                <Btn onClick={() => {
                  const srcPlatform = srcCfg?.platform === 'mysql' ? 'MySQL' : (srcCfg?.platform ? srcCfg.platform.charAt(0).toUpperCase() + srcCfg.platform.slice(1) : 'Teradata')
                  const tgtPlatform = tgtCfg?.platform ? tgtCfg.platform.charAt(0).toUpperCase() + tgtCfg.platform.slice(1) : 'Databricks'

                  const details = selected.map(item => {
                    const itemEvents = events.filter(e => e.item === item.name)
                    const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED' || e.status === 'DATASET_SUCCESS' || e.status === 'PIPELINE_SUCCESS')
                    const failed = itemEvents.some(e => e.status === 'ITEM_FAILED')
                    const status = finished ? 'Success' : failed ? 'Failed' : 'Pending'

                    const totalRows = item.row_count || 0
                    const inserted = finished ? totalRows : 0
                    const failedRows = failed ? totalRows : 0

                    return {
                      name: item.name,
                      type: item.kind || 'dataset',
                      sourceTable: srcPlatform,
                      sourceRows: totalRows,
                      targetTable: tgtPlatform,

                      // targetRows: inserted,
                      inserted: inserted,
                      failedRows: failedRows,
                      status: status
                    }
                  })
                  onComplete({ ...summary, details })
                }} variant="success" size="sm" icon={<ChevronRight size={11} />}>View Summary</Btn>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live log */}
        <div>
          <SectionTitle children="Live Replication Log" sub="Real-time agent event stream" />
          <div ref={logRef} style={{
            height: 460, overflowY: 'auto', background: 'var(--bg-void)',
            border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)',
            padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 11
          }}>
            {!started && (
              <div style={{ color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                <Terminal size={24} style={{ opacity: 0.3 }} />
                <span>Waiting to start...</span>
              </div>
            )}
            {events.map((evt, i) => {
              const color = stepColor[evt.status] || '#8ba3c7'
              const icon = stepIcon[evt.status]
              return (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', animation: 'fade-in 0.2s ease forwards' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>{formatLocalTime(evt.timestamp)}</span>
                  <span style={{ color, flexShrink: 0, marginTop: 1 }}>{icon || <ChevronRight size={10} />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color, fontWeight: 500 }}>{evt.status}</span>
                    {evt.item && <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{evt.item}</span>}
                    {evt.message && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{evt.message}</span>}
                    {evt.error && <div style={{ color: 'var(--accent-red)', fontSize: 10, marginTop: 2, wordBreak: 'break-all' }}>Error: {evt.error}</div>}
                    {evt.detail && <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2, wordBreak: 'break-all' }}>{evt.detail.slice(0, 120)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────
const DoneStep = ({ summary, logs, tgtCfg, onRestart }) => {
  const tgtPlatform = tgtCfg?.platform ? tgtCfg.platform.charAt(0).toUpperCase() + tgtCfg.platform.slice(1) : 'Databricks'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 0' }} className="animate-fade">
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'var(--green-dim)',
        border: '2px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 0 30px rgba(16,185,129,0.25)'
      }}>
        <CheckCircle size={32} style={{ color: 'var(--accent-green)' }} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Migration Complete</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>All selected resources have been migrated to {tgtPlatform}</p>
      {summary && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {[
            ['Total Items', summary.total, 'cyan'],
            ['Completed', summary.completed, 'green'],
            ['Failed', summary.failed, 'red'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ padding: '16px 28px', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: `var(--accent-${c})`, fontFamily: 'var(--font-display)' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <Btn onClick={onRestart} variant="ghost" icon={<RefreshCw size={13} />}>Start New Migration</Btn>

      {summary?.details && summary.details.length > 0 && (
        <div style={{ width: '100%', maxWidth: 900, marginTop: 40, textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="animate-fade">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>Migration Details</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Table', 'Type', 'Source', 'Target', 'Source Rows', 'Inserted', 'Failed', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.details.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge color={d.type === 'pipeline' ? 'violet' : 'cyan'} size="sm">{d.type?.toUpperCase()}</Badge>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{d.sourceTable}</td>
                    <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{d.targetTable}</td>

                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>{d.type !== 'pipeline' ? d.sourceRows?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>{d.type !== 'pipeline' ? d.inserted?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: d.failedRows > 0 ? 'var(--accent-red)' : 'var(--text-dim)', fontWeight: 500 }}>{d.type !== 'pipeline' ? d.failedRows?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge color={d.status === 'Success' ? 'green' : d.status === 'Failed' ? 'red' : 'amber'} size="sm">{d.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Log Drawer ────────────────────────────────────────────────────────────────
const LogDrawer = ({ logs, onClose }) => (
  <div style={{
    position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
    background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-dim)',
    zIndex: 100, display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.5)', animation: 'slide-right 0.2s ease'
  }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={14} style={{ color: 'var(--accent-cyan)' }} />Audit Logs
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
        <X size={16} />
      </button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
      {logs.length === 0 && <div style={{ color: 'var(--text-dim)', fontSize: 11, textAlign: 'center', marginTop: 40 }}>No logs yet</div>}
      {[...logs].reverse().map((log, i) => (
        <div key={i} style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{log.event}</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{formatLocalTime(log.timestamp)}</span>
          </div>
          {Object.entries(log).filter(([k]) => !['id', 'timestamp', 'event'].includes(k)).map(([k, v]) => (
            <div key={k} style={{ fontSize: 10, color: 'var(--text-muted)' }}>{k}: <span style={{ color: 'var(--text-secondary)' }}>{String(v)}</span></div>
          ))}
        </div>
      ))}
    </div>
  </div>
)

const formatLocalTime = (timestampStr) => {
  if (!timestampStr) return '';
  try {
    let dateStr = timestampStr;
    // If it's a plain ISO string from Python without 'Z' or offset, append 'Z' to treat it as UTC
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
      dateStr += 'Z';
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return timestampStr.slice(11, 19);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return timestampStr.slice(11, 19);
  }
};

// ─── Migration App ───────────────────────────────────────────────────────────────
function MigrationApp({ persona, onLogout }) {
  const [step, setStep] = useState(0)
  const [agentStatuses, setAgentStatuses] = useState({})
  const [sourceResources, setSourceResources] = useState(null)
  const [targetResources, setTargetResources] = useState(null)
  const [selectedResources, setSelectedResources] = useState([])
  const [gapAnalysis, setGapAnalysis] = useState(null)
  const [summary, setSummary] = useState(null)
  const targetTypesRef = useRef({})
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [srcCfg, setSrcCfg] = useState({})
  const [tgtCfg, setTgtCfg] = useState({})
  const srcRef = useRef(srcCfg)
  const tgtRef = useRef(tgtCfg)
  useEffect(() => { srcRef.current = srcCfg }, [srcCfg])
  useEffect(() => { tgtRef.current = tgtCfg }, [tgtCfg])

  // Route all incoming WS messages
  const handleMessage = useCallback((msg) => {
    // Agent status
    if (msg.type === 'agent_status') {
      setAgentStatuses(prev => ({ ...prev, [msg.agent]: msg.status }))
      return
    }
    // Route to current step handlers
    window.__connectHandler?.(msg)
    window.__discoveryHandler?.(msg)
    window.__insightHandler?.(msg)
    window.__replicationHandler?.(msg)
    // Audit log
    if (msg.type === 'agent_error') {
      setLogs(prev => [...prev, { event: 'AGENT_ERROR', ...msg, timestamp: new Date().toISOString() }])
    }
  }, [])

  const { send, status: wsStatus } = useWebSocket(CLIENT_ID, handleMessage)

  // Intercept send to capture configs
  const wrappedSend = useCallback((action, payload) => {
    if (action === 'connect_source') setSrcCfg(payload)
    if (action === 'connect_target') setTgtCfg(payload)
    // Log every action
    setLogs(prev => [...prev, { event: `WS_SEND:${action}`, timestamp: new Date().toISOString(), ...Object.fromEntries(Object.entries(payload).filter(([k]) => !['password', 'token'].includes(k))) }])
    return send(action, payload)
  }, [send])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border-dim)',
        background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GitBranch size={15} style={{ color: '#fff' }} />
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', marginBottom: 4 }}>ETL Migration Platform</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{(srcCfg?.platform === 'mysql' ? 'MySQL' : 'Teradata')} → {tgtCfg?.platform === 'snowflake' ? 'Snowflake' : 'Databricks'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AgentBar agentStatuses={agentStatuses} />
            <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />
            <StatusDot status={wsStatus} />
            <Btn size="sm" variant="ghost" onClick={() => setShowLogs(v => !v)} icon={<FileText size={11} />}>
              Logs {logs.length > 0 && <Badge color="amber" size="sm">{logs.length}</Badge>}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={onLogout} icon={<LogOut size={11} />}>
              Logout
            </Btn>
          </div>
        </div>
      </header>

      {/* Step bar */}
      <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-dim)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <StepBar current={step} onStepClick={(i) => setStep(i)} />
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', padding: '28px 24px', width: '100%' }}>
        {step === 0 && (
          <ConnectStep
            send={wrappedSend}
            wsStatus={wsStatus}
            onComplete={() => setStep(1)}
            persona={persona}
          />
        )}
        {step === 1 && (
          <DiscoverStep
            send={wrappedSend}
            srcCfg={srcCfg}
            tgtCfg={tgtCfg}
            onComplete={(src, tgt) => { setSourceResources(src); setTargetResources(tgt); setStep(2) }}
          />
        )}
        {step === 2 && (
          <AnalyzeStep
            send={wrappedSend}
            sourceResources={sourceResources}
            targetResources={targetResources}
            tgtCfg={tgtCfg}
            onComplete={(sel, gap, tt) => { setSelectedResources(sel); setGapAnalysis(gap); targetTypesRef.current = tt; setStep(3) }}
          />
        )}
        {step === 3 && (
          <ReplicateStep
            send={wrappedSend}
            selected={selectedResources}
            gapAnalysis={gapAnalysis}
            sourceResources={sourceResources}
            targetResources={targetResources}
            srcCfg={srcCfg}
            tgtCfg={tgtCfg}
            targetTypes={targetTypesRef.current}
            onComplete={(s) => { setSummary(s); setStep(4) }}
          />
        )}
        {step === 4 && (
          <DoneStep
            summary={summary}
            logs={logs}
            tgtCfg={tgtCfg}
            onRestart={() => { setStep(0); setLogs([]); setSourceResources(null); setTargetResources(null); setAgentStatuses({}) }}
          />
        )}
      </main>

      {/* WS disconnected warning */}
      {wsStatus !== 'connected' && wsStatus !== 'connecting' && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius)', padding: '8px 18px', fontSize: 11,
          color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 200
        }}>
          <AlertCircle size={13} />
          WebSocket {wsStatus} — backend at ws://localhost:3007
        </div>
      )}

      {/* Log drawer */}
      {showLogs && <LogDrawer logs={logs} onClose={() => setShowLogs(false)} />}
    </div>
  )
}

// ─── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [persona, setPersona] = useState(() => {
    try {
      const saved = localStorage.getItem('tera_persona')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const handleLogin = (p) => {
    setPersona(p)
    if (p) {
      localStorage.setItem('tera_persona', JSON.stringify(p))
    } else {
      localStorage.removeItem('tera_persona')
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/" element={<LandingPage persona={persona} />} />
      <Route path="/migration" element={persona ? <MigrationApp persona={persona} onLogout={() => handleLogin(null)} /> : <Navigate to="/" replace />} />
    </Routes>
  )
}
