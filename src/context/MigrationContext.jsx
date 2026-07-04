import { createContext, useContext, useState, useCallback } from 'react'
import { useWebSocket } from '../useWebSocket.js'

const MigrationContext = createContext(null)

const CLIENT_ID = `ui-${Math.random().toString(36).slice(2, 9)}`

export function MigrationProvider({ children, persona, onLogout }) {
  const [step, setStep] = useState(0)
  const [agentStatuses, setAgentStatuses] = useState({})
  const [sourceResources, setSourceResources] = useState(null)
  const [targetResources, setTargetResources] = useState(null)
  const [selectedResources, setSelectedResources] = useState([])
  const [gapAnalysis, setGapAnalysis] = useState(null)
  const [replSummary, setReplSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [srcCfg, setSrcCfg] = useState({})
  const [tgtCfg, setTgtCfg] = useState({})

  // Route all incoming WS messages
  const handleMessage = useCallback((msg) => {
    // Agent status
    if (msg.type === 'agent_status') {
      setAgentStatuses(prev => ({ ...prev, [msg.agent]: msg.status }))
      return
    }
    // Route to current step handlers if active
    window.__connectHandler?.(msg)
    window.__discoveryHandler?.(msg)
    window.__insightHandler?.(msg)
    window.__replicationHandler?.(msg)
    // Audit log
    if (msg.type === 'agent_error') {
      setLogs(prev => [...prev, { event: 'AGENT_ERROR', ...msg, timestamp: new Date().toISOString() }])
    }
  }, [])

  const { send, status: wsStatus } = useWebSocket(CLIENT_ID, handleMessage)

  // Intercept send to capture configs
  const wrappedSend = useCallback((action, payload) => {
    if (action === 'connect_source') setSrcCfg(payload)
    if (action === 'connect_target') setTgtCfg(payload)
    // Log every action
    setLogs(prev => [...prev, { event: `WS_SEND:${action}`, timestamp: new Date().toISOString(), ...Object.fromEntries(Object.entries(payload).filter(([k]) => !['password', 'token'].includes(k))) }])
    return send(action, payload)
  }, [send])

  const restartMigration = useCallback(() => {
    setStep(0)
    setLogs([])
    setSourceResources(null)
    setTargetResources(null)
    setAgentStatuses({})
    setSelectedResources([])
    setGapAnalysis(null)
    setReplSummary(null)
  }, [])

  const value = {
    step,
    setStep,
    agentStatuses,
    setAgentStatuses,
    sourceResources,
    setSourceResources,
    targetResources,
    setTargetResources,
    selectedResources,
    setSelectedResources,
    gapAnalysis,
    setGapAnalysis,
    replSummary,
    setReplSummary,
    logs,
    setLogs,
    showLogs,
    setShowLogs,
    srcCfg,
    setSrcCfg,
    tgtCfg,
    setTgtCfg,
    wsStatus,
    send: wrappedSend,
    persona,
    onLogout,
    restartMigration
  }

  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  )
}

export function useMigration() {
  const context = useContext(MigrationContext)
  if (!context) {
    throw new Error('useMigration must be used within a MigrationProvider')
  }
  return context
}
