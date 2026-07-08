import React from 'react'

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

export default Btn
