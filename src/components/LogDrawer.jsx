import React from 'react'
import { FileText, X } from 'lucide-react'
import Badge from './common/Badge'
import { formatLocalTime } from '../utils/time'

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

export default LogDrawer
