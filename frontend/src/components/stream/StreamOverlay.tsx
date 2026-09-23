import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVideoSlash, faPlugCircleXmark } from '@fortawesome/free-solid-svg-icons'
import type { StreamState } from '../../hooks/useCameraStream'

interface StreamOverlayProps {
  state: StreamState
  hasFrame: boolean
}

export const StreamOverlay: React.FC<StreamOverlayProps> = ({ state, hasFrame }) => {
  if (state === 'live') return null

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-4 select-none ${
        hasFrame ? 'bg-black/50 backdrop-blur-[2px]' : 'bg-black'
      }`}
    >
      {state === 'connecting' && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-text-faint border-t-accent animate-spin" />
          <span className="text-[13px] text-text-muted">Connecting…</span>
        </div>
      )}

      {state === 'waiting' && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <FontAwesomeIcon icon={faVideoSlash} className="text-[20px] text-text-faint mb-1.5" />
          <span className="text-[13px] font-medium text-text">Waiting for camera</span>
          <span className="text-[12px] text-text-muted">The camera isn't sending frames.</span>
        </div>
      )}

      {state === 'offline' && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <FontAwesomeIcon icon={faPlugCircleXmark} className="text-[20px] text-danger mb-1.5" />
          <span className="text-[13px] font-medium text-text">Can't reach the server</span>
          <span className="text-[12px] text-text-muted">Retrying automatically.</span>
        </div>
      )}
    </div>
  )
}
