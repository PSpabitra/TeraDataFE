import React, { useState, useEffect, useMemo } from 'react'
import { API } from '../utils/constants'
import { useMigration } from '../context/MigrationContext'
import {
  ScrollText, History, ExternalLink, RefreshCw,
  Terminal, HelpCircle, Table2, GitBranch, ArrowRight,
  ChevronDown, ChevronRight, Database, Zap, RotateCcw, Plus
} from 'lucide-react'
import Card from '../components/common/Card'
import Btn from '../components/common/Btn'
import Badge from '../components/common/Badge'

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const MODE_META = {
  CREATE_AND_INSERT: {
    label: 'Create & Insert',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.3)',
    Icon: Plus,
  },
  INCREMENTAL_UPDATE: {
    label: 'Incremental',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.3)',
    Icon: RotateCcw,
  },
  CREATE_PIPELINE: {
    label: 'Create Pipeline',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.3)',
    Icon: GitBranch,
  },
  UPDATE_PIPELINE: {
    label: 'Update Pipeline',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.3)',
    Icon: Zap,
  },
}

const getModeInfo = (mode) => {
  const key = (mode || '').toUpperCase().replace(/-/g, '_')
  return MODE_META[key] || {
    label: mode || 'Unknown',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.2)',
    Icon: Zap,
  }
}

const getStatusBadgeVariant = (status) => {
  if (status === 'Success' || status === 'COMPLETED') return 'success'
  if (status === 'Failed') return 'danger'
  return 'warning'
}

const formatTimestamp = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

/* ─────────────────────────────────────────────
   Group logs by item (table / SP)
   Returns: [{ itemName, mode, type, steps: [...log entries] }]
───────────────────────────────────────────── */
const groupLogsByItem = (logs = []) => {
  const groups = []
  let current = null

  for (const log of logs) {
    const step = log.step || log.status || ''
    const itemName = log.item || null

    if (step === 'ITEM_STARTED' && itemName) {
      current = {
        itemName,
        mode: log.mode || '',
        type: log.type || 'table',
        steps: [],
      }
      groups.push(current)
    } else if (current) {
      current.steps.push(log)
    } else {
      // top-level events (STARTED / COMPLETED / global errors) — put in a synthetic group
      if (groups.length === 0) {
        groups.push({ itemName: null, mode: '', type: 'meta', steps: [] })
      }
      groups[0].steps.push(log)
    }
  }

  return groups
}

/* ─────────────────────────────────────────────
   A single step row inside the console
───────────────────────────────────────────── */
function StepRow({ log, expandedDdl, onToggleDdl, idx }) {
  const step = log.step || log.status || ''
  const isSuccess = step.includes('SUCCESS') || step === 'COMPLETED' || step === 'DATASET_SUCCESS'
  const isError = step.includes('FAILED') || step === 'ERROR'
  const isDdl = step === 'DDL_GENERATED'
  const isProgress = step === 'BATCH_LOADED'

  const borderColor = isError ? '#ef4444' : isSuccess ? '#10b981' : isProgress ? '#f59e0b' : '#334155'
  const stepColor = isError ? '#ef4444' : isSuccess ? '#34d399' : isProgress ? '#fbbf24' : '#38bdf8'
  const msgColor = isError ? '#fca5a5' : isSuccess ? '#a7f3d0' : '#cbd5e1'

  return (
    <div style={{
      borderLeft: `2px solid ${borderColor}`,
      paddingLeft: 12,
      margin: '3px 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontWeight: 700, color: stepColor, fontSize: 10, letterSpacing: '0.05em' }}>
          {step}
        </span>
        <span style={{ fontSize: 9, color: '#475569' }}>
          {formatTimestamp(log.timestamp)}
        </span>
      </div>

      {log.message && (
        <div style={{ color: msgColor, fontSize: 11, marginBottom: 3 }}>
          {log.message}
        </div>
      )}

      {isDdl && log.detail && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={() => onToggleDdl(idx)}
            style={{
              background: '#1e293b',
              border: 'none',
              color: '#94a3b8',
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {expandedDdl[idx] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            {expandedDdl[idx] ? 'Hide' : 'Show'} DDL
          </button>
          {expandedDdl[idx] && (
            <pre style={{
              background: '#020617',
              border: '1px solid #1e293b',
              borderRadius: 6,
              padding: 10,
              marginTop: 6,
              overflowX: 'auto',
              color: '#38bdf8',
              fontSize: 10,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {log.detail}
            </pre>
          )}
        </div>
      )}

      {log.error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#fca5a5',
          padding: '6px 10px',
          borderRadius: 4,
          marginTop: 4,
          fontSize: 11,
        }}>
          <strong>Error:</strong> {log.error}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   One collapsible item group (table / SP block)
───────────────────────────────────────────── */
function ItemGroup({ group, globalDdlState, onToggleDdl, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const { itemName, mode, type, steps } = group
  const modeInfo = getModeInfo(mode)
  const ModeIcon = modeInfo.Icon

  const isProc = type === 'pipeline' || (type || '').toLowerCase().includes('procedure')
  const ItemIcon = isProc ? GitBranch : Table2

  const hasError = steps.some(s => (s.step || s.status || '').includes('FAILED'))
  const hasSuccess = steps.some(s => {
    const st = s.step || s.status || ''
    return st.includes('SUCCESS') || st.includes('COMPLETED')
  })

  const statusColor = hasError ? '#ef4444' : hasSuccess ? '#34d399' : '#f59e0b'

  return (
    <div style={{
      border: `1px solid ${open ? 'rgba(56,189,248,0.25)' : '#1e293b'}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
      transition: 'border-color 0.2s ease',
    }}>
      {/* Group header — click to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: open ? 'rgba(56,189,248,0.06)' : '#0f172a',
          border: 'none',
          padding: '10px 14px',
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transition: 'background 0.15s ease',
        }}
      >
        {/* Expand chevron */}
        {open
          ? <ChevronDown size={13} style={{ color: '#64748b', flexShrink: 0 }} />
          : <ChevronRight size={13} style={{ color: '#64748b', flexShrink: 0 }} />}

        {/* Item icon */}
        <ItemIcon size={13} style={{ color: '#64748b', flexShrink: 0 }} />

        {/* Name */}
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          fontWeight: 700,
          color: '#e2e8f0',
          flex: 1,
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {itemName || '(meta)'}
        </span>

        {/* Mode badge */}
        {mode && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: modeInfo.bg,
            border: `1px solid ${modeInfo.border}`,
            color: modeInfo.color,
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 20,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            <ModeIcon size={9} />
            {modeInfo.label}
          </span>
        )}

        {/* Status dot */}
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: statusColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${statusColor}`,
        }} />
      </button>

      {/* Steps */}
      {open && (
        <div style={{
          background: '#080f1e',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderTop: '1px solid #1e293b',
        }}>
          {steps.length === 0 ? (
            <span style={{ color: '#475569', fontSize: 11, fontStyle: 'italic' }}>No step details.</span>
          ) : (
            steps.map((log, i) => (
              <StepRow
                key={i}
                idx={`${itemName}-${i}`}
                log={log}
                expandedDdl={globalDdlState}
                onToggleDdl={onToggleDdl}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Migration summary banner (source → target)
───────────────────────────────────────────── */
function MigrationSummary({ run, groups }) {
  const tables = groups.filter(g => g.type !== 'meta' && g.type !== 'pipeline' && g.itemName)
  const procs = groups.filter(g => (g.type === 'pipeline' || (g.type || '').toLowerCase().includes('procedure')) && g.itemName)

  const modeCounts = {}
  groups.forEach(g => {
    if (!g.itemName) return
    const mk = (g.mode || '').toUpperCase().replace(/-/g, '_')
    modeCounts[mk] = (modeCounts[mk] || 0) + 1
  })

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(8,15,30,0.9) 100%)',
      border: '1px solid rgba(56,189,248,0.2)',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 4,
    }}>
      {/* Source → Target row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 6,
          padding: '6px 14px',
        }}>
          <Database size={13} style={{ color: '#818cf8' }} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700, color: '#c7d2fe' }}>
            {run.source || '—'}
          </span>
        </div>

        <ArrowRight size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(34,211,238,0.1)',
          border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 6,
          padding: '6px 14px',
        }}>
          <Database size={13} style={{ color: '#22d3ee' }} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700, color: '#a5f3fc' }}>
            {run.target || '—'}
          </span>
        </div>

        <Badge variant={getStatusBadgeVariant(run.status)} size="sm">
          {run.status}
        </Badge>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {tables.length > 0 && (
          <StatChip icon={<Table2 size={11} />} label="Tables" value={tables.length} color="#34d399" />
        )}
        {procs.length > 0 && (
          <StatChip icon={<GitBranch size={11} />} label="SPs / Pipelines" value={procs.length} color="#a78bfa" />
        )}
        {Object.entries(modeCounts).map(([mk, count]) => {
          const info = getModeInfo(mk)
          const Icon = info.Icon
          return (
            <StatChip
              key={mk}
              icon={<Icon size={11} />}
              label={info.label}
              value={count}
              color={info.color}
            />
          )
        })}
        {run.size && (
          <StatChip icon={<ScrollText size={11} />} label="Size" value={run.size} color="#f59e0b" />
        )}
      </div>
    </div>
  )
}

function StatChip({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: `rgba(${hexToRgb(color)}, 0.08)`,
      border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
      borderRadius: 20,
      padding: '4px 10px',
      fontSize: 11,
      color,
    }}>
      {icon}
      <span style={{ fontWeight: 600 }}>{value}</span>
      <span style={{ color: '#64748b', fontSize: 10 }}>{label}</span>
    </div>
  )
}

function hexToRgb(hex) {
  // fallback for named css colors — just return a safe default
  const map = {
    '#34d399': '52,211,153',
    '#38bdf8': '56,189,248',
    '#a78bfa': '167,139,250',
    '#f59e0b': '245,158,11',
    '#fb923c': '251,146,60',
    '#94a3b8': '148,163,184',
    '#22d3ee': '34,211,238',
  }
  return map[hex] || '255,255,255'
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function LogsPage() {
  const { persona } = useMigration()
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState(null)
  const [expandedDdl, setExpandedDdl] = useState({})

  const calculateRunProgress = (selectedItems, logEvents, isFinished) => {
    if (isFinished) return 100
    const itemNames = selectedItems && selectedItems.length > 0
      ? selectedItems.map(item => item.name)
      : Array.from(new Set(logEvents.map(e => e.item).filter(Boolean)))

    if (itemNames.length === 0) {
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

    const pct = totalProgress / itemNames.length
    return Math.min(Math.round(pct), 100)
  }
  const [generatingGraph, setGeneratingGraph] = useState(false)
  const [graphMessage, setGraphMessage] = useState(null)

  const fetchRuns = () => {
    setLoading(true)
    const url = persona?.id
      ? `${API}/api/v1/replication/recent-runs?persona_id=${persona.id}`
      : `${API}/api/v1/replication/recent-runs`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const fetched = data.runs || []
        setRuns(fetched)
        setLoading(false)
        if (fetched.length > 0) {
          if (selectedRun) {
            const still = fetched.find(r => r.job_id === selectedRun.job_id)
            if (still) { setSelectedRun(still); return }
          }
          setSelectedRun(fetched[0])
        }
      })
      .catch(err => {
        console.error('Error loading recent runs:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRuns()
  }, [persona?.id])

  const toggleDdl = (key) => {
    setExpandedDdl(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddToKnowledgeGraph = () => {
    if (!selectedRun) return
    setGeneratingGraph(true)
    setGraphMessage(null)

    fetch(`${API}/api/v1/replication/${selectedRun.job_id}/knowledge-graph`, {
      method: 'POST'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate graph')
        return res.json()
      })
      .then(data => {
        setGeneratingGraph(false)
        setGraphMessage({ type: 'success', text: 'Knowledge Graph generated successfully!' })

        // Update local state and trigger refresh
        if (selectedRun) {
          selectedRun.kg_generated = 1;
          fetchRuns();
        }
        setTimeout(() => setGraphMessage(null), 4000)
      })
      .catch(err => {
        console.error(err)
        setGeneratingGraph(false)
        setGraphMessage({ type: 'error', text: 'Error generating graph.' })
        setTimeout(() => setGraphMessage(null), 4000)
      })
  }

  // Group logs into per-item blocks
  const itemGroups = useMemo(() => {
    if (!selectedRun?.logs) return []
    return groupLogsByItem(selectedRun.logs)
  }, [selectedRun])

  // Separate meta-group (global events) from item groups
  const metaLogs = useMemo(() => {
    return (selectedRun?.logs || []).filter(l => {
      const s = l.step || l.status || ''
      return s === 'STARTED' || s === 'COMPLETED' || s === 'ITEM_STARTED' || s === 'ITEM_COMPLETED' || s === 'ITEM_FAILED'
    })
  }, [selectedRun])

  return (
    <main style={{
      flex: 1,
      maxWidth: 1280,
      width: '100%',
      margin: '0 auto',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          Audit &amp; Migration Logs
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Review migration runs — source &amp; target, which tables or stored procedures were migrated, and the operation mode used.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, flex: 1, minHeight: 'calc(100vh - 220px)' }}>

        {/* ── Left: Runs list ── */}
        <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Migration Runs</span>
            </div>
            <button
              onClick={fetchRuns}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '75vh', paddingRight: 4 }}>
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
                    onClick={() => { setSelectedRun(r); setExpandedDdl({}); setGraphMessage(null); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius)',
                      border: isSelected ? '1px solid var(--border-glow)' : '1px solid var(--border-dim)',
                      background: isSelected ? 'var(--bg-active)' : 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Connection name + status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                        wordBreak: 'break-all', lineHeight: 1.3,
                      }}>
                        {r.connection_name || 'default_connection'}
                      </span>
                      <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                        {r.status}
                      </Badge>
                    </div>

                    {/* Source → Target */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: isSelected ? '#818cf8' : 'var(--text-secondary)',
                        background: 'rgba(99,102,241,0.1)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        {r.source}
                      </span>
                      <ArrowRight size={9} style={{ color: 'var(--text-dim)' }} />
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: isSelected ? '#22d3ee' : 'var(--text-secondary)',
                        background: 'rgba(34,211,238,0.08)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        {r.target}
                      </span>
                    </div>

                    {/* Tables count + date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-dim)' }}>
                      <span>{r.tables || 0} objects</span>
                      <span>{new Date(r.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* ── Right: Detail view ── */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          {selectedRun ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 14 }}>

              {/* Header */}
              <div style={{ borderBottom: '1px solid var(--border-dim)', paddingBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {selectedRun.connection_name || 'default_connection'}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span><strong>Job ID:</strong> {selectedRun.job_id}</span>
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
                    Lineage Graph
                  </Btn>
                </a>
              </div>

              {/* Migration summary: source→target + stats */}
              <MigrationSummary run={selectedRun} groups={itemGroups} />

              {/* Console: per-item grouped logs */}
              <div style={{
                flex: 1,
                background: '#0a1628',
                borderRadius: 10,
                border: '1px solid #1e293b',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 12,
                color: '#e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}>
                {/* Console title bar */}
                <div style={{
                  color: '#64748b',
                  borderBottom: '1px solid #1e293b',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Terminal size={13} />
                    <span style={{ fontSize: 11, letterSpacing: '0.08em' }}>MIGRATION EXECUTION LOG</span>
                  </div>
                  <span style={{ fontSize: 10 }}>
                    {itemGroups.filter(g => g.itemName).length} object(s)
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}>
                  {(!selectedRun.logs || selectedRun.logs.length === 0) ? (
                    <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px 0', fontSize: 12 }}>
                      No detailed step execution logs found for this run.
                    </div>
                  ) : itemGroups.length === 0 ? (
                    // Flat (no item grouping) — render raw
                    selectedRun.logs.map((log, idx) => (
                      <StepRow
                        key={idx}
                        idx={`flat-${idx}`}
                        log={log}
                        expandedDdl={expandedDdl}
                        onToggleDdl={toggleDdl}
                      />
                    ))
                  ) : (
                    itemGroups.map((group, gi) =>
                      group.itemName ? (
                        <ItemGroup
                          key={gi}
                          group={group}
                          globalDdlState={expandedDdl}
                          onToggleDdl={toggleDdl}
                          defaultOpen={gi === 0}
                        />
                      ) : (
                        /* top-level meta steps (STARTED / COMPLETED) */
                        group.steps.map((log, li) => (
                          <StepRow
                            key={`meta-${li}`}
                            idx={`meta-${li}`}
                            log={log}
                            expandedDdl={expandedDdl}
                            onToggleDdl={toggleDdl}
                          />
                        ))
                      )
                    )
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: 12 }}>
              <HelpCircle size={48} strokeWidth={1} />
              <span>Select a migration run from the list to view its audit log.</span>
            </div>
          )}
        </Card >
      </div >
    </main >
  )
}
