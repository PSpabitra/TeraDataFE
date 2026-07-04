import { useState, useEffect } from 'react'
import { Workflow, Table2, Shield, BarChart2, AlertTriangle, CheckCircle, Info, Check, ChevronRight } from 'lucide-react'
import { Btn, Card, Badge, Spinner, SectionTitle } from './UI.jsx'
import { useMigration } from '../context/MigrationContext.jsx'

export default function AnalyzeStep() {
  const { send, sourceResources, targetResources, setSelectedResources, gapAnalysis, setGapAnalysis, setStep } = useMigration()
  const [selected, setSelected] = useState([])
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    window.__insightHandler = (msg) => {
      if (msg.type === 'migration_insights') {
        setGapAnalysis(msg.result)
        setAnalyzing(false)
      }
    }
  }, [])

  const allItems = [
    ...(sourceResources?.datasets || []).map(d => ({ ...d, kind: 'dataset' })),
    ...(sourceResources?.pipelines || []).map(p => ({ ...p, kind: 'pipeline' }))
  ]

  const toggle = (item) => {
    setSelected(prev => prev.find(s => s.id === item.id)
      ? prev.filter(s => s.id !== item.id)
      : [...prev, item])
  }

  const analyze = () => {
    if (!selected.length) return
    setAnalyzing(true); setGapAnalysis(null)
    send('get_insights', {
      source_resources: sourceResources,
      target_resources: targetResources,
      selected_resources: selected.map(s => ({ name: s.name, type: s.kind === 'pipeline' ? 'pipeline' : 'dataset' }))
    })
  }

  const handleProceed = () => {
    setSelectedResources(selected)
    setGapAnalysis(gapAnalysis)
    setStep(3)
  }

  const riskColor = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' }

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Selector */}
        <div>
          <SectionTitle
            children="Select Resources to Migrate"
            sub={`${selected.length} of ${allItems.length} selected`}
          />
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <Btn size="sm" variant="ghost" onClick={() => setSelected(allItems)}>Select all</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Btn>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 380, overflowY: 'auto' }}>
            {allItems.map(item => {
              const sel = !!selected.find(s => s.id === item.id)
              const isPII = item.tags?.includes('PII')
              return (
                <div key={item.id} onClick={() => toggle(item)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 'var(--radius)', border: '1px solid', cursor: 'pointer',
                  borderColor: sel ? 'var(--accent-cyan)' : 'var(--border-dim)',
                  background: sel ? 'var(--cyan-dim)' : 'var(--bg-surface)',
                  transition: 'all 0.15s'
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, border: '1px solid', flexShrink: 0,
                    borderColor: sel ? 'var(--accent-cyan)' : 'var(--border-mid)',
                    background: sel ? 'var(--accent-cyan)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {sel && <Check size={10} style={{ color: '#080a0e' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.kind === 'pipeline' ? <Workflow size={11} style={{ color: 'var(--accent-violet)' }} /> : <Table2 size={11} style={{ color: 'var(--accent-cyan)' }} />}
                      {item.name}
                      {isPII && <Shield size={10} style={{ color: 'var(--accent-red)' }} />}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      {item.schema || item.type} {item.row_count ? `· ${item.row_count.toLocaleString()} rows` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(item.tags || []).slice(0, 2).map(t => <Badge key={t} color="gray" size="sm">{t}</Badge>)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <Btn onClick={analyze} disabled={!selected.length || analyzing} variant="primary"
              icon={analyzing ? <Spinner size={11} /> : <BarChart2 size={11} />}>
              {analyzing ? 'Analyzing...' : 'Run Gap Analysis'}
            </Btn>
          </div>
        </div>

        {/* Gap Analysis Results */}
        <div>
          <SectionTitle children="Migration Gap Analysis" sub="AI-powered readiness assessment" />
          {!gapAnalysis && !analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', gap: 10 }}>
              <BarChart2 size={28} style={{ opacity: 0.3 }} />
              <span style={{ fontSize: 12 }}>Select resources and run analysis</span>
            </div>
          )}
          {analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <Spinner size={24} />
              <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Running AI gap analysis via Mistral...</span>
            </div>
          )}
          {gapAnalysis && (
            <div className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  ['New Creates', gapAnalysis.gap_analysis?.new_creates || 0, 'cyan'],
                  ['Incremental', gapAnalysis.gap_analysis?.incremental_updates || 0, 'green'],
                  ['High Risk', gapAnalysis.gap_analysis?.high_risk_items || 0, 'red'],
                  ['Total MB', Math.round(gapAnalysis.gap_analysis?.total_size_mb || 0), 'amber'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: `var(--accent-${c})`, fontFamily: 'var(--font-display)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Item rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {(gapAnalysis.gap_analysis?.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.replication_mode?.replace(/_/g, ' ')}</div>
                    </div>
                    <Badge color={item.exists_in_target ? 'green' : 'cyan'}>{item.exists_in_target ? 'UPDATE' : 'CREATE'}</Badge>
                    <Badge color={riskColor[item.risk] || 'gray'}>{item.risk}</Badge>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.estimated_duration_min}m</span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {(gapAnalysis.recommendations || []).length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {gapAnalysis.recommendations.map((r, i) => (
                    <div key={i} style={{
                      padding: '7px 10px', borderRadius: 'var(--radius)',
                      border: '1px solid', display: 'flex', gap: 8, alignItems: 'flex-start',
                      borderColor: r.type === 'WARNING' ? 'rgba(239,68,68,0.2)' : r.type === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)',
                      background: r.type === 'WARNING' ? 'var(--red-dim)' : r.type === 'SUCCESS' ? 'var(--green-dim)' : 'var(--cyan-dim)',
                    }}>
                      {r.type === 'WARNING' ? <AlertTriangle size={11} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 1 }} />
                        : r.type === 'SUCCESS' ? <CheckCircle size={11} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 1 }} />
                          : <Info size={11} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: 1 }} />}
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <Btn onClick={handleProceed} variant="primary" size="lg" icon={<ChevronRight size={14} />}>
                  Start Replication
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
