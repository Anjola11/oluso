import { useEffect, useRef, useState, useCallback } from 'react'
import { WS_URL } from '../lib/config'

export type StreamState = 'connecting' | 'waiting' | 'live' | 'offline'

interface StreamStats {
  state: StreamState
  fps: number
  frameKB: number
  mbps: number
  width: number
  height: number
  connectedSince: number | null
  lastFrameAt: number | null
  snapshot: () => Promise<Blob | null>
}

interface UseCameraStreamOptions {
  thumb?: boolean
}

export function useCameraStream(
  deviceId: string | null,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseCameraStreamOptions = {}
): StreamStats {
  const { thumb = false } = options

  const [state, setState] = useState<StreamState>('connecting')
  const [fps, setFps] = useState<number>(0)
  const [frameKB, setFrameKB] = useState<number>(0)
  const [mbps, setMbps] = useState<number>(0)
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [connectedSince, setConnectedSince] = useState<number | null>(null)
  const [lastFrameAt, setLastFrameAt] = useState<number | null>(null)

  // Mutable refs for tracking metrics without triggering React renders
  const sessionRef = useRef<number>(0)
  const decodeInFlightRef = useRef<boolean>(false)
  const lastThumbDecodeMsRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const byteCountRef = useRef<number>(0)
  const latestFrameBytesRef = useRef<number>(0)
  const lastFrameTimestampRef = useRef<number | null>(null)
  const connectedTimeRef = useRef<number | null>(null)
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)

  const clearTimers = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const snapshot = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        'image/jpeg',
        0.92
      )
    })
  }, [canvasRef])

  useEffect(() => {
    if (!deviceId || !WS_URL) {
      setState('offline')
      return
    }

    sessionRef.current += 1
    const currentSession = sessionRef.current

    let ws: WebSocket | null = null
    let isDisposed = false

    // Reset counters for the new device
    frameCountRef.current = 0
    byteCountRef.current = 0
    latestFrameBytesRef.current = 0
    lastFrameTimestampRef.current = null
    connectedTimeRef.current = null
    reconnectAttemptsRef.current = 0

    function resetWatchdog() {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current)
      }
      watchdogTimerRef.current = setTimeout(() => {
        if (!isDisposed && sessionRef.current === currentSession) {
          setState((prev) => (prev === 'live' ? 'waiting' : prev))
        }
      }, 3000)
    }

    function scheduleReconnect() {
      if (isDisposed || sessionRef.current !== currentSession) return
      clearTimers()
      setState('offline')
      connectedTimeRef.current = null
      setConnectedSince(null)

      // Exponential backoff: 1s, 2s, 4s, 8s, capped at 10s ±20% jitter
      const attempt = reconnectAttemptsRef.current
      const baseDelay = Math.min(1000 * Math.pow(2, attempt), 10000)
      const jitter = baseDelay * (0.8 + Math.random() * 0.4) // ±20%
      reconnectAttemptsRef.current = Math.min(attempt + 1, 5)

      reconnectTimerRef.current = setTimeout(() => {
        if (!isDisposed && sessionRef.current === currentSession) {
          connect()
        }
      }, jitter)
    }

    function connect() {
      if (isDisposed || sessionRef.current !== currentSession || !deviceId) return

      try {
        setState('connecting')
        const url = `${WS_URL}/ws/view/${encodeURIComponent(deviceId)}`
        ws = new WebSocket(url)
        ws.binaryType = 'blob'

        ws.onopen = () => {
          if (isDisposed || sessionRef.current !== currentSession) {
            ws?.close()
            return
          }
          reconnectAttemptsRef.current = 0
          connectedTimeRef.current = Date.now()
          setConnectedSince(connectedTimeRef.current)
          setState('waiting')
          resetWatchdog()
        }

        ws.onmessage = async (event: MessageEvent) => {
          if (isDisposed || sessionRef.current !== currentSession) return

          // Ignore non-blob messages safely
          if (!(event.data instanceof Blob)) return

          const blob = event.data
          const blobSize = blob.size
          latestFrameBytesRef.current = blobSize
          byteCountRef.current += blobSize
          frameCountRef.current += 1
          const now = Date.now()
          lastFrameTimestampRef.current = now

          setState('live')
          resetWatchdog()

          // In hidden tab, drop frames without decoding
          if (typeof document !== 'undefined' && document.hidden) {
            return
          }

          // In thumb mode, decode at most one frame every 500ms
          if (thumb && now - lastThumbDecodeMsRef.current < 500) {
            return
          }

          // If a decode is in flight, drop the frame
          if (decodeInFlightRef.current) {
            return
          }

          decodeInFlightRef.current = true
          try {
            const bitmap = await createImageBitmap(blob)
            lastThumbDecodeMsRef.current = now

            const canvas = canvasRef.current
            if (canvas && !isDisposed && sessionRef.current === currentSession) {
              if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
                canvas.width = bitmap.width
                canvas.height = bitmap.height
                setResolution({ width: bitmap.width, height: bitmap.height })
              }
              const ctx = canvas.getContext('2d', { alpha: false })
              if (ctx) {
                ctx.drawImage(bitmap, 0, 0)
              }
            }
            bitmap.close()
          } catch {
            // Ignore decode failures on malformed frames
          } finally {
            decodeInFlightRef.current = false
          }
        }

        ws.onclose = () => {
          if (!isDisposed && sessionRef.current === currentSession) {
            scheduleReconnect()
          }
        }

        ws.onerror = () => {
          if (!isDisposed && sessionRef.current === currentSession) {
            ws?.close()
          }
        }
      } catch {
        scheduleReconnect()
      }
    }

    connect()

    // 1-second interval to update stats state for UI
    const statsInterval = setInterval(() => {
      if (isDisposed || sessionRef.current !== currentSession) return

      const currentFrames = frameCountRef.current
      const currentBytes = byteCountRef.current
      frameCountRef.current = 0
      byteCountRef.current = 0

      setFps(currentFrames)
      setMbps(currentBytes * 8)
      setFrameKB(latestFrameBytesRef.current)
      setLastFrameAt(lastFrameTimestampRef.current)
    }, 1000)

    return () => {
      isDisposed = true
      clearTimers()
      clearInterval(statsInterval)
      if (ws) {
        ws.onopen = null
        ws.onmessage = null
        ws.onclose = null
        ws.onerror = null
        ws.close()
        ws = null
      }
    }
  }, [deviceId, thumb, canvasRef, clearTimers])

  return {
    state,
    fps,
    frameKB,
    mbps,
    width: resolution.width,
    height: resolution.height,
    connectedSince,
    lastFrameAt,
    snapshot,
  }
}
