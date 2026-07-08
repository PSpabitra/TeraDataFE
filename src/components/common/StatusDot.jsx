import React from 'react'

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

export default StatusDot
