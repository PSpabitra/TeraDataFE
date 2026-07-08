import { API } from '../utils/constants'

/**
 * Log in to the application.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<import('../types').Persona>}
 */
export async function login(username, password) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!res.ok) {
    throw new Error('Invalid credentials')
  }
  return res.json()
}
