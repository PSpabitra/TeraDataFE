import { useState } from 'react'
import { Database, Server, Key, Play, AlertCircle, CheckCircle, Search, Table2 } from 'lucide-react'

// Tiny primitives from App.jsx for consistency (if needed, but we can just use inline styles)
const Card = ({ children, style, glow }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid',
    borderColor: glow ? 'var(--border-glow)' : 'var(--border-dim)',
    borderRadius: 'var(--radius-lg)', padding: '18px 20px',
    boxShadow: glow ? 'var(--shadow-glow)' : 'var(--shadow-card)',
    ...style
  }}>{children}</div>
)

const Btn = ({ children, onClick, variant = 'primary', disabled = false, size = 'md', icon, style }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid',
    borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '0.03em',
    transition: 'all 0.15s ease', opacity: disabled ? 0.45 : 1,
    padding: size === 'sm' ? '5px 12px' : size === 'lg' ? '10px 22px' : '7px 16px',
    fontSize: size === 'sm' ? 11 : size === 'lg' ? 13 : 12,
  }
  const variants = {
    primary: { background: 'var(--accent-cyan)', color: '#080a0e', borderColor: 'var(--accent-cyan)' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-mid)' },
    danger: { background: 'var(--red-dim)', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' },
    success: { background: 'var(--green-dim)', color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.3)' },
    violet: { background: 'var(--violet-dim)', color: 'var(--accent-violet)', borderColor: 'rgba(139,92,246,0.3)' },
  }
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variants[variant], ...style }}>
      {icon && icon}{children}
    </button>
  )
}

const Field = ({ label, value, onChange, type = 'text', placeholder = '', required, password }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{
      display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5
    }}>
      {label}{required && <span style={{ color: 'var(--accent-red)', marginLeft: 3 }}>*</span>}
    </label>
    <input
      type={password ? 'password' : type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
        borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-primary)',
        fontSize: 12, outline: 'none', transition: 'border-color 0.15s',
        fontFamily: 'var(--font-mono)'
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-glow)'}
      onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
    />
  </div>
)

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{children}</h3>
    {sub && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{sub}</p>}
  </div>
)

export default function MssqlTestPage() {
  const [config, setConfig] = useState({
    host: 'localhost',
    username: 'sa',
    password: '',
    database: 'master',
    port: 1433
  })
  const [tableName, setTableName] = useState('')
  
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [discoveryResult, setDiscoveryResult] = useState(null)
  const [discoveryError, setDiscoveryError] = useState('')
  
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)
  const [previewError, setPreviewError] = useState('')

  const API_BASE = 'http://localhost:3006/api/v1'

  const handleDiscovery = async () => {
    setDiscoveryLoading(true)
    setDiscoveryError('')
    setDiscoveryResult(null)
    try {
      const res = await fetch(`${API_BASE}/test-mssql-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()
      if (data.status === 'failed' || data.status === 'error') {
         setDiscoveryError(data.error_message || data.error || 'Discovery failed')
      } else {
         setDiscoveryResult(data)
      }
    } catch (err) {
      setDiscoveryError(err.message)
    } finally {
      setDiscoveryLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!tableName) {
      setPreviewError('Please provide a table name')
      return
    }
    setPreviewLoading(true)
    setPreviewError('')
    setPreviewResult(null)
    try {
      const res = await fetch(`${API_BASE}/preview-mssql-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, table_name: tableName })
      })
      const data = await res.json()
      if (data.status === 'failed' || data.status === 'error') {
         setPreviewError(data.error_message || data.error || 'Preview failed')
      } else {
         setPreviewResult(data)
      }
    } catch (err) {
      setPreviewError(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: 800, width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
           <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>MSSQL Integration Test</h1>
           <p style={{ color: 'var(--text-secondary)' }}>Test discovery and preview flows for MSSQL source databases.</p>
        </header>

        <Card glow>
          <SectionTitle sub="Provide credentials to connect to your MSSQL Server instance">Connection Details</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Host" value={config.host} onChange={v => setConfig({...config, host: v})} />
            <Field label="Port" type="number" value={config.port} onChange={v => setConfig({...config, port: parseInt(v)})} />
            <Field label="Username" value={config.username} onChange={v => setConfig({...config, username: v})} />
            <Field label="Password" password value={config.password} onChange={v => setConfig({...config, password: v})} />
            <Field label="Database" value={config.database} onChange={v => setConfig({...config, database: v})} />
          </div>
        </Card>

        <Card>
           <SectionTitle sub="Test dataset and pipeline discovery capabilities">1. Run Discovery</SectionTitle>
           <Btn onClick={handleDiscovery} disabled={discoveryLoading} icon={<Search size={14} />}>
             {discoveryLoading ? 'Discovering...' : 'Test Discovery'}
           </Btn>
           
           {discoveryError && (
             <div style={{ marginTop: 16, padding: 12, background: 'var(--red-dim)', color: 'var(--accent-red)', borderRadius: 8, fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /> {discoveryError}
             </div>
           )}

           {discoveryResult && (
             <div style={{ marginTop: 16 }}>
               <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--accent-green)', marginBottom: 12 }}>
                 <CheckCircle size={14} /> <span style={{ fontSize: 13, fontWeight: 500 }}>Discovery Successful</span>
               </div>
               <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border-dim)' }}>
                 <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Found {discoveryResult.datasets_found?.length || 0} datasets and {discoveryResult.pipelines_found?.length || 0} pipelines.</p>
                 <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', overflowX: 'auto' }}>
                    {JSON.stringify(discoveryResult, null, 2)}
                 </pre>
               </div>
             </div>
           )}
        </Card>

        <Card>
           <SectionTitle sub="Test fetching sample data from a specific table">2. Preview Table</SectionTitle>
           <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
             <div style={{ flex: 1 }}>
               <Field label="Table Name (e.g. dbo.Users)" value={tableName} onChange={setTableName} />
             </div>
             <Btn onClick={handlePreview} disabled={previewLoading || !tableName} style={{ marginBottom: 12 }} icon={<Table2 size={14} />}>
               {previewLoading ? 'Fetching...' : 'Preview Data'}
             </Btn>
           </div>

           {previewError && (
             <div style={{ marginTop: 16, padding: 12, background: 'var(--red-dim)', color: 'var(--accent-red)', borderRadius: 8, fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /> {previewError}
             </div>
           )}

           {previewResult && (
             <div style={{ marginTop: 16 }}>
               <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--accent-green)', marginBottom: 12 }}>
                 <CheckCircle size={14} /> <span style={{ fontSize: 13, fontWeight: 500 }}>Preview Successful (Returned {previewResult.rows_returned} rows)</span>
               </div>
               <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border-dim)', overflowX: 'auto' }}>
                 {previewResult.data && previewResult.data.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                          {Object.keys(previewResult.data[0]).map(key => (
                            <th key={key} style={{ textAlign: 'left', padding: '8px', color: 'var(--text-secondary)' }}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.data.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} style={{ padding: '8px', color: 'var(--text-primary)' }}>{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No data returned.</p>
                 )}
               </div>
             </div>
           )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Btn variant="ghost" onClick={() => window.history.back()}>Back to Home</Btn>
        </div>

      </div>
    </div>
  )
}
