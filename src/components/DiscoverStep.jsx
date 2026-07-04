import { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Cloud, RefreshCw, Table2, Workflow, Zap, Shield, Info, ChevronRight } from 'lucide-react'
import { Card, Badge, Btn, Spinner } from './UI.jsx'
import { useMigration } from '../context/MigrationContext.jsx'

export default function DiscoverStep() {
  const { send, srcCfg, tgtCfg, setSourceResources, setTargetResources, setStep } = useMigration()
  const [srcResources, setSrcResources] = useState(null)
  const [tgtResources, setTgtResources] = useState(null)
  const [srcInsights, setSrcInsights] = useState(null)
  const [tgtInsights, setTgtInsights] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('source')

  const hasStartedRef = useRef(false)

  const startScan = useCallback(() => {
    setScanning(true); setSrcResources(null); setTgtResources(null)
    send('discover_source', { platform: srcCfg.platform || 'teradata', ...srcCfg })
    setTimeout(() => send('discover_target', { platform: tgtCfg.platform || 'databricks', ...tgtCfg }), 800)
  }, [send, srcCfg, tgtCfg])

  useEffect(() => {
    window.__discoveryHandler = (msg) => {
      if (msg.type === 'discovery_result') {
        if (msg.environment === 'source') { setSrcResources(msg.resources); setSrcInsights(msg.insights) }
        if (msg.environment === 'target') { setTgtResources(msg.resources); setTgtInsights(msg.insights); setScanning(false) }
      }
    }

    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      startScan()
    }
  }, [startScan])

  const handleProceed = () => {
    setSourceResources(srcResources)
    setTargetResources(tgtResources)
    setStep(2)
  }

  const StatPill = ({ label, value, color = 'cyan' }) => (
    <div style={{ textAlign: 'center', padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: `var(--accent-${color})`, fontFamily: 'var(--font-display)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{label}</div>
    </div>
  )

  const ResourceTable = ({ resources }) => {
    if (!resources) return null
    const datasets = resources.datasets || []
    const pipelines = resources.pipelines || []
    return (
      <div>
        {datasets.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Table2 size={11} /> Datasets ({datasets.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Type', 'Schema', 'Rows', 'Size'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {datasets.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '6px 8px' }}><Badge color={d.type === 'VIEW' ? 'violet' : d.type === 'PROCEDURE' ? 'amber' : 'cyan'} size="sm">{d.type}</Badge></td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{d.schema || d.catalog || '—'}</td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{d.row_count?.toLocaleString() || '—'}</td>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{d.size_mb ? `${d.size_mb}MB` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pipelines.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Workflow size={11} /> Pipelines ({pipelines.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Type', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-dim)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {pipelines.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text-secondary)' }}>{p.type}</td>
                    <td style={{ padding: '6px 8px' }}><Badge color={p.status === 'ACTIVE' || p.status === 'RUNNING' ? 'green' : 'gray'}>{p.status || '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const InsightPanel = ({ insights }) => {
    if (!insights) return null
    return (
      <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--accent-violet)', fontWeight: 500 }}>
          <Zap size={12} /> AI Analysis
        </div>
        <p style={{ marginBottom: 8 }}>{insights.narrative}</p>
        {insights.report?.datasets?.quality_flags?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {insights.report.datasets.quality_flags.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {f.flag === 'CONTAINS_PII' ? <Shield size={11} style={{ color: 'var(--accent-red)' }} /> : <Info size={11} style={{ color: 'var(--accent-amber)' }} />}
                <span style={{ color: f.flag === 'CONTAINS_PII' ? 'var(--accent-red)' : 'var(--accent-amber)', fontWeight: 500 }}>{f.dataset}</span>
                <span style={{ color: 'var(--text-muted)' }}>{f.flag}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const bothDone = srcResources && tgtResources
  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Environment Discovery</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Scan both platforms, catalog all resources, generate AI insights</div>
        </div>
        {scanning ? (
          <Btn disabled={true} variant="primary" icon={<Spinner size={11} />}>
            Scanning...
          </Btn>
        ) : srcResources ? (
          <Btn onClick={startScan} variant="primary" icon={<RefreshCw size={11} />}>
            Re-scan
          </Btn>
        ) : null}
      </div>

      {(srcResources || tgtResources) && (
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['source', 'target'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: '6px 16px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
                background: activeTab === t ? 'var(--bg-active)' : 'transparent',
                borderColor: activeTab === t ? 'var(--border-bright)' : 'var(--border-dim)',
                color: activeTab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                {t === 'source' ? <Database size={11} /> : (tgtCfg?.platform === 'snowflake' ? <Database size={11} /> : <Cloud size={11} />)}
                {t === 'source' ? (srcCfg?.platform === 'mysql' ? 'MySQL Source' : 'Teradata Source') : `${tgtCfg?.platform === 'snowflake' ? 'Snowflake' : 'Databricks'} Target`}
                {t === 'source' && srcResources && <Badge color="green" size="sm">✓</Badge>}
                {t === 'target' && tgtResources && <Badge color="green" size="sm">✓</Badge>}
              </button>
            ))}
          </div>

          {activeTab === 'source' && srcResources && (
            <Card className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
                <StatPill label="Datasets" value={srcResources.summary?.total_datasets || 0} color="cyan" />
                <StatPill label="Pipelines" value={srcResources.summary?.total_pipelines || 0} color="violet" />
                <StatPill label="Views" value={srcResources.summary?.total_views || 0} color="amber" />
                <StatPill label="Size GB" value={srcResources.summary?.total_size_gb || 0} color="green" />
                <StatPill label="Total Rows" value={((srcResources.datasets || []).reduce((s, d) => s + (d.row_count || 0), 0) / 1e6).toFixed(1) + 'M'} color="cyan" />
              </div>
              <ResourceTable resources={srcResources} />
              <InsightPanel insights={srcInsights} />
            </Card>
          )}
          {activeTab === 'target' && tgtResources && (
            <Card className="animate-fade">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                <StatPill label="Datasets" value={tgtResources.summary?.total_datasets || 0} color="violet" />
                <StatPill label="Pipelines" value={tgtResources.summary?.total_pipelines || 0} color="violet" />
                <StatPill label="Size GB" value={tgtResources.summary?.total_size_gb || 0} color="green" />
                <StatPill label="Notebooks" value={tgtResources.summary?.total_notebooks || 0} color="amber" />
              </div>
              <ResourceTable resources={tgtResources} />
              <InsightPanel insights={tgtInsights} />
            </Card>
          )}
        </div>
      )}

      {bothDone && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <Btn onClick={handleProceed} variant="primary" size="lg" icon={<ChevronRight size={15} />}>
            Proceed to Resource Selection
          </Btn>
        </div>
      )}
    </div>
  )
}
