import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Database, Server, Cloud, AlertCircle, Check, ChevronRight } from 'lucide-react'
import { getConnections, saveConnection, getMigrationConnections, saveMigrationConnection } from '../../api/connections'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'
import Btn from '../common/Btn'
import Card from '../common/Card'
import { SOURCES, TARGETS } from '../../config/platforms'
import { useMigration } from '../../context/MigrationContext'

const ALLOWED_TARGETS = {
  teradata: ['databricks', 'snowflake'],
  mysql: ['databricks'],
  mssql: ['databricks', 'mysql'],
  postgres: ['databricks'],
  datastage: ['adf'],
  adf: ['databricks']
}

/**
 * ConnectStep component.
 * @returns {React.ReactElement}
 */
const ConnectStep = () => {
  const { send, wsStatus, setStep, persona, connectionName, setConnectionName, replicationMode, setReplicationMode } = useMigration()
  const onComplete = () => setStep(1)
  const [src, setSrc] = useState({ platform: 'teradata', host: '', username: '', password: '', database: '', port: '1025' })
  const [tgt, setTgt] = useState({ platform: 'databricks', host: '', token: '', cluster_id: '', warehouse_id: '', username: '', password: '', database: '', schema: 'PUBLIC' })
  const [savedCreds, setSavedCreds] = useState({})
  const [srcResult, setSrcResult] = useState(null)
  const [tgtResult, setTgtResult] = useState(null)
  const [srcLoading, setSrcLoading] = useState(false)
  const [tgtLoading, setTgtLoading] = useState(false)

  const [savedProfiles, setSavedProfiles] = useState([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const srcRef = useRef(src)
  const tgtRef = useRef(tgt)
  useEffect(() => { srcRef.current = src; tgtRef.current = tgt }, [src, tgt])

  const loadSavedProfiles = useCallback(() => {
    if (persona?.id) {
      setProfilesLoading(true)
      getMigrationConnections(persona.id)
        .then(data => {
          setSavedProfiles(data.connections || [])
          setProfilesLoading(false)
        })
        .catch(err => {
          console.error("Failed to load connection history:", err)
          setProfilesLoading(false)
        })
    }
  }, [persona?.id])

  useEffect(() => {
    loadSavedProfiles()
  }, [loadSavedProfiles])

  const loadProfileIntoWizard = (p) => {
    setConnectionName(p.connection_name)
    setReplicationMode(p.replication_mode)
    setSrc(p.source_config)
    setTgt(p.target_config)
    setSrcResult({ status: 'connected', metadata: { loaded: true } })
    setTgtResult({ status: 'connected', metadata: { loaded: true } })
  }

  const handleSaveProfile = () => {
    if (!connectionName || !persona?.id) return
    setSaveLoading(true)
    setSaveError(null)
    saveMigrationConnection({
      connection_name: connectionName,
      persona_id: persona.id,
      source_platform: src.platform,
      source_config: src,
      target_platform: tgt.platform,
      target_config: tgt,
      replication_mode: replicationMode
    })
      .then(() => {
        setSaveLoading(false)
        loadSavedProfiles()
      })
      .catch(err => {
        console.error(err)
        setSaveError(err.message || 'Failed to save connection profile')
        setSaveLoading(false)
      })
  }


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
        <Card style={{ gridColumn: '1 / -1', padding: '20px 24px', border: '1px solid var(--border-glow)', marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>Connection Profile & Replication Settings</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Connection Profile Name *</label>
                <input
                  type="text"
                  value={connectionName}
                  onChange={e => setConnectionName(e.target.value)}
                  placeholder="e.g. Prod MySQL to Databricks"
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Default Replication Mode *</label>
                <select
                  value={replicationMode}
                  onChange={e => setReplicationMode(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 'var(--radius)', padding: '7px 11px', color: 'var(--text-primary)', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="create_and_insert">Create and Insert (Truncate & Reload)</option>
                  <option value="incremental_update">Incremental Update (Merge / CDC)</option>
                </select>
              </div>
            </div>

            {saveError && (
              <div style={{ color: 'var(--accent-red)', fontSize: 11 }}>{saveError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
              <Btn onClick={handleSaveProfile} disabled={!connectionName || saveLoading} variant="violet" size="lg">
                {saveLoading ? 'Saving Profile...' : 'Save Connection Profile'}
              </Btn>

              <Btn onClick={onComplete} variant="primary" size="lg" icon={<ChevronRight size={15} />}>
                Proceed to Discovery
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Connection History List */}
      <Card style={{ gridColumn: '1 / -1', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
          <Database size={16} style={{ color: 'var(--text-secondary)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>Saved Connection Profiles</h2>
        </div>

        {profilesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <Spinner size={20} />
          </div>
        ) : savedProfiles.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0', fontSize: 12 }}>
            No saved connection profiles found. Complete both connections and enter a name to save.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['Profile Name', 'Source', 'Target', 'Default Mode', 'Created At', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savedProfiles.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{p.connection_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.source_platform}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.target_platform}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge color={p.replication_mode === 'incremental_update' ? 'amber' : 'green'} size="sm">
                        {p.replication_mode === 'incremental_update' ? 'Incremental' : 'Create & Insert'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Btn onClick={() => loadProfileIntoWizard(p)} size="sm" variant="ghost">Load Config</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ConnectStep
