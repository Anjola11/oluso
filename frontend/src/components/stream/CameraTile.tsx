import React, { useRef, useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons'
import { toast } from 'sonner'
import { useCameraStream } from '../../hooks/useCameraStream'
import { LiveBadge } from './LiveBadge'
import { StreamOverlay } from './StreamOverlay'
import { StreamFooter } from './StreamFooter'
import { formatSnapshotFilename } from '../../lib/format'
import { cn } from '../../lib/utils'

interface CameraTileProps {
  deviceId: string
  mode?: 'focus' | 'wall' | 'thumb'
  isSelected?: boolean
  onClick?: () => void
  onStateChange?: (state: string) => void
}

export const CameraTile: React.FC<CameraTileProps> = ({
  deviceId,
  mode = 'focus',
  isSelected = false,
  onClick,
  onStateChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [hasDrawnFrame, setHasDrawnFrame] = useState<boolean>(false)

  const stream = useCameraStream(deviceId, canvasRef, {
    thumb: mode === 'thumb',
  })

  // Notify parent of state changes (e.g. for activity log)
  useEffect(() => {
    if (onStateChange) {
      onStateChange(stream.state)
    }
  }, [stream.state, onStateChange])

  // Track if at least one frame was rendered to enable snapshot and scrim
  useEffect(() => {
    if (stream.lastFrameAt) {
      setHasDrawnFrame(true)
    }
  }, [stream.lastFrameAt])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Ignore fullscreen permission rejections
    }
  }

  const handleSnapshot = async () => {
    if (!hasDrawnFrame) return
    try {
      const blob = await stream.snapshot()
      if (!blob) {
        toast.error('No frame available for snapshot')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = formatSnapshotFilename(deviceId)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Snapshot saved', {
        description: a.download,
      })
    } catch {
      toast.error('Failed to save snapshot')
    }
  }

  // Thumb Mode for bottom camera strip
  if (mode === 'thumb') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Select ${deviceId}`}
        className={cn(
          'relative w-[120px] h-[90px] shrink-0 rounded-lg overflow-hidden bg-black border border-border cursor-pointer select-none transition-all group focus-visible:outline-2 focus-visible:outline-accent',
          isSelected && 'ring-2 ring-accent ring-offset-0 border-transparent'
        )}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Thumbnail feed for ${deviceId}`}
          className="w-full h-full object-contain pointer-events-none"
        />
        {/* State scrim / overlay if offline */}
        <StreamOverlay state={stream.state} hasFrame={hasDrawnFrame} />

        {/* Small Bottom-Left Label */}
        <div className="absolute bottom-1.5 left-1.5 h-5 px-1.5 rounded-[4px] bg-overlay/90 backdrop-blur-sm flex items-center gap-1 border border-white/5 pointer-events-none">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              stream.state === 'live' ? 'bg-success' : stream.state === 'waiting' ? 'bg-warning' : 'bg-danger'
            )}
          />
          <span className="font-mono text-[11px] font-medium text-text truncate max-w-[80px]">
            {deviceId}
          </span>
        </div>
      </button>
    )
  }

  // Wall Mode tile
  if (mode === 'wall') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
        aria-label={`View ${deviceId} stream in focus mode`}
        className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black border border-border cursor-pointer select-none transition-transform hover:border-border-strong focus-visible:outline-2 focus-visible:outline-accent group"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Live feed from ${deviceId}`}
          className="w-full h-full object-contain pointer-events-none"
        />

        <StreamOverlay state={stream.state} hasFrame={hasDrawnFrame} />

        {/* Top-Left LiveBadge */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <LiveBadge state={stream.state} deviceId={deviceId} />
        </div>

        {/* Quick Resolution & FPS Chip */}
        {stream.state === 'live' && (
          <div className="absolute bottom-3 right-3 h-5 px-2 rounded-md bg-overlay backdrop-blur-sm font-mono text-[11px] text-text-muted flex items-center gap-2 border border-white/5 pointer-events-none">
            <span>{stream.fps.toFixed(1)} FPS</span>
          </div>
        )}
      </div>
    )
  }

  // Focus Mode Panel (Main Feed)
  return (
    <section
      ref={containerRef}
      aria-label={`Focus stream for ${deviceId}`}
      className="relative flex-1 min-h-0 bg-black border border-border rounded-xl overflow-hidden flex flex-col group"
    >
      {/* Video Display Area */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Live feed from ${deviceId}`}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* State Scrim & Overlays */}
        <StreamOverlay state={stream.state} hasFrame={hasDrawnFrame} />

        {/* Top-Left LIVE Badge */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <LiveBadge state={stream.state} deviceId={deviceId} />
        </div>

        {/* Top-Right Floating Controls (Snapshot & Fullscreen) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 transition-opacity duration-150 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
          {/* Snapshot Button */}
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={!hasDrawnFrame}
            aria-label="Take snapshot"
            title={hasDrawnFrame ? 'Take snapshot' : 'No frame available'}
            className="w-8 h-8 rounded-lg bg-overlay backdrop-blur-md text-text flex items-center justify-center transition-colors hover:bg-surface-2/90 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5"
          >
            <FontAwesomeIcon icon={faCamera} className="text-[13px]" />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="w-8 h-8 rounded-lg bg-overlay backdrop-blur-md text-text flex items-center justify-center transition-colors hover:bg-surface-2/90 border border-white/5"
          >
            <FontAwesomeIcon
              icon={isFullscreen ? faCompress : faExpand}
              className="text-[13px]"
            />
          </button>
        </div>
      </div>

      {/* Stats Footer */}
      <StreamFooter
        fps={stream.fps}
        frameKB={stream.frameKB}
        mbps={stream.mbps}
        width={stream.width}
        height={stream.height}
        connectedSince={stream.connectedSince}
        isLive={stream.state === 'live'}
      />
    </section>
  )
}
