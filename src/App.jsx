import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import MigrationApp from './pages/MigrationApp.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DatastageMigrationPage from './pages/DatastageMigrationPage.jsx'
import LogsPage from './pages/LogsPage.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import { MigrationProvider } from './context/MigrationContext.jsx'

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
      <Route element={persona ? (
        <MigrationProvider initialPersona={persona} onLogout={() => handleLogin(null)}>
          <AppLayout />
        </MigrationProvider>
      ) : <Navigate to="/" replace />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/migration" element={<MigrationApp />} />
        <Route path="/datastage-migration" element={<DatastageMigrationPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>
    </Routes>
  )
}
