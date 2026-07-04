import { Loader2 } from 'lucide-react'

export const Badge = ({ children, color = 'cyan', size = 'sm' }) => {
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

export const Spinner = ({ size = 14 }) => <Loader2 size={size} className="spin" />

export const StatusDot = ({ status }) => {
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

export const Btn = ({ children, onClick, variant = 'primary', disabled = false, size = 'md', icon, style }) => {
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

export const Card = ({ children, style, glow }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid',
    borderColor: glow ? 'var(--border-glow)' : 'var(--border-dim)',
    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
    boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-card)',
    ...style
  }}>{children}</div>
)

export const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{children}</h3>
    {sub && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{sub}</p>}
  </div>
)

export const Field = ({ label, value, onChange, type = 'text', placeholder = '', required, password }) => (
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
