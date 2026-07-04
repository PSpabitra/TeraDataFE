import { GitBranch, FileText, LogOut, AlertCircle } from 'lucide-react'
import { Badge, Btn, StatusDot } from './UI.jsx'
import AgentBar from './AgentBar.jsx'
import StepBar from './StepBar.jsx'
import LogDrawer from './LogDrawer.jsx'
import ConnectStep from './ConnectStep.jsx'
import DiscoverStep from './DiscoverStep.jsx'
import AnalyzeStep from './AnalyzeStep.jsx'
import ReplicateStep from './ReplicateStep.jsx'
import DoneStep from './DoneStep.jsx'
import { MigrationProvider, useMigration } from '../context/MigrationContext.jsx'

function MigrationAppContent() {
  const {
    step,
    wsStatus,
    logs,
    showLogs,
    setShowLogs,
    srcCfg,
    tgtCfg,
    onLogout
  } = useMigration()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border-dim)',
        background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GitBranch size={15} style={{ color: '#fff' }} />
            </div>
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap', marginBottom: 4 }}>ETL Migration Platform</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{srcCfg?.platform === 'mysql' ? 'MySQL' : 'Teradata'} → {tgtCfg?.platform === 'snowflake' ? 'Snowflake' : 'Databricks'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AgentBar />
            <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />
            <StatusDot status={wsStatus} />
            <Btn size="sm" variant="ghost" onClick={() => setShowLogs(v => !v)} icon={<FileText size={11} />}>
              Logs {logs.length > 0 && <Badge color="amber" size="sm">{logs.length}</Badge>}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={onLogout} icon={<LogOut size={11} />}>
              Logout
            </Btn>
          </div>
        </div>
      </header>

      {/* Step bar */}
      <div style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-dim)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <StepBar />
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
      {showLogs && <LogDrawer />}
    </div>
  )
}

export default function MigrationApp({ persona, onLogout }) {
  return (
    <MigrationProvider persona={persona} onLogout={onLogout}>
      <MigrationAppContent />
    </MigrationProvider>
  )
}
