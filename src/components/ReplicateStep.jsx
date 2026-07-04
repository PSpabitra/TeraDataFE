import { useState, useEffect, useRef } from 'react'
import { Check, X, CheckCircle, Activity, Circle, Play, Terminal, ChevronRight } from 'lucide-react'
import { Btn, Badge, Spinner, SectionTitle } from './UI.jsx'
import { formatLocalTime } from '../utils.js'
import { useMigration } from '../context/MigrationContext.jsx'

export default function ReplicateStep() {
  const { send, selectedResources: selected, gapAnalysis, srcCfg, tgtCfg, setReplSummary, setStep } = useMigration()
  const [events, setEvents] = useState([])
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState(null)
  const logRef = useRef(null)

  useEffect(() => {
    window.__replicationHandler = (msg) => {
      if (msg.type === 'replication_progress') {
        const p = msg.progress
        setEvents(prev => [...prev, p])
        if (p.status === 'COMPLETED') { setDone(true); setSummary(p) }
      }
    }
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  const startReplication = () => {
    setStarted(true); setEvents([]); setDone(false)
    send('start_replication', {
      selected_resources: selected.map(s => ({
        ...s,
        id: s.id, name: s.name, type: s.kind || 'dataset',
        original_type: s.type,
        columns: s.columns || [], row_count: s.row_count || 0, tags: s.tags || []
      })),
      source_platform: srcCfg?.platform || 'teradata',
      target_platform: tgtCfg?.platform || 'databricks',
      gap_analysis: gapAnalysis?.gap_analysis || {}
    })
  }

  const handleProceed = () => {
    const srcPlatform = srcCfg?.platform ? (srcCfg.platform === 'mysql' ? 'MySQL' : srcCfg.platform.charAt(0).toUpperCase() + srcCfg.platform.slice(1)) : 'Teradata'
    const tgtPlatform = tgtCfg?.platform ? tgtCfg.platform.charAt(0).toUpperCase() + tgtCfg.platform.slice(1) : 'Databricks'

    const details = selected.map(item => {
      const itemEvents = events.filter(e => e.item === item.name)
      const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED' || e.status === 'DATASET_SUCCESS' || e.status === 'PIPELINE_SUCCESS')
      const failed = itemEvents.some(e => e.status === 'ITEM_FAILED')
      const status = finished ? 'Success' : failed ? 'Failed' : 'Pending'

      const totalRows = item.row_count || 0
      const inserted = finished ? totalRows : 0
      const failedRows = failed ? totalRows : 0

      return {
        name: item.name,
        type: item.kind || 'dataset',
        sourceTable: srcPlatform,
        sourceRows: totalRows,
        targetTable: tgtPlatform,
        inserted: inserted,
        failedRows: failedRows,
        status: status
      }
    })
    setReplSummary({ ...summary, details })
    setStep(4)
  }

  const stepColor = {
    STARTED: '#38bdf8', ITEM_STARTED: '#8b5cf6', ITEM_COMPLETED: '#10b981',
    ITEM_FAILED: '#ef4444', COMPLETED: '#10b981', STEP: '#8ba3c7',
    BATCH_LOADED: '#38bdf8', DATASET_SUCCESS: '#10b981', PIPELINE_SUCCESS: '#10b981'
  }
  const stepIcon = {
    ITEM_COMPLETED: <Check size={11} />, ITEM_FAILED: <X size={11} />,
    COMPLETED: <CheckCircle size={11} />, BATCH_LOADED: <Activity size={11} />
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left: Queue */}
        <div>
          <SectionTitle children="Migration Queue" sub={`${selected.length} items selected`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto' }}>
            {selected.map((item, i) => {
              const itemEvents = events.filter(e => e.item === item.name)
              const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED')
              const failed = itemEvents.some(e => e.status === 'ITEM_FAILED')
              const running = started && !finished && !failed && itemEvents.length > 0
              const waiting = started && !finished && !failed && itemEvents.length === 0 && !done

              const batchEvt = itemEvents.filter(e => e.status === 'BATCH_LOADED').slice(-1)[0]
              const pct = batchEvt?.progress_pct

              return (
                <div key={item.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius)',
                  background: finished ? 'var(--green-dim)' : failed ? 'var(--red-dim)' : 'var(--bg-surface)',
                  border: `1px solid ${finished ? 'rgba(16,185,129,0.25)' : failed ? 'rgba(239,68,68,0.25)' : 'var(--border-dim)'}`,
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ color: finished ? 'var(--accent-green)' : failed ? 'var(--accent-red)' : running ? 'var(--accent-violet)' : 'var(--text-muted)' }}>
                      {finished ? <Check size={12} /> : failed ? <X size={12} /> : running ? <Spinner size={12} /> : <Circle size={12} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{item.kind?.toUpperCase() || 'DATASET'}</div>
                    </div>
                  </div>
                  {running && pct !== undefined && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ background: 'var(--bg-void)', borderRadius: 2, height: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-violet)', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{pct}%</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!started && (
            <div style={{ marginTop: 12 }}>
              <Btn onClick={startReplication} variant="primary" size="lg" icon={<Play size={13} />}>
                Start Migration
              </Btn>
            </div>
          )}
          {done && summary && (
            <div style={{ marginTop: 12, padding: '12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius)' }}>
              <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: 12, marginBottom: 6 }}><Check size={12} style={{ display: 'inline', marginRight: 5 }} />Migration Complete</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {summary.completed} completed · {summary.failed} failed
              </div>
              <div style={{ marginTop: 10 }}>
                <Btn onClick={handleProceed} variant="success" size="sm" icon={<ChevronRight size={11} />}>View Summary</Btn>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live log */}
        <div>
          <SectionTitle children="Live Replication Log" sub="Real-time agent event stream" />
          <div ref={logRef} style={{
            height: 460, overflowY: 'auto', background: 'var(--bg-void)',
            border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)',
            padding: '12px', fontFamily: 'var(--font-mono)', fontSize: 11
          }}>
            {!started && (
              <div style={{ color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                <Terminal size={24} style={{ opacity: 0.3 }} />
                <span>Waiting to start...</span>
              </div>
            )}
            {events.map((evt, i) => {
              const color = stepColor[evt.status] || '#8ba3c7'
              const icon = stepIcon[evt.status]
              return (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', animation: 'fade-in 0.2s ease forwards' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, flexShrink: 0, marginTop: 1 }}>{formatLocalTime(evt.timestamp)}</span>
                  <span style={{ color, flexShrink: 0, marginTop: 1 }}>{icon || <ChevronRight size={10} />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color, fontWeight: 500 }}>{evt.status}</span>
                    {evt.item && <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{evt.item}</span>}
                    {evt.message && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{evt.message}</span>}
                    {evt.error && <div style={{ color: 'var(--accent-red)', fontSize: 10, marginTop: 2, wordBreak: 'break-all' }}>Error: {evt.error}</div>}
                    {evt.detail && <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 2, wordBreak: 'break-all' }}>{evt.detail.slice(0, 120)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
