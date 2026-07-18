import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { CLIENT_ID } from '../utils/constants'
import { useWebSocket } from '../hooks/useWebSocket'

const MigrationContext = createContext(null)

export function MigrationProvider({ children, initialPersona, onLogout }) {
  const [persona, setPersonaState] = useState(initialPersona)
  const [step, setStep] = useState(0)
  const [agentStatuses, setAgentStatuses] = useState({})
  const [sourceResources, setSourceResources] = useState(null)
  const [targetResources, setTargetResources] = useState(null)
  const [selectedResources, setSelectedResources] = useState([])
  const [gapAnalysis, setGapAnalysis] = useState(null)
  const [summary, setSummary] = useState(null)
  const targetTypesRef = useRef({})
  const [logs, setLogs] = useState([])
  const [showLogs, setShowLogs] = useState(false)
  const [srcCfg, setSrcCfg] = useState({})
  const [tgtCfg, setTgtCfg] = useState({})
  const [connectionName, setConnectionName] = useState('')
  const [replicationMode, setReplicationMode] = useState('create_and_insert')
  const [viewingHistory, setViewingHistory] = useState(false)

  const setPersona = (p) => {
    setPersonaState(p)
    if (p) {
      localStorage.setItem('tera_persona', JSON.stringify(p))
    } else {
      localStorage.removeItem('tera_persona')
      onLogout()
    }
  }

  // Route all incoming WS messages
  const handleMessage = useCallback((msg) => {
    if (msg.type === 'agent_status') {
      setAgentStatuses(prev => ({ ...prev, [msg.agent]: msg.status }))
      return
    }
    window.__connectHandler?.(msg)
    window.__discoveryHandler?.(msg)
    window.__insightHandler?.(msg)
    window.__replicationHandler?.(msg)
    
    if (msg.type === 'agent_error') {
      setLogs(prev => [...prev, { event: 'AGENT_ERROR', ...msg, timestamp: new Date().toISOString() }])
    }
  }, [])

  const { send, status: wsStatus } = useWebSocket(CLIENT_ID, handleMessage)

  // Intercept send to capture configs
  const wrappedSend = useCallback((action, payload) => {
    if (action === 'connect_source') setSrcCfg(payload)
    if (action === 'connect_target') setTgtCfg(payload)
    setLogs(prev => [...prev, { 
      event: `WS_SEND:${action}`, 
      timestamp: new Date().toISOString(), 
      ...Object.fromEntries(Object.entries(payload).filter(([k]) => !['password', 'token'].includes(k))) 
    }])
    return send(action, payload)
  }, [send])

  const restartMigration = () => {
    setStep(0)
    setLogs([])
    setSourceResources(null)
    setTargetResources(null)
    setAgentStatuses({})
    setSelectedResources([])
    setGapAnalysis(null)
    setSummary(null)
    targetTypesRef.current = {}
    setConnectionName('')
    setReplicationMode('create_and_insert')
    setViewingHistory(false)
  }

  return (
    <MigrationContext.Provider value={{
      persona,
      setPersona,
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
      summary,
      setSummary,
      targetTypes: targetTypesRef.current,
      setTargetTypes: (val) => { targetTypesRef.current = val },
      logs,
      setLogs,
      showLogs,
      setShowLogs,
      srcCfg,
      setSrcCfg,
      tgtCfg,
      setTgtCfg,
      connectionName,
      setConnectionName,
      replicationMode,
      setReplicationMode,
      viewingHistory,
      setViewingHistory,
      wsStatus,
      send: wrappedSend,
      restartMigration
    }}>
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
