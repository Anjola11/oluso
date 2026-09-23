import React, { useState, useEffect } from 'react'
import { formatBytesToKB, formatBitrate, formatElapsedTime } from '../../lib/format'
import { cn } from '../../lib/utils'

interface StreamFooterProps {
  fps: number
  frameKB: number
  mbps: number
  width: number
  height: number
  connectedSince: number | null
  isLive: boolean
}

export const StreamFooter: React.FC<StreamFooterProps> = ({
  fps,
  frameKB,
  mbps,
  width,
  height,
  connectedSince,
  isLive,
}) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0)

  useEffect(() => {
    if (!connectedSince) {
      setElapsedSec(0)
      return
    }

    const updateTimer = () => {
      setElapsedSec(Math.floor((Date.now() - connectedSince) / 1000))
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [connectedSince])

  const resolutionText = width > 0 && height > 0 ? `${width} × ${height}` : '—'
  const fpsText = isLive && fps > 0 ? fps.toFixed(1) : isLive ? '0.0' : '—'
  const frameText = isLive && frameKB > 0 ? formatBytesToKB(frameKB) : '—'
  const bitrateText = isLive && mbps > 0 ? formatBitrate(mbps) : '—'
  const connectedText = connectedSince ? formatElapsedTime(elapsedSec) : '—'

  const fpsWarning = isLive && fps > 0 && fps < 8

  return (
    <footer className="h-11 bg-surface border-t border-border px-1 flex items-center shrink-0 divide-x divide-border select-none overflow-hidden">
      {/* Resolution */}
      <div className="flex flex-col justify-center px-4 shrink-0 min-w-[90px]">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
          Resolution
        </span>
        <span className="font-mono text-[12px] font-medium text-text tabular-nums">
          {resolutionText}
        </span>
      </div>

      {/* FPS */}
      <div className="flex flex-col justify-center px-4 shrink-0 min-w-[75px]">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
          FPS
        </span>
        <span
          className={cn(
            'font-mono text-[12px] font-medium tabular-nums',
            fpsWarning ? 'text-warning' : 'text-text'
          )}
        >
          {fpsText}
        </span>
      </div>

      {/* Frame Size (hidden on smaller widths) */}
      <div className="hidden sm:flex flex-col justify-center px-4 shrink-0 min-w-[90px]">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
          Frame
        </span>
        <span className="font-mono text-[12px] font-medium text-text tabular-nums">
          {frameText}
        </span>
      </div>

      {/* Bitrate */}
      <div className="flex flex-col justify-center px-4 shrink-0 min-w-[95px]">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
          Bitrate
        </span>
        <span className="font-mono text-[12px] font-medium text-text tabular-nums">
          {bitrateText}
        </span>
      </div>

      {/* Connected duration (only shown when connected, drops on tight widths) */}
      {connectedSince && (
        <div className="hidden md:flex flex-col justify-center px-4 shrink-0 min-w-[95px]">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
            Connected
          </span>
          <span className="font-mono text-[12px] font-medium text-text tabular-nums">
            {connectedText}
          </span>
        </div>
      )}
    </footer>
  )
}
