'use client'

import { useState, useEffect, useRef } from 'react'
import type { QueueMetricsPayload } from '@/lib/types/dashboard'

interface SSEState {
  metrics: QueueMetricsPayload[] | null
  lastUpdated: Date | null
  error: string | null
  connecting: boolean
}

export function useSSEStream(): SSEState {
  const [metrics, setMetrics] = useState<QueueMetricsPayload[] | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(true)

  const retryCount = useRef(0)
  const esRef = useRef<EventSource | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function connect() {
      setConnecting(true)

      const es = new EventSource('/api/stream')
      esRef.current = es

      es.onopen = () => {
        setConnecting(false)
        setError(null)
        retryCount.current = 0
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as QueueMetricsPayload[]
          setMetrics(data)
          setLastUpdated(new Date())
        } catch {
          // malformed SSE frame — skip silently
        }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        setConnecting(false)
        setError('Conexão perdida. Reconectando...')

        // Exponential backoff capped at 30s
        const delay = Math.min(1_000 * 2 ** retryCount.current, 30_000)
        retryCount.current++
        timeoutRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { metrics, lastUpdated, error, connecting }
}
