import type { StreamState } from '../../hooks/useCameraStream'
import { cn } from '../../lib/utils'

interface LiveBadgeProps {
  state: StreamState
  deviceId: string
  className?: string
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ state, deviceId, className }) => {
  const getLabelAndColor = () => {
    switch (state) {
      case 'live':
        return { label: 'LIVE', textClass: 'text-success', dotClass: 'bg-success animate-pulse-dot' }
      case 'connecting':
        return { label: 'CONNECTING', textClass: 'text-warning', dotClass: 'bg-warning animate-pulse' }
      case 'waiting':
        return { label: 'WAITING', textClass: 'text-warning', dotClass: 'bg-warning' }
      case 'offline':
      default:
        return { label: 'OFFLINE', textClass: 'text-danger', dotClass: 'bg-danger' }
    }
  }

  const { label, textClass, dotClass } = getLabelAndColor()

  return (
    <div
      className={cn(
        'h-6 px-2 rounded-md bg-overlay backdrop-blur-md flex items-center gap-1.5 select-none shrink-0 border border-white/5',
        className
      )}
    >
      {/* State dot */}
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClass)} />

      {/* State label */}
      <span className={cn('text-[11px] font-semibold tracking-[0.06em] uppercase', textClass)}>
        {label}
      </span>

      {/* Divider */}
      <span className="w-[1px] h-2.5 bg-border-strong" />

      {/* Device name */}
      <span className="font-mono text-[12px] font-medium text-text truncate max-w-[140px]">
        {deviceId}
      </span>
    </div>
  )
}
