import React from 'react'

const Card = ({ children, style, glow, className, ...props }) => (
  <div
    className={className}
    style={{
      background: 'var(--bg-card)', border: '1px solid',
      borderColor: glow ? 'var(--border-glow)' : 'var(--border-dim)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-card)',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
)

export default Card
