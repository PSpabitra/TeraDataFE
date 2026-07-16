import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Server, Cloud, AlertCircle, Check, ChevronRight } from 'lucide-react'
import { getConnections, saveConnection } from '../../api/connections'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'
import Btn from '../common/Btn'
import Card from '../common/Card'
import { SOURCES, TARGETS } from '../../config/platforms'
import { useMigration } from '../../context/MigrationContext'

const ALLOWED_TARGETS = {
  datastage: ['databricks'],
  teradata: ['databricks'],
  mysql: ['databricks', 'sqlserver'],
  mssql: ['databricks', 'mysql']
}

/**
 * ConnectStep component.
 * @returns {React.ReactElement}
 */
const ConnectStep = () => {
  const { send, wsStatus, setStep, persona } = useMigration()
  const onComplete = () => setStep(1)
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
      getConnections(persona.id)
        .then(data => {
          if (data.credentials) {
            const credsMap = {}
            data.credentials.forEach(c => {
              credsMap[c.platform] = c
            })
            setSavedCreds(credsMap)

            const defaultSourcePlatform = Object.keys(SOURCES)[0] || 'teradata'
            const c = credsMap[defaultSourcePlatform] || {}
            setSrc(p => ({
              ...p,
              host: c.host || '',
              username: c.username || '',
              password: c.password || '',
              database: c.database_name || '',
              port: String(c.port || SOURCES[defaultSourcePlatform]?.defaultPort || '')
            }))

            const activeTargetCred = data.credentials.find(c => TARGETS[c.platform])
            if (activeTargetCred) {
              const targetPlatform = activeTargetCred.platform
              const allowed = ALLOWED_TARGETS[defaultSourcePlatform] || []
              const finalTargetPlatform = allowed.includes(targetPlatform) ? targetPlatform : (allowed[0] || targetPlatform)
              const tCred = credsMap[finalTargetPlatform] || {}
              setTgt({
                platform: finalTargetPlatform,
                host: tCred.host || '',
                token: tCred.token || '',
                cluster_id: tCred.cluster_id || '',
                warehouse_id: tCred.warehouse_id || '',
                username: tCred.username || '',
                password: tCred.password || '',
                database: tCred.database_name || '',
                schema: tCred.schema || (finalTargetPlatform === 'snowflake' ? 'PUBLIC' : finalTargetPlatform === 'sqlserver' ? 'dbo' : '')
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
      port: String(cred.port || SOURCES[platform]?.defaultPort || '')
    })
    setSrcResult(null)

    const allowed = ALLOWED_TARGETS[platform] || []
    if (allowed.length > 0 && !allowed.includes(tgt.platform)) {
      handlePlatformChange(allowed[0])
    }
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
      schema: cred.schema || (platform === 'snowflake' ? 'PUBLIC' : platform === 'sqlserver' ? 'dbo' : '')
    })
    setTgtResult(null)
  }

  const handleMsg = useCallback((msg) => {
    if (msg.type === 'connection_result') {
      if (msg.connection_type === 'source') {
        setSrcResult(msg.result); setSrcLoading(false)
        if (msg.result.status === 'connected' && persona?.id) {
          const defaultPort = SOURCES[srcRef.current.platform]?.defaultPort || 1025
          const payload = {
            ...srcRef.current,
            port: parseInt(srcRef.current.port) || defaultPort
          }
          saveConnection(persona.id, payload).then(() => {
            setSavedCreds(prev => ({ ...prev, [srcRef.current.platform]: srcRef.current }))
          }).catch(console.error)
        }
      }
      if (msg.connection_type === 'target') {
        setTgtResult(msg.result); setTgtLoading(false)
        if (msg.result.status === 'connected' && persona?.id) {
          saveConnection(persona.id, tgtRef.current).then(() => {
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
    const defaultPort = SOURCES[src.platform]?.defaultPort || 1025
    send('connect_source', {
      ...src,
      port: parseInt(src.port) || defaultPort
    })
  }
  const connectTgt = () => {
    setTgtLoading(true); setTgtResult(null)
    send('connect_target', { ...tgt })
  }

  const bothConnected = srcResult?.status === 'connected' && tgtResult?.status === 'connected'

  const handleSrcFieldChange = (field, value) => {
    setSrc(prev => ({ ...prev, [field]: value }))
  }

  const handleTgtFieldChange = (field, value) => {
    setTgt(prev => ({ ...prev, [field]: value }))
  }

  const isDatabaseIcon = TARGETS[tgt.platform]?.iconType === 'database'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="animate-fade">
      {/* Source */}
      <Card glow={srcResult?.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ padding: 7, background: 'rgba(56,189,248,0.1)', borderRadius: 'var(--radius)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Source Platform</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {src.platform ? (SOURCES[src.platform]?.description || 'Source Database') : 'Source Database'}
            </div>
          </div>
          {srcResult && <Badge color={srcResult.status === 'connected' ? 'green' : 'red'} style={{ marginLeft: 'auto' }}>
            {srcResult.status}
          </Badge>}
        </div>

        {/* Source Platform Toggle buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {Object.values(SOURCES).map(platform => {
            const isSelected = src.platform === platform.id;
            const shouldBlur = srcLoading && !isSelected;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={shouldBlur ? undefined : () => handleSourcePlatformChange(platform.id)}
                style={{
                  flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                  borderColor: isSelected ? 'var(--border-bright)' : 'var(--border-dim)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)', 
                  cursor: shouldBlur ? 'not-allowed' : 'pointer',
                  opacity: shouldBlur ? 0.35 : 1,
                  pointerEvents: shouldBlur ? 'none' : 'auto',
                  transition: 'all 0.15s'
                }}
              >
                {platform.label}
              </button>
            )
          })}
        </div>

        {/* Render Source Connection Form dynamically */}
        {(() => {
          const SrcForm = SOURCES[src.platform]?.formComponent
          return SrcForm ? <SrcForm values={src} onChange={handleSrcFieldChange} /> : null
        })()}

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
          variant={srcResult?.status === 'connected' ? 'success' : 'primary'} size="sm"
          icon={srcLoading ? <Spinner size={11} /> : <Server size={11} />}>
          {srcLoading ? 'Connecting...' : srcResult?.status === 'connected' ? 'Reconnect' : `Connect ${SOURCES[src.platform]?.label || ''}`}
        </Btn>
      </Card>

      {/* Target */}
      <Card glow={tgtResult?.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            padding: 7,
            background: isDatabaseIcon ? 'rgba(56,189,248,0.1)' : 'rgba(139,92,246,0.1)',
            borderRadius: 'var(--radius)',
            border: `1px solid ${isDatabaseIcon ? 'rgba(56,189,248,0.2)' : 'rgba(139,92,246,0.2)'}`
          }}>
            {isDatabaseIcon ? (
              <Database size={16} style={{ color: 'var(--accent-cyan)' }} />
            ) : (
              <Cloud size={16} style={{ color: 'var(--accent-violet)' }} />
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Target Platform</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              {tgt.platform ? (TARGETS[tgt.platform]?.description || 'Target Platform') : 'Target Platform'}
            </div>
          </div>
          {tgtResult && <Badge color={tgtResult.status === 'connected' ? 'green' : 'red'} style={{ marginLeft: 'auto' }}>
            {tgtResult.status}
          </Badge>}
        </div>

        {/* Target Platform Toggle buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {Object.values(TARGETS).map(platform => {
            const isSelected = tgt.platform === platform.id;
            const isAllowed = (ALLOWED_TARGETS[src.platform] || []).includes(platform.id);
            const shouldBlur = (tgtLoading && !isSelected) || !isAllowed;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={shouldBlur ? undefined : () => handlePlatformChange(platform.id)}
                style={{
                  flex: 1, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid', fontSize: 11, fontWeight: 500,
                  background: isSelected ? 'var(--bg-active)' : 'transparent',
                  borderColor: isSelected ? 'var(--border-bright)' : 'var(--border-dim)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  cursor: shouldBlur ? 'not-allowed' : 'pointer',
                  opacity: shouldBlur ? 0.35 : 1,
                  pointerEvents: shouldBlur ? 'none' : 'auto',
                  transition: 'all 0.15s'
                }}
              >
                {platform.label}
              </button>
            )
          })}
        </div>

        {/* Render Target Connection Form dynamically */}
        {(() => {
          const TgtForm = TARGETS[tgt.platform]?.formComponent
          return TgtForm ? <TgtForm values={tgt} onChange={handleTgtFieldChange} /> : null
        })()}

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
          variant={tgtResult?.status === 'connected' ? 'success' : (isDatabaseIcon ? 'primary' : 'violet')} size="sm"
          icon={tgtLoading ? <Spinner size={11} /> : (isDatabaseIcon ? <Database size={11} /> : <Cloud size={11} />)}>
          {tgtLoading ? 'Connecting...' : tgtResult?.status === 'connected' ? 'Reconnect' : `Connect ${TARGETS[tgt.platform]?.label || ''}`}
        </Btn>
      </Card>

      {bothConnected && (
        <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', paddingTop: 4 }} className="animate-fade">
          <Btn onClick={onComplete} variant="primary" size="lg" icon={<ChevronRight size={15} />}>
            Both platforms connected — Proceed to Discovery
          </Btn>
        </div>
      )}
    </div>
  )
}

export default ConnectStep
