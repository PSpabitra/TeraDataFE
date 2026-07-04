import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './components/LoginPage.jsx'
import LandingPage from './components/LandingPage.jsx'
import MigrationApp from './components/MigrationApp.jsx'

export default function App() {
  const [persona, setPersona] = useState(() => {
    try {
      const saved = localStorage.getItem('tera_persona')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const handleLogin = (p) => {
    setPersona(p)
    if (p) {
      localStorage.setItem('tera_persona', JSON.stringify(p))
    } else {
      localStorage.removeItem('tera_persona')
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/" element={<LandingPage persona={persona} />} />
      <Route path="/migration" element={persona ? <MigrationApp persona={persona} onLogout={() => handleLogin(null)} /> : <Navigate to="/" replace />} />
    </Routes>
  )
}
