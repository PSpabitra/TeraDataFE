import { API } from '../utils/constants'

/**
 * Fetch a new CAPTCHA challenge.
 * @returns {Promise<{captcha_id: string, question: string}>}
 */
export async function getCaptcha() {
  const res = await fetch(`${API}/api/v1/auth/captcha`)
  if (!res.ok) throw new Error('Failed to load CAPTCHA')
  return res.json()
}

/**
 * Log in to the application.
 * @param {string} email
 * @param {string} password
 * @param {string} captcha_id
 * @param {string} captcha_answer
 * @returns {Promise<import('../types').Persona>}
 */
export async function login(email, password, captcha_id, captcha_answer) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, captcha_id, captcha_answer })
  })
  if (!res.ok) {
    throw new Error('Invalid credentials')
  }
  return res.json()
}
