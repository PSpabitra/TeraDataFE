import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Initialize theme immediately to avoid UI flash
try {
  const savedTheme = localStorage.getItem('tera_theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)
} catch (e) {
  document.documentElement.setAttribute('data-theme', 'dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
