import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Database, GitBranch, LayoutDashboard, LogOut } from 'lucide-react'
import { useMigration } from '../../context/MigrationContext'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setPersona } = useMigration()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: 'Migration Wizard', path: '/migration', icon: <GitBranch size={16} /> },
  ]

  const handleLogout = () => {
    setPersona(null)
  }

  return (
    <aside style={{
      width: 220,
      background: 'var(--bg-base)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Database size={16} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-primary)' }}>DMigrate</div>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>ETL Platform</div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius)',
                border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'left',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-dim)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '10px 16px',
            borderRadius: 'var(--radius)',
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'left',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--red-dim)'
            e.currentTarget.style.color = 'var(--accent-red)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
