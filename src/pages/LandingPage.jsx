import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Play, ArrowRight, Search, Activity, Zap, Sun, Moon } from 'lucide-react'
import Badge from '../components/common/Badge'
import Btn from '../components/common/Btn'
import Card from '../components/common/Card'

const LandingPage = ({ persona }) => {
  const navigate = useNavigate()

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

  // Word rotation animation for the heading
  const words = ['Teradata', 'MySQL', 'MSSQL', 'DataStage', 'ADF', 'Database']
  const [wordIndex, setWordIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length)
        setFade(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' }}>

      {/* Top Nav */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={16} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>DMigrate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          {persona ? (
            <Btn variant="primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</Btn>
          ) : (
            <Btn variant="ghost" onClick={() => navigate('/login')}>Sign In</Btn>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div className="animate-fade" style={{ maxWidth: 800 }}>
          <Badge color="violet" size="lg" style={{ marginBottom: 24, fontSize: 12, padding: '4px 12px' }}>
            Next-Gen ETL Migration
          </Badge>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 45, fontWeight: 800, lineHeight: 1.5, marginBottom: 20 }}>
            Automate Your Journey from <br />
            <span
              style={{
                color: 'var(--accent-cyan)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                opacity: fade ? 1 : 0,
                transform: fade ? 'translateY(0)' : 'translateY(-4px)',
                display: 'inline-block',
                minWidth: 160
              }}
            >
              {words[wordIndex]}
            </span> to Modern Cloud
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Seamlessly transition your legacy ETL workloads to Databricks and Snowflake with intelligent discovery, automated gap analysis, and optimized code conversion.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {persona ? (
              <Btn variant="primary" size="lg" icon={<Play size={16} />} onClick={() => navigate('/dashboard')} style={{ padding: '14px 32px', fontSize: 14 }}>
                Go to Dashboard ({persona.username})
              </Btn>
            ) : (
              <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/login')} style={{ padding: '14px 32px', fontSize: 14 }}>
                Get Started
              </Btn>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, maxWidth: 1000, width: '100%', marginTop: 80 }} className="animate-fade">
          <Card className="hover-card" style={{ textAlign: 'left', padding: 24 }}>
            <Search size={24} style={{ color: 'var(--accent-cyan)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Automated Discovery</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Connect directly to Teradata to discover databases, tables, views, and complex stored procedures automatically.
            </p>
          </Card>
          <Card className="hover-card" style={{ textAlign: 'left', padding: 24 }}>
            <Activity size={24} style={{ color: 'var(--accent-violet)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Gap Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Identify syntax incompatibilities and structural differences between Teradata and your target cloud platform before migrating.
            </p>
          </Card>
          <Card className="hover-card" style={{ textAlign: 'left', padding: 24 }}>
            <Zap size={24} style={{ color: 'var(--accent-green)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Intelligent Migration</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Automatically convert legacy SQL, migrate table structures, and orchestrate real-time replication pipelines.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, borderTop: '1px solid var(--border-dim)' }}>
        &copy; {new Date().getFullYear()} DMigrate Platform. Designed for modern data teams.
      </footer>
    </div>
  )
}

export default LandingPage
