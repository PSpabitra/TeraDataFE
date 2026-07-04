import { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Server, Cloud, AlertCircle, Check, ChevronRight } from 'lucide-react'
import { Card, Badge, Field, Btn, Spinner } from './UI.jsx'
import { API } from '../constants.js'
import { useMigration } from '../context/MigrationContext.jsx'

export default function ConnectStep() {
  const { send, wsStatus, setStep, persona } = useMigration()
  const [src, setSrc] = useState({ platform: 'teradata', host: '', username: '', password: '', database: '', port: '1025' })
  const [tgt, setTgt] = useState({ platform: 'databricks', host: '', token: '', cluster_id: '', warehouse_id: '', username: '', password: '', database: '', schema: 'PUBLIC' })
  const [savedCreds, setSavedCreds] = useState({})
  const [srcResult, setSrcResult] = useState(null)
  const [tgtResult, setTgtResult] = useState(null)
  const [srcLoading, setSrcLoading] = useState(false)
  const [tgtLoading, setTgtLoading] = useState(false)

  const srcRef = useRef(src)
  const tgtRef = useRef(tgt)
  useEffect(() => { srcRef.current = src; tgtRef.current = tgt }, [src, tgt])

  useEffect(() => {
    if (persona?.id) {
      fetch(`${API}/api/v1/connections/?persona_id=${persona.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.credentials) {
            const credsMap = {}
            data.credentials.forEach(c => {
              credsMap[c.platform] = c
            })
            setSavedCreds(credsMap)

            const tdCred = data.credentials.find(c => c.platform === 'teradata')
            const mysqlCred = data.credentials.find(c => c.platform === 'mysql')

            if (tdCred) {
              setSrc({
                platform: 'teradata',
                host: tdCred.host || '',
                username: tdCred.username || '',
                password: tdCred.password || '',
                database: tdCred.database_name || '',
                port: tdCred.port || '1025'
              })
            } else if (mysqlCred) {
              setSrc({
                platform: 'mysql',
                host: mysqlCred.host || '',
                username: mysqlCred.username || '',
                password: mysqlCred.password || '',
                database: mysqlCred.database_name || '',
                port: mysqlCred.port || '3306'
              })
            }

            const dbCred = data.credentials.find(c => c.platform === 'databricks')
            const sfCred = data.credentials.find(c => c.platform === 'snowflake')
            if (dbCred) {
              setTgt({
                platform: 'databricks',
                host: dbCred.host || '',
                token: dbCred.token || '',
                cluster_id: dbCred.cluster_id || '',
                warehouse_id: dbCred.warehouse_id || '',
                username: '',
                password: '',
                database: ''
              })
            } else if (sfCred) {
              setTgt({
                platform: 'snowflake',
                host: sfCred.host || '',
                token: '',
                cluster_id: '',
                warehouse_id: sfCred.warehouse_id || '',
                username: sfCred.username || '',
                password: sfCred.password || '',
                database: sfCred.database_name || '',
                schema: sfCred.schema || 'PUBLIC'
              })
            }
          }
        }).catch(console.error)
    }
  }, [persona?.id])

  const handleSourcePlatformChange = (platform) => {
    const cred = savedCreds[platform] || {}
    setSrc({
      platform,
      host: cred.host || '',
      username: cred.username || '',
      password: cred.password || '',
      database: cred.database_name || '',
      port: cred.port || (platform === 'mysql' ? '3306' : '1025')
    })
    setSrcResult(null)
  }

  const handlePlatformChange = (platform) => {
    const cred = savedCreds[platform] || {}
    setTgt({
      platform,
      host: cred.host || '',
      token: cred.token || '',
      cluster_id: cred.cluster_id || '',
      warehouse_id: cred.warehouse_id || '',
      username: cred.username || '',
      password: cred.password || '',
      database: cred.database_name || '',
      schema: cred.schema || 'PUBLIC'
    })
    setTgtResult(null)
  }

  const handleMsg = useCallback((msg) => {
    if (msg.type === 'connection_result') {
      if (msg.connection_type === 'source') {
        setSrcResult(msg.result); setSrcLoading(false)
        if (msg.result.status === 'connected' && persona?.id) {
          fetch(`${API}/api/v1/connections/save?persona_id=${persona.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...srcRef.current, port: parseInt(srcRef.current.port) || (srcRef.current.platform === 'mysql' ? 3306 : 1025) })
          }).then(() => {
            setSavedCreds(prev => ({ ...prev, [srcRef.current.platform]: srcRef.current }))
          }).catch(console.error)
        }
      }
      if (msg.connection_type === 'target') {
        setTgtResult(msg.result); setTgtLoading(false)
        if (msg.result.status === 'connected' && persona?.id) {
          fetch(`${API}/api/v1/connections/save?persona_id=${persona.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tgtRef.current)
          }).then(() => {
            setSavedCreds(prev => ({ ...prev, [tgtRef.current.platform]: tgtRef.current }))
          }).catch(console.error)
        }
      }
    }
  }, [persona?.id])

  // Expose handler to parent
  useEffect(() => { window.__connectHandler = handleMsg }, [handleMsg])

  const connectSrc = () => {
    setSrcLoading(true); setSrcResult(null)
    send('connect_source', { ...src, port: parseInt(src.port) || (src.platform === 'mysql' ? 3306 : 1025) })
  }
  const connectTgt = () => {
    setTgtLoading(true); setTgtResult(null)
    send('connect_target', { ...tgt })
  }

  const bothConnected = srcResult?.status === 'connected' && tgtResult?.status === 'connected'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="animate-fade">
      {/* Source */}
      <Card glow={srcResult?.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            padding: 7,
            background: src.platform === 'mysql' ? 'rgba(139,92,246,0.1)' : 'rgba(56,189,248,0.1)',
            borderRadius: 'var(--radius)',
            border: `1px solid ${src.platform === 'mysql' ? 'rgba(139,92,246,0.2)' : 'rgba(56,189,248,0.2)'}`
          }}>
            <Database size={16} style={{ color: src.platform === 'mysql' ? 'var(--accent-violet)' : 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Source Platform</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {src.platform === 'mysql' ? 'MySQL Database' : 'Teradata Data Warehouse'}
            </div>
          </div>
          {srcResult && <Badge color={srcResult.status === 'connected' ? 'green' : 'red'} style={{ marginLeft: 'auto' }}>
            {srcResult.status}
          </Badge>}
        </div>

        {/* Source Platform Toggle buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => handleSourcePlatformChange('teradata')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: src.platform === 'teradata' ? 'var(--bg-active)' : 'transparent',
              borderColor: src.platform === 'teradata' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: src.platform === 'teradata' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Teradata
          </button>
          <button
            type="button"
            onClick={() => handleSourcePlatformChange('mysql')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: src.platform === 'mysql' ? 'var(--bg-active)' : 'transparent',
              borderColor: src.platform === 'mysql' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: src.platform === 'mysql' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            MySQL
          </button>
        </div>

        <Field label="Host" value={src.host} onChange={v => setSrc(p => ({ ...p, host: v }))} placeholder={src.platform === 'mysql' ? 'mysql-host.company.com' : 'teradata-host.company.com'} required />
        <Field label="Username" value={src.username} onChange={v => setSrc(p => ({ ...p, username: v }))} placeholder={src.platform === 'mysql' ? 'root' : 'dbc'} required />
        <Field label="Password" value={src.password} onChange={v => setSrc(p => ({ ...p, password: v }))} password required />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <Field label="Database" value={src.database} onChange={v => setSrc(p => ({ ...p, database: v }))} placeholder={src.platform === 'mysql' ? 'my_database' : 'PROD_DW'} />
          <Field label="Port" value={src.port} onChange={v => setSrc(p => ({ ...p, port: v }))} placeholder={src.platform === 'mysql' ? '3306' : '1025'} />
        </div>
        {srcResult?.status === 'failed' && (
          <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 11, color: 'var(--accent-red)' }}>
            <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />{srcResult.error}
          </div>
        )}
        {srcResult?.status === 'connected' && (
          <div style={{ padding: '10px 12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 500, marginBottom: 6 }}>
              <Check size={12} style={{ display: 'inline', marginRight: 5 }} />Connected successfully
            </div>
            {srcResult.metadata && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(srcResult.metadata).filter(([k]) => k !== 'database').map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}: </span>{String(v)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Btn onClick={connectSrc} disabled={srcLoading || !src.host || !src.username || wsStatus !== 'connected'}
          variant={srcResult?.status === 'connected' ? 'success' : (src.platform === 'mysql' ? 'violet' : 'primary')} size="sm"
          icon={srcLoading ? <Spinner size={11} /> : <Server size={11} />}>
          {srcLoading ? 'Connecting...' : srcResult?.status === 'connected' ? 'Reconnect' : `Connect ${src.platform === 'mysql' ? 'MySQL' : 'Teradata'}`}
        </Btn>
      </Card>

      {/* Target */}
      <Card glow={tgtResult?.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            padding: 7,
            background: tgt.platform === 'snowflake' ? 'rgba(56,189,248,0.1)' : 'rgba(139,92,246,0.1)',
            borderRadius: 'var(--radius)',
            border: `1px solid ${tgt.platform === 'snowflake' ? 'rgba(56,189,248,0.2)' : 'rgba(139,92,246,0.2)'}`
          }}>
            {tgt.platform === 'snowflake' ? (
              <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
            ) : (
              <Cloud size={16} style={{ color: 'var(--accent-violet)' }} />
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Target Platform</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {tgt.platform === 'snowflake' ? 'Snowflake Data Cloud' : 'Databricks Lakehouse'}
            </div>
          </div>
          {tgtResult && <Badge color={tgtResult.status === 'connected' ? 'green' : 'red'} style={{ marginLeft: 'auto' }}>
            {tgtResult.status}
          </Badge>}
        </div>

        {/* Target Platform Toggle buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => handlePlatformChange('databricks')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: tgt.platform === 'databricks' ? 'var(--bg-active)' : 'transparent',
              borderColor: tgt.platform === 'databricks' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: tgt.platform === 'databricks' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Databricks
          </button>
          <button
            type="button"
            onClick={() => handlePlatformChange('snowflake')}
            style={{
              flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
              background: tgt.platform === 'snowflake' ? 'var(--bg-active)' : 'transparent',
              borderColor: tgt.platform === 'snowflake' ? 'var(--border-bright)' : 'var(--border-dim)',
              color: tgt.platform === 'snowflake' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Snowflake
          </button>
        </div>

        {tgt.platform === 'databricks' ? (
          <>
            <Field label="Workspace URL" value={tgt.host} onChange={v => setTgt(p => ({ ...p, host: v }))} placeholder="https://adb-xxx.azuredatabricks.net" required />
            <Field label="Access Token" value={tgt.token} onChange={v => setTgt(p => ({ ...p, token: v }))} password placeholder="dapi..." required />
            <Field label="Cluster ID" value={tgt.cluster_id} onChange={v => setTgt(p => ({ ...p, cluster_id: v }))} placeholder="0101-123456-abc" />
            <Field label="SQL Warehouse ID" value={tgt.warehouse_id} onChange={v => setTgt(p => ({ ...p, warehouse_id: v }))} placeholder="abc123def" />
          </>
        ) : (
          <>
            <Field label="Account URL / Host" value={tgt.host} onChange={v => setTgt(p => ({ ...p, host: v }))} placeholder="xy12345.snowflakecomputing.com" required />
            <Field label="Username" value={tgt.username || ''} onChange={v => setTgt(p => ({ ...p, username: v }))} placeholder="snowflake_user" required />
            <Field label="Password" value={tgt.password || ''} onChange={v => setTgt(p => ({ ...p, password: v }))} password placeholder="••••••••" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Database" value={tgt.database || ''} onChange={v => setTgt(p => ({ ...p, database: v }))} placeholder="MY_DATABASE" />
              <Field label="Warehouse" value={tgt.warehouse_id || ''} onChange={v => setTgt(p => ({ ...p, warehouse_id: v }))} placeholder="COMPUTE_WH" />
            </div>
            <Field label="Schema" value={tgt.schema || 'PUBLIC'} onChange={v => setTgt(p => ({ ...p, schema: v }))} placeholder="PUBLIC" />
          </>
        )}

        {tgtResult?.status === 'failed' && (
          <div style={{ padding: '8px 12px', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', marginBottom: 12, fontSize: 11, color: 'var(--accent-red)' }}>
            <AlertCircle size={12} style={{ display: 'inline', marginRight: 6 }} />{tgtResult.error}
          </div>
        )}
        {tgtResult?.status === 'connected' && (
          <div style={{ padding: '10px 12px', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 500, marginBottom: 6 }}>
              <Check size={12} style={{ display: 'inline', marginRight: 5 }} />Connected successfully
            </div>
            {tgtResult.metadata && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(tgtResult.metadata).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                    {Array.isArray(v) ? v.slice(0, 2).join(', ') : String(v)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <Btn onClick={connectTgt} disabled={
          tgt.platform === 'databricks'
            ? (tgtLoading || !tgt.host || !tgt.token || wsStatus !== 'connected')
            : (tgtLoading || !tgt.host || !tgt.username || !tgt.password || wsStatus !== 'connected')
        }
          variant={tgtResult?.status === 'connected' ? 'success' : (tgt.platform === 'snowflake' ? 'primary' : 'violet')} size="sm"
          icon={tgtLoading ? <Spinner size={11} /> : (tgt.platform === 'snowflake' ? <Database size={11} /> : <Cloud size={11} />)}>
          {tgtLoading ? 'Connecting...' : tgtResult?.status === 'connected' ? 'Reconnect' : `Connect ${tgt.platform === 'databricks' ? 'Databricks' : 'Snowflake'}`}
        </Btn>
      </Card>

      {bothConnected && (
        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', paddingTop: 4 }} className="animate-fade">
          <Btn onClick={() => setStep(1)} variant="primary" size="lg" icon={<ChevronRight size={15} />}>
            Both platforms connected — Proceed to Discovery
          </Btn>
        </div>
      )}
    </div>
  )
}
