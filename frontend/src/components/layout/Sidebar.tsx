import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesLeft, faTableColumns, faGrip } from '@fortawesome/free-solid-svg-icons'
import { ConnectionCard } from './ConnectionCard'
import type { HealthStatus } from '../../hooks/useBackendHealth'
import { cn } from '../../lib/utils'

interface SidebarProps {
  currentView: 'focus' | 'wall'
  onViewChange: (view: 'focus' | 'wall') => void
  onCollapse: () => void
  health: HealthStatus
  onlineDeviceCount: number
  onAddDevice: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onCollapse,
  health,
  onlineDeviceCount,
  onAddDevice,
}) => {
  return (
    <aside className="w-[240px] h-full bg-surface-rail border-r border-border p-3 pt-5 flex flex-col justify-between shrink-0 select-none z-10">
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between px-1">
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.01em] text-text">
            Views
          </h1>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
          >
            <FontAwesomeIcon icon={faAnglesLeft} className="text-[12px]" />
          </button>
        </div>

        {/* View Selection List */}
        <nav className="mt-6 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onViewChange('focus')}
            className={cn(
              'h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-colors text-left w-full',
              currentView === 'focus'
                ? 'bg-surface-2 text-text'
                : 'text-text-muted hover:bg-surface-2/60 hover:text-text'
            )}
          >
            <div className="w-5 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faTableColumns}
                className={cn('text-[14px]', currentView === 'focus' ? 'text-accent' : 'text-text-muted')}
              />
            </div>
            <span>Focus</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('wall')}
            className={cn(
              'h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-colors text-left w-full',
              currentView === 'wall'
                ? 'bg-surface-2 text-text'
                : 'text-text-muted hover:bg-surface-2/60 hover:text-text'
            )}
          >
            <div className="w-5 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faGrip}
                className={cn('text-[14px]', currentView === 'wall' ? 'text-accent' : 'text-text-muted')}
              />
            </div>
            <span>Wall</span>
          </button>
        </nav>
      </div>

      {/* Pinned Connection Card */}
      <div className="mb-1">
        <ConnectionCard
          health={health}
          onlineDeviceCount={onlineDeviceCount}
          onAddDevice={onAddDevice}
        />
      </div>
    </aside>
  )
}
