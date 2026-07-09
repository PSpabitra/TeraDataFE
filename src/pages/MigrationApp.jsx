import React from 'react'
import { AlertCircle } from 'lucide-react'
import StepBar from '../components/StepBar'
import LogDrawer from '../components/LogDrawer'

// Import Steps
import ConnectStep from '../components/steps/ConnectStep'
import DiscoverStep from '../components/steps/DiscoverStep'
import AnalyzeStep from '../components/steps/AnalyzeStep'
import ReplicateStep from '../components/steps/ReplicateStep'
import DoneStep from '../components/steps/DoneStep'

// Import Context
import { useMigration } from '../context/MigrationContext'

/**
 * MigrationApp page. Consumes MigrationProvider from layout scope.
 * @returns {React.ReactElement}
 */
export default function MigrationApp() {
  const {
    step,
    setStep,
    logs,
    showLogs,
    setShowLogs,
    wsStatus
  } = useMigration()

  return (
    <>
      {/* Step bar */}
      <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-dim)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <StepBar current={step} onStepClick={(i) => setStep(i)} />
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', padding: '28px 24px', width: '100%' }}>
        {step === 0 && <ConnectStep />}
        {step === 1 && <DiscoverStep />}
        {step === 2 && <AnalyzeStep />}
        {step === 3 && <ReplicateStep />}
        {step === 4 && <DoneStep />}
      </main>

      {/* WS disconnected warning */}
      {wsStatus !== 'connected' && wsStatus !== 'connecting' && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius)', padding: '8px 18px', fontSize: 11,
          color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 200
        }}>
          <AlertCircle size={13} />
          WebSocket {wsStatus} — backend at ws://localhost:3007
        </div>
      )}

      {/* Log drawer */}
      {showLogs && <LogDrawer logs={logs} onClose={() => setShowLogs(false)} />}
    </>
  )
}
