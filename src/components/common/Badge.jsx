import React from 'react'

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

export default Badge
