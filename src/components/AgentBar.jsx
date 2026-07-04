import { Server, Search, Zap, GitBranch } from 'lucide-react'
import { useMigration } from '../context/MigrationContext.jsx'

export default function AgentBar() {
  const { agentStatuses } = useMigration()
  const agents = ['connector', 'discovery', 'insight', 'replication']
  const icons = { connector: Server, discovery: Search, insight: Zap, replication: GitBranch }
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
