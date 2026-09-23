import { useEffect, useState, useRef } from 'react'
import { fetchDevices, type DeviceInfo } from '../lib/api'
import { DEFAULT_DEVICE_ID, API_URL } from '../lib/config'

export function useDevices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([
    { device_id: DEFAULT_DEVICE_ID, online: null, viewers: 0 },
  ])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!API_URL) {
      setLoading(false)
      setError('API_URL is not configured')
      return
    }

    let abortController: AbortController | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let isDisposed = false

    async function load() {
      if (typeof document !== 'undefined' && document.hidden) {
        timer = setTimeout(load, 3000)
        return
      }

      abortController = new AbortController()
      try {
        const list = await fetchDevices(abortController.signal)
        if (!isDisposed) {
          // If the list is empty (e.g. no devices registered yet), keep DEFAULT_DEVICE_ID with offline status
          if (list.length === 0) {
            setDevices([{ device_id: DEFAULT_DEVICE_ID, online: false, viewers: 0 }])
          } else {
            setDevices(list)
          }
          setError(null)
          hasLoadedRef.current = true
        }
      } catch (err: unknown) {
        if (!isDisposed && !(err instanceof DOMException && err.name === 'AbortError')) {
          const msg = err instanceof Error ? err.message : 'Failed to reach backend'
          setError(msg)
          // Keep previous devices, or fall back to default if no data yet
          if (!hasLoadedRef.current) {
            setDevices([{ device_id: DEFAULT_DEVICE_ID, online: null, viewers: 0 }])
          }
        }
      } finally {
        if (!isDisposed) {
          setLoading(false)
          timer = setTimeout(load, 3000)
        }
      }
    }

    load()

    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        if (timer) clearTimeout(timer)
        load()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isDisposed = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timer) clearTimeout(timer)
      if (abortController) abortController.abort()
    }
  }, [])

  return { devices, error, loading }
}
