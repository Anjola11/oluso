import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { API_URL, WS_URL, envLabel, APP_NAME, APP_VERSION } from '../../lib/config'
import type { HealthStatus } from '../../hooks/useBackendHealth'
import { cn } from '../../lib/utils'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  health?: HealthStatus
  onlineDeviceCount?: number
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  health,
  onlineDeviceCount,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[480px] p-5 gap-4">
        <DialogHeader>
          <DialogTitle>Settings & Diagnostics</DialogTitle>
          <DialogDescription>{APP_NAME} system overview.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {/* Environment */}
          <div className="flex items-center justify-between py-2 border-b border-border/60">
            <span className="text-[13px] text-text-muted">Environment</span>
            <span
              className={cn(
                'h-5 px-2 rounded-md text-[11px] font-medium flex items-center',
                envLabel === 'Local' ? 'bg-surface-2 text-text-muted' : 'bg-accent-soft text-accent'
              )}
            >
              {envLabel}
            </span>
          </div>

          {/* Backend Health (if provided) */}
          {health && (
            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <span className="text-[13px] text-text-muted">Backend Health</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    health === 'ok' && 'bg-success',
                    health === 'down' && 'bg-danger',
                    health === 'checking' && 'bg-warning animate-pulse'
                  )}
                />
                <span className="text-[12px] font-mono capitalize text-text">{health}</span>
              </div>
            </div>
          )}

          {/* Online Devices (if provided) */}
          {onlineDeviceCount !== undefined && (
            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <span className="text-[13px] text-text-muted">Devices Online</span>
              <span className="text-[13px] font-mono text-text tabular-nums">{onlineDeviceCount}</span>
            </div>
          )}

          {/* HTTP API URL */}
          <div className="flex flex-col gap-1 py-1 border-b border-border/60">
            <span className="text-[12px] text-text-muted">HTTP API URL</span>
            <span className="font-mono text-[12px] text-text select-all break-all">
              {API_URL ?? 'None (Unconfigured)'}
            </span>
          </div>

          {/* WebSocket Base URL */}
          <div className="flex flex-col gap-1 py-1 border-b border-border/60">
            <span className="text-[12px] text-text-muted">WebSocket URL</span>
            <span className="font-mono text-[12px] text-text select-all break-all">
              {WS_URL ?? 'None'}
            </span>
          </div>

          {/* Version */}
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-text-muted">Version</span>
            <span className="font-mono text-[12px] text-text-muted">{APP_VERSION}</span>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-[13px]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
