import { forwardRef, type KeyboardEvent } from 'react'
import type { DeviceInfo } from '../../lib/api'
import { cn } from '../../lib/utils'

interface DeviceRowProps {
  device: DeviceInfo
  isSelected: boolean
  onSelect: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void
}

export const DeviceRow = forwardRef<HTMLButtonElement, DeviceRowProps>(
  ({ device, isSelected, onSelect, onKeyDown }, ref) => {
    const isOnline = device.online === true
    const isOffline = device.online === false
    const isChecking = device.online === null

    const viewerText =
      device.viewers === 1 ? '1 viewer' : `${device.viewers} viewers`

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full h-11 px-2.5 rounded-lg flex items-center gap-2.5 transition-colors text-left select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-accent',
          isSelected
            ? 'bg-accent-soft border border-accent/35 text-text'
            : 'bg-transparent hover:bg-surface-2 border border-transparent text-text'
        )}
      >
        {/* Status Dot */}
        <div className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isOnline && 'bg-success',
              isOffline && 'bg-danger',
              isChecking && 'bg-warning animate-pulse'
            )}
          />
          {isOnline && (
            <span className="absolute w-2 h-2 rounded-full bg-success/60 animate-pulse-dot pointer-events-none" />
          )}
        </div>

        {/* Device Name (ID) */}
        <span className="font-mono text-[13px] font-medium truncate flex-1 text-text">
          {device.device_id}
        </span>

        {/* Right Status / Viewers Chip */}
        <div className="h-5 px-1.5 rounded-md bg-surface-2 flex items-center shrink-0 border border-white/5">
          {isOnline ? (
            <span className="text-[11px] font-medium text-text-muted tabular-nums">
              {viewerText}
            </span>
          ) : isChecking ? (
            <span className="text-[11px] font-medium text-warning">Checking</span>
          ) : (
            <span className="text-[11px] font-medium text-danger">Offline</span>
          )}
        </div>
      </button>
    )
  }
)

DeviceRow.displayName = 'DeviceRow'
