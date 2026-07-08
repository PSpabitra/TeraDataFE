import React from 'react'

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{children}</h3>
    {sub && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{sub}</p>}
  </div>
)

export default SectionTitle
