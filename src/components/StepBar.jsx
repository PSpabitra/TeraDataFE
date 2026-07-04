import { Check } from 'lucide-react'
import { useMigration } from '../context/MigrationContext.jsx'

const STEPS = ['Connect', 'Discover', 'Analyze', 'Replicate', 'Done']

export default function StepBar() {
  const { step, setStep } = useMigration()
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 4px' }}>
      {STEPS.map((s, i) => {
        const done = i < step, active = i === step
        const clickable = done
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div
              onClick={clickable ? () => setStep(i) : undefined}
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
                background: i < step ? 'var(--accent-green)' : 'var(--border-dim)',
                transition: 'background 0.3s ease'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
