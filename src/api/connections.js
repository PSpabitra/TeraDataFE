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
