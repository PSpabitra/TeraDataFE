import React from 'react'

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

export default Field
