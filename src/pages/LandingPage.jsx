import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Play, ArrowRight, Search, Activity, Zap } from 'lucide-react'
import Badge from '../components/common/Badge'
import Btn from '../components/common/Btn'
import Card from '../components/common/Card'

const LandingPage = ({ persona }) => {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' }}>

      {/* Top Nav */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={16} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>TeraMigrate</span>
        </div>
        <div>
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Automate Your Journey from <br />
            <span style={{ color: 'var(--accent-cyan)' }}>Teradata</span> to Modern Cloud
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Seamlessly transition your legacy ETL workloads to Databricks and Snowflake. AI-powered discovery, automated gap analysis, and intelligent code conversion.
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
          <Card style={{ textAlign: 'left', padding: 24 }}>
            <Search size={24} style={{ color: 'var(--accent-cyan)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Automated Discovery</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Connect directly to Teradata to discover databases, tables, views, and complex stored procedures automatically.
            </p>
          </Card>
          <Card style={{ textAlign: 'left', padding: 24 }}>
            <Activity size={24} style={{ color: 'var(--accent-violet)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Gap Analysis</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Identify syntax incompatibilities and structural differences between Teradata and your target cloud platform before migrating.
            </p>
          </Card>
          <Card style={{ textAlign: 'left', padding: 24 }}>
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
        &copy; {new Date().getFullYear()} TeraMigrate Platform. Designed for modern data teams.
      </footer>
    </div>
  )
}

export default LandingPage
