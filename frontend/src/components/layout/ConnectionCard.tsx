import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { API_URL, envLabel } from '../../lib/config'
import type { HealthStatus } from '../../hooks/useBackendHealth'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface ConnectionCardProps {
  health: HealthStatus
  onlineDeviceCount: number
  onAddDevice: () => void
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  health,
  onlineDeviceCount,
  onAddDevice,
}) => {
  let backendHost = 'No backend'
  if (API_URL) {
    try {
      backendHost = new URL(API_URL).host
    } catch {
      backendHost = API_URL.replace(/^https?:\/\//, '')
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-[14px] flex flex-col gap-3 shrink-0">
      {/* Title & Env Chip */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-text">Connection</span>
        <span
          className={cn(
            'h-5 px-2 rounded-md text-[11px] font-medium flex items-center',
            envLabel === 'Local'
              ? 'bg-surface-2 text-text-muted'
              : 'bg-accent-soft text-accent'
          )}
        >
          {envLabel}
        </span>
      </div>

      {/* Backend Health & Host Row */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            health === 'ok' && 'bg-success',
            health === 'down' && 'bg-danger',
            health === 'checking' && 'bg-warning animate-pulse'
          )}
          title={`Backend status: ${health}`}
        />
        <span
          className="font-mono text-[12px] text-text-muted truncate select-all"
          title={API_URL ?? 'Unconfigured'}
        >
          {backendHost}
        </span>
      </div>

      {/* Devices Online Big Number */}
      <div className="flex items-baseline gap-2 pt-1">
        <span className="font-mono text-[32px] leading-9 font-semibold text-text tabular-nums">
          {onlineDeviceCount}
        </span>
        <span className="text-[12px] text-text-muted">Devices online</span>
      </div>

      {/* Add Device Button */}
      <Button
        variant="primary"
        onClick={onAddDevice}
        className="w-full h-10 rounded-[10px] text-[13px] font-semibold gap-2 mt-1"
      >
        <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
        <span>Add device</span>
      </Button>
    </div>
  )
}
