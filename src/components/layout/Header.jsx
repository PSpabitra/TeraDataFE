import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Database, GitBranch, FileText, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react'
import { useMigration } from '../../context/MigrationContext'
import Badge from '../common/Badge'
import Btn from '../common/Btn'
import AgentBar from '../AgentBar'
import StatusDot from '../common/StatusDot'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    persona,
    setPersona,
    agentStatuses,
    logs,
    showLogs,
    setShowLogs,
    srcCfg,
    tgtCfg,
    wsStatus
  } = useMigration()

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('tera_theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('tera_theme', theme)
    } catch {}
  }, [theme])

  const isMigration = location.pathname === '/migration'

  const handleLogout = () => {
    setPersona(null)
  }

  return (
    <header style={{
      borderBottom: '1px solid var(--border-dim)',
      background: 'var(--bg-header)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      height: 52,
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        width: '100%',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left Side: Page Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isMigration ? (
              <GitBranch size={15} style={{ color: '#fff' }} />
            ) : (
              <Database size={15} style={{ color: '#fff' }} />
            )}
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)'
            }}>
              {isMigration ? 'ETL Migration Platform' : 'Operations Dashboard'}
            </div>
            <div style={{
              fontSize: 9,
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              {isMigration && srcCfg?.platform
                ? `${srcCfg.platform.toUpperCase()} → ${tgtCfg?.platform ? tgtCfg.platform.toUpperCase() : 'TARGET'}`
                : 'ETL Migration Platform'}
            </div>
          </div>
        </div>

        {/* Right Side: Page Controls / User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isMigration && (
            <>
              <AgentBar agentStatuses={agentStatuses} />
              <div style={{ width: 1, height: 24, background: 'var(--border-dim)' }} />
              <StatusDot status={wsStatus} />
              <Btn size="sm" variant="ghost" onClick={() => navigate('/dashboard')} icon={<LayoutDashboard size={11} />}>
                Dashboard
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setShowLogs(v => !v)} icon={<FileText size={11} />}>
                Logs {logs.length > 0 && <Badge color="amber" size="sm">{logs.length}</Badge>}
              </Btn>
            </>
          )}

          <span style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            Welcome, <strong>{persona?.username || 'User'}</strong>
            {persona?.role && (
              <Badge color={persona.role === 'engineer' ? 'cyan' : persona.role === 'admin' ? 'violet' : 'gray'} size="sm">
                {persona.role}
              </Badge>
            )}
          </span>
          <div style={{ width: 1, height: 20, background: 'var(--border-dim)' }} />
          <button
            onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            {theme === 'dark' ? <Sun size={15} style={{ display: 'block' }} /> : <Moon size={15} style={{ display: 'block' }} />}
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border-dim)' }} />
          <Btn size="sm" variant="ghost" onClick={handleLogout} icon={<LogOut size={11} />}>
            Logout
          </Btn>
        </div>
      </div>
    </header>
  )
}
