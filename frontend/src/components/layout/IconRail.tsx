import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faVideo,
  faGrip,
  faClockRotateLeft,
  faGear,
  faTableColumns,
} from '@fortawesome/free-solid-svg-icons'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { cn } from '../../lib/utils'

interface IconRailProps {
  currentView: 'focus' | 'wall'
  onViewChange: (view: 'focus' | 'wall') => void
  showViewSwitch?: boolean
  onOpenSettings: () => void
}

export const IconRail: React.FC<IconRailProps> = ({
  currentView,
  onViewChange,
  showViewSwitch = false,
  onOpenSettings,
}) => {
  return (
    <TooltipProvider delayDuration={200}>
      <aside className="w-[56px] h-full bg-surface-rail border-r border-border flex flex-col items-center py-4 select-none shrink-0 relative z-20">
        {/* Logo Tile */}
        <div
          className="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center text-white shrink-0 mb-6 shadow-none"
          title="Streaming Hub"
        >
          <FontAwesomeIcon icon={faVideo} className="text-[14px]" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 w-full items-center">
          {/* Live nav button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Live view"
                onClick={() => onViewChange('focus')}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative',
                  currentView === 'focus' || currentView === 'wall'
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                )}
              >
                {/* Active accent bar */}
                {(currentView === 'focus' || currentView === 'wall') && (
                  <span className="absolute left-0 top-[10px] bottom-[10px] w-[2px] bg-accent rounded-r" />
                )}
                <FontAwesomeIcon icon={faGrip} className="text-[16px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Live Streams
            </TooltipContent>
          </Tooltip>

          {/* If sidebar is hidden in 1024-1279 range, show Focus and Wall in Rail */}
          {showViewSwitch && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Focus view"
                    onClick={() => onViewChange('focus')}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative',
                      currentView === 'focus'
                        ? 'bg-accent-soft text-accent'
                        : 'text-text-muted hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    <FontAwesomeIcon icon={faTableColumns} className="text-[15px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Focus View
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Wall view"
                    onClick={() => onViewChange('wall')}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative',
                      currentView === 'wall'
                        ? 'bg-accent-soft text-accent'
                        : 'text-text-muted hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    <FontAwesomeIcon icon={faGrip} className="text-[15px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Wall View
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Recordings button - disabled with tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                aria-label="Recordings (Coming soon)"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-faint cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faClockRotateLeft} className="text-[16px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Coming soon
            </TooltipContent>
          </Tooltip>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pinned Settings Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Settings"
              onClick={onOpenSettings}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
            >
              <FontAwesomeIcon icon={faGear} className="text-[16px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Settings
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
