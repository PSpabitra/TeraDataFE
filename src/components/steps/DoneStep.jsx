import React from 'react'
import { CheckCircle, RefreshCw, ChevronRight } from 'lucide-react'
import Badge from '../common/Badge'
import Btn from '../common/Btn'

import { useMigration } from '../../context/MigrationContext'
import { TARGETS } from '../../config/platforms'

const DoneStep = () => {
  const { summary, logs, tgtCfg, restartMigration: onRestart } = useMigration()
  const tgtPlatform = TARGETS[tgtCfg?.platform]?.name || 'Target'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 0' }} className="animate-fade">
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'var(--green-dim)',
        border: '2px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 0 30px rgba(16,185,129,0.25)'
      }}>
        <CheckCircle size={32} style={{ color: 'var(--accent-green)' }} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Migration Complete</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>All selected resources have been migrated to {tgtPlatform}</p>
      {summary && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {[
            ['Total Items', summary.total, 'cyan'],
            ['Completed', summary.completed, 'green'],
            ['Failed', summary.failed, 'red'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ padding: '16px 28px', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: `var(--accent-${c})`, fontFamily: 'var(--font-display)' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      <Btn onClick={onRestart} variant="ghost" icon={<RefreshCw size={13} />}>Start New Migration</Btn>

      {summary?.details && summary.details.length > 0 && (
        <div style={{ width: '100%', maxWidth: 900, marginTop: 40, textAlign: 'left', background: 'var(--bg-card)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} className="animate-fade">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>Migration Details</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Table', 'Type', 'Source', 'Target', 'Source Rows', 'Inserted', 'Failed', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.details.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge color={(d.type === 'pipeline' || d.type === 'SP') ? 'violet' : 'cyan'} size="sm">{d.type?.toUpperCase()}</Badge>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{d.sourceTable}</td>
                    <td style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{d.targetTable}</td>

                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>{(d.type !== 'pipeline' && d.type !== 'SP') ? d.sourceRows?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--accent-green)', fontWeight: 500 }}>{(d.type !== 'pipeline' && d.type !== 'SP') ? d.inserted?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: d.failedRows > 0 ? 'var(--accent-red)' : 'var(--text-dim)', fontWeight: 500 }}>{(d.type !== 'pipeline' && d.type !== 'SP') ? d.failedRows?.toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <Badge color={d.status === 'Success' ? 'green' : d.status === 'Failed' ? 'red' : 'amber'} size="sm">{d.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoneStep
