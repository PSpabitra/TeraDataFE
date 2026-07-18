import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Circle, Play, ChevronRight, Terminal, Activity, CheckCircle, LayoutDashboard, ScrollText, RefreshCw } from 'lucide-react'
import Btn from '../common/Btn'
import Spinner from '../common/Spinner'
import SectionTitle from '../common/SectionTitle'
import { formatLocalTime } from '../../utils/time'
import { SOURCES, TARGETS } from '../../config/platforms'
import { API } from '../../utils/constants'

import { useMigration } from '../../context/MigrationContext'

/**
 * ReplicateStep component.
 * @returns {React.ReactElement}
 */
const ReplicateStep = () => {
  const { send, selectedResources: selected, setSelectedResources, gapAnalysis, sourceResources, targetResources, srcCfg, tgtCfg, targetTypes, summary, setSummary, setStep, connectionName, replicationMode, persona, viewingHistory, restartMigration } = useMigration()
  const onComplete = (s) => { setSummary(s); setStep(4) }
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
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
    if (viewingHistory && connectionName) {
      const url = persona?.id
        ? `${API}/api/v1/replication/recent-runs?persona_id=${persona.id}`
        : `${API}/api/v1/replication/recent-runs`

      fetch(url)
        .then(res => res.json())
        .then(data => {
          const runs = data.runs || []
          const myRuns = runs.filter(r => r.connection_name === connectionName)
          if (myRuns.length > 0) {
            const latestRun = myRuns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

            const mappedEvents = (latestRun.logs || []).map(log => ({
              ...log,
              status: log.status || log.step
            }))

            setEvents(mappedEvents)
            setStarted(true)

            const isFinished = latestRun.status === 'Success' || latestRun.status === 'COMPLETED'
            if (isFinished) {
              setDone(true)
              setSummary({
                completed: latestRun.tables || latestRun.objects_count || mappedEvents.filter(e => e.status === 'ITEM_COMPLETED').length,
                failed: mappedEvents.filter(e => e.status === 'ITEM_FAILED').length
              })
            } else {
              setDone(false)
              setSummary(null)
            }

            // Populate the selected resources queue panel
            const uniqueItems = Array.from(new Set(mappedEvents.map(e => e.item).filter(Boolean)))
            const mockSelected = uniqueItems.map((name, index) => ({
              id: String(index),
              name: name,
              type: mappedEvents.find(e => e.item === name)?.type || 'dataset',
              kind: mappedEvents.find(e => e.item === name)?.type || 'dataset'
            }))
            setSelectedResources(mockSelected)
          }
        })
        .catch(err => console.error("Failed to load run history in ReplicateStep:", err))
    }
  }, [viewingHistory, connectionName, persona?.id, setSelectedResources])

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
        target_type: targetTypes?.[s.name] || ((s.type === 'PROCEDURE' || s.type === 'STORED_PROCEDURE') ? 'DATABRICKS_WORKFLOW' : undefined),
        columns: s.columns || [], row_count: s.row_count || 0, tags: s.tags || []
      })),
      source_platform: srcCfg?.platform || 'teradata',
      target_platform: tgtCfg?.platform || 'databricks',
      gap_analysis: gapAnalysis?.gap_analysis || {},
      connection_name: connectionName || 'default_connection',
      replication_mode: replicationMode || 'create_and_insert',
      persona_id: persona?.id
    })
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

  const calculateRunProgress = (selectedItems, logEvents, isFinished, totalTablesCount) => {
    if (isFinished) return 100
    const itemNames = selectedItems && selectedItems.length > 0
      ? selectedItems.map(item => item.name)
      : Array.from(new Set(logEvents.map(e => e.item).filter(Boolean)))

    const denominator = totalTablesCount || itemNames.length

    if (denominator === 0) {
      if (logEvents.some(e => e.status === 'STARTED' || e.step === 'STARTED')) return 10
      return 0
    }

    let totalProgress = 0
    itemNames.forEach(name => {
      const itemEvents = logEvents.filter(e => e.item === name)
      const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED' || e.step === 'DATASET_SUCCESS' || e.step === 'PIPELINE_SUCCESS')
      const failed = itemEvents.some(e => e.status === 'ITEM_FAILED' || e.step === 'ITEM_FAILED')

      if (finished || failed) {
        totalProgress += 100
        return
      }
      if (itemEvents.length === 0) return

      const batchEvt = itemEvents.filter(e => e.status === 'BATCH_LOADED' || e.step === 'BATCH_LOADED').slice(-1)[0]
      if (batchEvt && batchEvt.progress_pct !== undefined) {
        totalProgress += 40 + (batchEvt.progress_pct * 0.55)
        return
      }

      const hasMsg = (q) => itemEvents.some(e => e.message?.toLowerCase().includes(q.toLowerCase()))
      if (hasMsg('Deployed') || hasMsg('Notebook')) {
        totalProgress += 90
      } else if (hasMsg('Deploying') || hasMsg('verification')) {
        totalProgress += 70
      } else if (hasMsg('Inserting') || hasMsg('Translating MySQL SQL query')) {
        totalProgress += 45
      } else if (hasMsg('Extracted') || hasMsg('Pipeline translated')) {
        totalProgress += 30
      } else if (hasMsg('Extracting') || hasMsg('Creating table')) {
        totalProgress += 15
      } else if (hasMsg('Translating')) {
        totalProgress += 10
      } else {
        totalProgress += 5
      }
    })

    const pct = totalProgress / denominator
    return Math.min(Math.round(pct), 100)
  }

  const activeItem = selected.find(item => {
    const itemEvents = events.filter(e => e.item === item.name)
    const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED' || e.step === 'DATASET_SUCCESS' || e.step === 'PIPELINE_SUCCESS')
    const failed = itemEvents.some(e => e.status === 'ITEM_FAILED' || e.step === 'ITEM_FAILED')
    return started && !finished && !failed && itemEvents.length > 0
  })

  const activePct = calculateRunProgress(selected, events, done, selected?.length)
  const hasFailed = summary?.failed > 0 || events.some(e => e.status === 'ITEM_FAILED' || e.step === 'ITEM_FAILED' || e.status === 'FAILED')

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left: Queue */}
        <div>
          <SectionTitle children="Migration Queue" sub={`${selected.length} items selected`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto' }}>
            {selected.map((item, i) => {
              const itemEvents = events.filter(e => e.item === item.name)
              const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED' || e.step === 'DATASET_SUCCESS' || e.step === 'PIPELINE_SUCCESS')
              const failed = itemEvents.some(e => e.status === 'ITEM_FAILED' || e.step === 'ITEM_FAILED')
              const running = started && !finished && !failed && itemEvents.length > 0
              const waiting = started && !finished && !failed && itemEvents.length === 0 && !done

              const batchEvt = itemEvents.filter(e => e.status === 'BATCH_LOADED' || e.step === 'BATCH_LOADED').slice(-1)[0]
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
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                        {(() => {
                          let finalType = item.kind || 'dataset';
                          if (item.type === 'STORED_PROCEDURE' || item.type === 'PROCEDURE') {
                            const selectedTargetType = targetTypes?.[item.name];
                            if (selectedTargetType === 'DATABRICKS_WORKFLOW') {
                              finalType = 'pipeline';
                            } else if (selectedTargetType === 'DATABRICKS_SQL_SP') {
                              finalType = 'SP';
                            } else {
                              if (tgtCfg?.platform === 'databricks') {
                                finalType = 'pipeline';
                              } else {
                                finalType = 'SP';
                              }
                            }
                          }
                          return finalType.toUpperCase();
                        })()}
                      </div>
                    </div>
                  </div>
                  {started && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ background: 'var(--bg-void)', borderRadius: 2, height: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${finished ? 100 : (failed ? (pct || 0) : (running ? (pct || 0) : 0))}%`,
                          background: finished ? 'var(--accent-green)' : failed ? 'var(--accent-red)' : running ? 'var(--accent-violet)' : 'var(--border-dim)',
                          borderRadius: 2,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                        {finished ? 100 : (failed ? (pct || 0) : (running ? (pct || 0) : 0))}%
                      </div>
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
          {started && (
            <div style={{ marginTop: 12 }}>
              <Btn onClick={restartMigration} variant="primary" size="lg" icon={<RefreshCw size={13} />}>
                {viewingHistory ? 'Back to Connection Profiles' : 'Go to Migration Wizard'}
              </Btn>
            </div>
          )}
          {done && summary && (
            <div style={{
              marginTop: 12,
              padding: '12px',
              background: hasFailed ? 'var(--red-dim)' : 'var(--green-dim)',
              border: `1px solid ${hasFailed ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              borderRadius: 'var(--radius)'
            }}>
              <div style={{
                color: hasFailed ? 'var(--accent-red)' : 'var(--accent-green)',
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 6
              }}>
                {hasFailed ? (
                  <><X size={12} style={{ display: 'inline', marginRight: 5 }} />Migration Completed with Errors</>
                ) : (
                  <><Check size={12} style={{ display: 'inline', marginRight: 5 }} />Migration Complete</>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {summary.completed} completed · {summary.failed} failed
              </div>
              <div style={{ marginTop: 10 }}>
                <Btn onClick={() => {
                  const srcPlatform = SOURCES[srcCfg?.platform]?.name || 'Source'
                  const tgtPlatform = TARGETS[tgtCfg?.platform]?.name || 'Target'

                  const details = selected.map(item => {
                    const itemEvents = events.filter(e => e.item === item.name)
                    const finished = itemEvents.some(e => e.status === 'ITEM_COMPLETED' || e.step === 'DATASET_SUCCESS' || e.step === 'PIPELINE_SUCCESS')
                    const failed = itemEvents.some(e => e.status === 'ITEM_FAILED' || e.step === 'ITEM_FAILED')
                    const status = finished ? 'Success' : failed ? 'Failed' : 'Pending'

                    // Parse row counts dynamically from event logs
                    let sourceRows = item.row_count || 0
                    let inserted = 0
                    let failedRows = 0

                    const messages = [...itemEvents].reverse().map(e => e.message || '').filter(Boolean)
                    for (const msg of messages) {
                      const extMatch = msg.match(/extracted\s+(\d+,?\d*)\s+rows/i)
                      if (extMatch) {
                        sourceRows = parseInt(extMatch[1].replace(/,/g, ''), 10)
                        break
                      }
                    }

                    let foundSync = false
                    for (const msg of messages) {
                      const syncMatch = msg.match(/successfully synced:\s*(\d+,?\d*)\s*inserted,\s*(\d+,?\d*)\s*updated/i)
                      if (syncMatch) {
                        const ins = parseInt(syncMatch[1].replace(/,/g, ''), 10)
                        const upd = parseInt(syncMatch[2].replace(/,/g, ''), 10)
                        inserted = ins + upd
                        foundSync = true
                        break
                      }
                      const reloadMatch = msg.match(/(?:reloaded|loaded)\s+(\d+,?\d*)\s+rows/i)
                      if (reloadMatch) {
                        inserted = parseInt(reloadMatch[1].replace(/,/g, ''), 10)
                        foundSync = true
                        break
                      }
                    }

                    if (!foundSync && finished) {
                      inserted = sourceRows
                    }
                    if (failed) {
                      failedRows = sourceRows
                    }

                    return {
                      name: item.name,
                      type: (() => {
                        let finalType = item.kind || 'dataset';
                        if (item.type === 'STORED_PROCEDURE' || item.type === 'PROCEDURE') {
                          const selectedTargetType = targetTypes?.[item.name];
                          if (selectedTargetType === 'DATABRICKS_WORKFLOW') {
                            finalType = 'pipeline';
                          } else if (selectedTargetType === 'DATABRICKS_SQL_SP') {
                            finalType = 'SP';
                          } else {
                            if (tgtCfg?.platform === 'databricks') {
                              finalType = 'pipeline';
                            } else {
                              finalType = 'SP';
                            }
                          }
                        }
                        return finalType;
                      })(),
                      sourceTable: srcPlatform,
                      sourceRows: sourceRows,
                      targetTable: tgtPlatform,
                      inserted: inserted,
                      failedRows: failedRows,
                      status: status
                    }
                  })
                  onComplete({ ...summary, details })
                }} variant="success" size="sm" icon={<ChevronRight size={11} />}>View Summary</Btn>
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
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', flexDirection: 'column', animation: 'fade-in 0.2s ease forwards' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
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
                  {(() => {
                    const isFinished = evt.status === 'ITEM_COMPLETED';
                    const isFailed = evt.status === 'ITEM_FAILED';

                    const isLatestBatchPending = () => {
                      if (evt.status !== 'BATCH_LOADED' && evt.step !== 'BATCH_LOADED') return false;

                      const itemEvents = events.slice(i + 1);
                      const hasEnded = itemEvents.some(e => e.item === evt.item && (
                        e.status === 'ITEM_COMPLETED' || e.status === 'ITEM_FAILED'
                      ));
                      if (hasEnded) return false;

                      const hasNewerBatch = itemEvents.some(e => e.item === evt.item && (
                        e.status === 'BATCH_LOADED' || e.step === 'BATCH_LOADED'
                      ));
                      return !hasNewerBatch;
                    };

                    const showProgress = isFinished || isFailed || isLatestBatchPending();
                    if (!showProgress) return null;

                    const pct = isFinished ? 100 : (isFailed ? 0 : (evt.progress_pct || 0));
                    const barColor = isFinished ? 'var(--accent-green)' : isFailed ? 'var(--accent-red)' : 'var(--accent-cyan)';

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 24, marginTop: 2, maxWidth: 300 }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 2, height: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 2, transition: 'width 0.2s' }} />
                        </div>
                        <span style={{ fontSize: 9, color: barColor, fontWeight: 600 }}>{pct}%</span>
                      </div>
                    );
                  })()}
                </div>
              )
            })}

            {/* Custom loader at the very bottom of the log list */}
            {started && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 0 12px 0',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: 12,
                gap: 8,
                animation: 'fade-in 0.3s ease'
              }}>
                <div style={{
                  fontFamily: 'sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: done ? (hasFailed ? 'var(--accent-red)' : 'var(--accent-green)') : 'var(--text-secondary)'
                }}>
                  {done ? (hasFailed ? 'MIGRATION FAILED' : 'MIGRATION COMPLETE') : 'REPLICATING DATABASE'}
                </div>
                <div style={{
                  width: '80%',
                  maxWidth: 320,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  height: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${activePct}%`,
                    background: done 
                      ? (hasFailed ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #10b981, #34d399)') 
                      : 'linear-gradient(90deg, #38bdf8, #8b5cf6)',
                    borderRadius: 6,
                    transition: 'width 0.3s ease',
                    boxShadow: done 
                      ? (hasFailed ? '0 0 8px rgba(239, 68, 68, 0.4)' : '0 0 8px rgba(16, 185, 129, 0.4)') 
                      : '0 0 8px rgba(56, 189, 248, 0.4)'
                  }} />
                </div>
                <div style={{
                  fontFamily: 'sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}>
                  {activePct}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReplicateStep
