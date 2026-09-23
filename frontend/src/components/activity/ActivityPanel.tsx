import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrashCan,
  faLink,
  faLinkSlash,
  faRotate,
  faTriangleExclamation,
  faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons'
import type { ActivityEvent, ActivityType } from '../../hooks/useActivityLog'
import { formatTimeOnly, formatRelativeTime } from '../../lib/format'
import { ScrollArea } from '../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { cn } from '../../lib/utils'

interface ActivityPanelProps {
  events: ActivityEvent[]
  onClear: () => void
}

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ events, onClear }) => {
  const getIconAndStyle = (type: ActivityType) => {
    switch (type) {
      case 'online':
        return { icon: faLink, bgClass: 'bg-success/12', textClass: 'text-success' }
      case 'offline':
        return { icon: faLinkSlash, bgClass: 'bg-danger/12', textClass: 'text-danger' }
      case 'reconnecting':
        return { icon: faRotate, bgClass: 'bg-warning/12', textClass: 'text-warning' }
      case 'error':
      default:
        return { icon: faTriangleExclamation, bgClass: 'bg-danger/12', textClass: 'text-danger' }
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-surface border border-border rounded-xl flex flex-col flex-1 min-h-[220px] overflow-hidden select-none">
        {/* Header */}
        <div className="h-11 px-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text">Activity</span>
            <span className="h-[18px] px-1.5 rounded-md bg-surface-2 font-mono text-[11px] text-text-muted flex items-center tabular-nums">
              {events.length}
            </span>
          </div>

          {events.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClear}
                  aria-label="Clear activity log"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-[12px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                Clear
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Event List or Empty State */}
        {events.length > 0 ? (
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/60">
              {events.map((evt) => {
                const { icon, bgClass, textClass } = getIconAndStyle(evt.type)
                return (
                  <div
                    key={evt.id}
                    className="h-[52px] px-3 flex items-center gap-3 transition-colors hover:bg-surface-2/40"
                  >
                    {/* Event Icon Tile */}
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        bgClass
                      )}
                    >
                      <FontAwesomeIcon icon={icon} className={cn('text-[12px]', textClass)} />
                    </div>

                    {/* Event Details */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13px] font-medium text-text truncate">
                        {evt.title}
                      </span>
                      <span className="font-mono text-[11px] text-text-muted tabular-nums">
                        {formatTimeOnly(evt.timestamp)}
                      </span>
                    </div>

                    {/* Relative Time */}
                    <span className="text-[11px] text-text-muted shrink-0 tabular-nums">
                      {formatRelativeTime(evt.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <FontAwesomeIcon
              icon={faClockRotateLeft}
              className="text-[20px] text-text-faint mb-2"
            />
            <span className="text-[13px] font-medium text-text mb-1">No activity yet</span>
            <span className="text-[12px] text-text-muted max-w-[200px]">
              Events appear when devices connect or drop.
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
