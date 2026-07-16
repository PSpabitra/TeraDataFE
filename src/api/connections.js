import { API } from '../utils/constants'

/**
 * Fetch saved connections for a persona.
 * @param {string|number} personaId
 * @returns {Promise<{ credentials: Array<any> }>}
 */
export async function getConnections(personaId) {
  const res = await fetch(`${API}/api/v1/connections/?persona_id=${personaId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch connections')
  }
  return res.json()
}

/**
 * Save connection credentials for a persona.
 * @param {string|number} personaId
 * @param {import('../types').SourceConnection | import('../types').TargetConnection} connectionDetails
 * @returns {Promise<any>}
 */
export async function saveConnection(personaId, connectionDetails) {
  const res = await fetch(`${API}/api/v1/connections/save?persona_id=${personaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connectionDetails)
  })
  if (!res.ok) {
    throw new Error('Failed to save connection')
  }
  return res.json()
}

/**
 * Fetch saved migration connection profiles.
 * @param {string|number} personaId
 * @returns {Promise<{ connections: Array<any> }>}
 */
export async function getMigrationConnections(personaId) {
  const res = await fetch(`${API}/api/v1/connections/migration-connections?persona_id=${personaId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch migration connections')
  }
  return res.json()
}

/**
 * Save or update a migration connection profile.
 * @param {object} payload
 * @returns {Promise<any>}
 */
export async function saveMigrationConnection(payload) {
  const res = await fetch(`${API}/api/v1/connections/migration-connections/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    throw new Error('Failed to save migration connection')
  }
  return res.json()
}

