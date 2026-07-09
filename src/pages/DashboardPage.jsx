import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, TrendingUp, Layers, PlayCircle, ShieldCheck, History, ChevronRight, Activity, ArrowUpRight, LogOut } from 'lucide-react'
import Card from '../components/common/Card'
import Btn from '../components/common/Btn'
import Badge from '../components/common/Badge'

/**
 * DashboardPage component (Dummy operational dashboard).
 * @returns {React.ReactElement}
 */
export default function DashboardPage() {
  const navigate = useNavigate()

  const metrics = [
    { label: 'Total Data Migrated', value: '1.42 TB', change: '+12.4%', icon: <TrendingUp size={16} />, color: 'cyan' },
    { label: 'Active Pipelines', value: '4 Running', change: 'Stable', icon: <Activity size={16} />, color: 'violet' },
    { label: 'Tables Migrated', value: '142', change: '+8 this week', icon: <Layers size={16} />, color: 'green' },
    { label: 'Avg Success Rate', value: '99.85%', change: '+0.1%', icon: <ShieldCheck size={16} />, color: 'amber' },
  ]

  const recentruns = [
    { id: 'MIG-8092', source: 'Teradata', target: 'Databricks', tables: 18, size: '240 GB', date: '2026-07-08 14:22', status: 'Success' },
    { id: 'MIG-8091', source: 'MySQL', target: 'Snowflake', tables: 5, size: '1.8 GB', date: '2026-07-08 10:12', status: 'Success' },
    { id: 'MIG-8090', source: 'MSSQL', target: 'Databricks', tables: 34, size: '840 GB', date: '2026-07-07 18:45', status: 'Failed', error: 'Lock timeout exceeded' },
    { id: 'MIG-8089', source: 'Teradata', target: 'Databricks', tables: 12, size: '42 GB', date: '2026-07-07 11:30', status: 'Success' },
  ]

  return (
    <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-lg)',
          padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Ready for your next migration?</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 600 }}>Create jobs to schema map, validate datatypes, resolve constraints, and run replication pipelines with sub-minute synchronization latency.</p>
          </div>
          <Btn onClick={() => navigate('/migration')} variant="primary" size="lg" icon={<PlayCircle size={15} />}>
            Launch Migration Wizard
          </Btn>
        </div>

        {/* KPIs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {metrics.map((m, i) => (
            <Card key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{m.label}</span>
                <div style={{ padding: 6, background: `var(--${m.color}-dim)`, border: `1px solid rgba(${m.color === 'cyan' ? '56,189,248' : m.color === 'violet' ? '139,92,246' : m.color === 'green' ? '16,185,129' : '245,158,11'}, 0.25)`, borderRadius: 6, color: `var(--accent-${m.color})` }}>
                  {m.icon}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{m.value}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: m.change.startsWith('+') ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                  {m.change}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Dynamic Details Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Recent Runs Table */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <History size={16} style={{ color: 'var(--text-secondary)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Migration Runs</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    {['Run ID', 'Pipeline Source / Target', 'Tables', 'Data Volume', 'Date', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentruns.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{r.id}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                          <strong>{r.source}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→</span> <strong>{r.target}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{r.tables} tables</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>{r.size}</td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)' }}>{r.date}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Badge color={r.status === 'Success' ? 'green' : 'red'} size="sm">{r.status}</Badge>
                          {r.error && <span style={{ fontSize: 9, color: 'var(--accent-red)' }}>{r.error}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Actions & Agents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Operational Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'View Pipeline Logs', desc: 'Browse historical worker metrics' },
                  { label: 'Manage Connections', desc: 'Update source database credentials' },
                  { label: 'API Developer Portal', desc: 'Access webhook configurations' },
                ].map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => {}}
                    style={{
                      width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)',
                      padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{act.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{act.desc}</div>
                    </div>
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            </Card>

            <Card glow>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Migration Agent Statuses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'Schema Connector Agent', status: 'online' },
                  { name: 'Schema Discovery Agent', status: 'online' },
                  { name: 'Constraint Insight Agent', status: 'online' },
                  { name: 'Data Replication Agent', status: 'idle' },
                ].map((a, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'online' ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: a.status === 'online' ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </main>
  )
}
