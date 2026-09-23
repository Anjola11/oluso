import { useEffect, useState } from 'react'
import { fetchHealth } from '../lib/api'
import { API_URL } from '../lib/config'

export type HealthStatus = 'checking' | 'ok' | 'down'

export function useBackendHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking')

  useEffect(() => {
    if (!API_URL) {
      setStatus('down')
      return
    }

    let isDisposed = false
    let timer: ReturnType<typeof setTimeout> | null = null

    async function check() {
      try {
        const isOk = await fetchHealth()
        if (!isDisposed) {
          setStatus(isOk ? 'ok' : 'down')
        }
      } catch {
        if (!isDisposed) {
          setStatus('down')
        }
      } finally {
        if (!isDisposed) {
          timer = setTimeout(check, 10000)
        }
      }
    }

    check()

    return () => {
      isDisposed = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return status
}
