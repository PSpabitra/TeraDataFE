import React, { useState, useEffect } from 'react'
import { API } from '../utils/constants'
import { useMigration } from '../context/MigrationContext'
import { ScrollText, History, ExternalLink, RefreshCw, AlertCircle, CheckCircle, Terminal, HelpCircle } from 'lucide-react'
import Card from '../components/common/Card'
import Btn from '../components/common/Btn'
import Badge from '../components/common/Badge'

export default function LogsPage() {
  const { persona } = useMigration()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState(null)
  const [expandedDdl, setExpandedDdl] = useState({})

  const fetchRuns = () => {
    setLoading(true)
    const url = persona?.id
      ? `${API}/api/v1/replication/recent-runs?persona_id=${persona.id}`
      : `${API}/api/v1/replication/recent-runs`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const fetchedRuns = data.runs || []
        setRuns(fetchedRuns)
        setLoading(false)
        if (fetchedRuns.length > 0) {
          // Keep current selection if valid, else select the first run
          if (selectedRun) {
            const stillExists = fetchedRuns.find(r => r.job_id === selectedRun.job_id)
            if (stillExists) {
              setSelectedRun(stillExists)
              return
            }
          }
          setSelectedRun(fetchedRuns[0])
        }
      })
      .catch(err => {
        console.error("Error loading recent runs:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRuns()
  }, [persona?.id])

  const toggleDdl = (idx) => {
    setExpandedDdl(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const formatTimestamp = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return isoString
    }
  }

  const getStatusBadgeVariant = (status) => {
    if (status === 'Success' || status === 'COMPLETED') return 'success'
    if (status === 'Failed') return 'danger'
    return 'warning'
  }

  return (
    <main style={{ flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Audit & Migration Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Review structured audit logs, generated DDL schemas, data volume details, and lineage charts for all migration connection profiles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, flex: 1, minHeight: 'calc(100vh - 220px)' }}>
        
        {/* Left Side: Runs List */}
        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Migration Profiles</span>
            </div>
            <button 
              onClick={fetchRuns} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '680px', paddingRight: 4 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: 12 }}>
                Loading migration history...
              </div>
            ) : runs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: 12 }}>
                No migration runs found.
              </div>
            ) : (
              runs.map((r, i) => {
                const isSelected = selectedRun && selectedRun.job_id === r.job_id
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedRun(r)
                      setExpandedDdl({})
                    }}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 'var(--radius)',
                      border: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-dim)',
                      background: isSelected ? 'var(--bg-active)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {r.connection_name || 'default_connection'}
                      </span>
                      <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                        {r.status}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                      <span>{r.source} → {r.target}</span>
                      <span>{r.tables || 0} Tables</span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                      {new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* Right Side: Log Console / Structured Viewer */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          {selectedRun ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
              {/* Header Info */}
              <div style={{ borderBottom: '1px solid var(--border-dim)', paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {selectedRun.connection_name || 'default_connection'}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span><strong>Job ID:</strong> {selectedRun.job_id}</span>
                    <span>•</span>
                    <span><strong>Platforms:</strong> {selectedRun.source} → {selectedRun.target}</span>
                    <span>•</span>
                    <span><strong>Volume:</strong> {selectedRun.size || '—'}</span>
                  </div>
                </div>

                <a 
                  href={`${API}/graphs/${selectedRun.connection_name || 'default_connection'}.html`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Btn variant="outline" size="sm" icon={<ExternalLink size={13} />}>
                    Open Lineage Graph
                  </Btn>
                </a>
              </div>

              {/* Console Output */}
              <div style={{
                flex: 1,
                background: '#0f172a',
                borderRadius: 'var(--radius)',
                border: '1px solid #1e293b',
                padding: '20px',
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontSize: 12,
                color: '#e2e8f0',
                overflowY: 'auto',
                maxHeight: '620px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ color: '#64748b', borderBottom: '1px solid #1e293b', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={14} />
                  <span>TERMINAL LOG CONSOLE</span>
                </div>

                {(!selectedRun.logs || selectedRun.logs.length === 0) ? (
                  <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px 0' }}>
                    No detailed step execution logs found in MySQL for this run.
                  </div>
                ) : (
                  selectedRun.logs.map((log, idx) => {
                    const step = log.step || log.status || ''
                    const isSuccess = step.includes('SUCCESS') || step === 'COMPLETED'
                    const isError = step.includes('FAILED') || step === 'ERROR'
                    const isDdl = step === 'DDL_GENERATED'

                    return (
                      <div key={idx} style={{ 
                        borderLeft: isError ? '2px solid #ef4444' : isSuccess ? '2px solid #10b981' : '2px solid #334155',
                        paddingLeft: 12,
                        margin: '4px 0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ 
                            fontWeight: 700, 
                            color: isError ? '#ef4444' : isSuccess ? '#34d399' : '#38bdf8',
                            fontSize: 11
                          }}>
                            {step} {log.item ? `[${log.item}]` : ''}
                          </span>
                          <span style={{ fontSize: 10, color: '#475569' }}>
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>

                        {log.message && (
                          <div style={{ color: isError ? '#fca5a5' : isSuccess ? '#a7f3d0' : '#cbd5e1', marginBottom: 4 }}>
                            {log.message}
                          </div>
                        )}

                        {/* Collapsible DDL container */}
                        {isDdl && log.detail && (
                          <div style={{ marginTop: 6 }}>
                            <button
                              onClick={() => toggleDdl(idx)}
                              style={{
                                background: '#1e293b',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: 10,
                                padding: '4px 8px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                outline: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <span>{expandedDdl[idx] ? 'Hide' : 'Show'} SQL DDL Detail</span>
                            </button>
                            {expandedDdl[idx] && (
                              <pre style={{
                                background: '#020617',
                                border: '1px solid #1e293b',
                                borderRadius: 'var(--radius)',
                                padding: 12,
                                marginTop: 6,
                                overflowX: 'auto',
                                color: '#38bdf8',
                                fontSize: 10,
                                lineHeight: '1.4',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                              }}>
                                {log.detail}
                              </pre>
                            )}
                          </div>
                        )}

                        {/* Error info if failed */}
                        {log.error && (
                          <div style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5', 
                            padding: 8, 
                            borderRadius: 4, 
                            marginTop: 4,
                            fontSize: 11
                          }}>
                            <strong>Error:</strong> {log.error}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: 12 }}>
              <HelpCircle size={48} strokeWidth={1} />
              <span>Select a migration run profile from the list to view its structured audit log.</span>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
