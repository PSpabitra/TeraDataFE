import { useEffect, useRef, useCallback, useState } from 'react'

const WS_URL = `ws://localhost:3007/ws`

export function useWebSocket(clientId, onMessage) {
  const ws = useRef(null)
  const [status, setStatus] = useState('disconnected') // disconnected | connecting | connected | error
  const reconnectTimer = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return
    setStatus('connecting')
    try {
      const socket = new WebSocket(`${WS_URL}/${clientId}`)
      ws.current = socket

      socket.onopen = () => {
        setStatus('connected')
        clearTimeout(reconnectTimer.current)
      }

      socket.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          onMessageRef.current(data)
        } catch (e) {
          console.error('WS parse error', e)
        }
      }

      socket.onerror = () => setStatus('error')

      socket.onclose = () => {
        setStatus('disconnected')
        reconnectTimer.current = setTimeout(connect, 3000)
      }
    } catch (e) {
      setStatus('error')
    }
  }, [clientId])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  const send = useCallback((action, payload = {}) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, payload }))
      return true
    }
    return false
  }, [])

  return { send, status }
}
