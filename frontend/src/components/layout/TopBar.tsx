import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faVideo, faPlus, faGear, faTableColumns, faGrip } from '@fortawesome/free-solid-svg-icons'
import { APP_NAME } from '../../lib/config'
import { cn } from '../../lib/utils'

interface TopBarProps {
  currentView: 'focus' | 'wall'
  onViewChange: (view: 'focus' | 'wall') => void
  onAddDevice: () => void
  onOpenSettings: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  onAddDevice,
  onOpenSettings,
}) => {
  return (
    <header className="h-[52px] w-full bg-surface-rail border-b border-border px-3 flex items-center gap-3 shrink-0 select-none z-30 pt-[env(safe-area-inset-top)]">
      {/* Logo */}
      <div className="w-7 h-7 rounded-[8px] bg-accent flex items-center justify-center text-white shrink-0">
        <FontAwesomeIcon icon={faVideo} className="text-[12px]" />
      </div>

      {/* App Name */}
      <span className="text-[14px] font-semibold text-text truncate">{APP_NAME}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Segmented View Control */}
      <div className="h-8 bg-surface-2 p-[2px] rounded-lg flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onViewChange('focus')}
          aria-label="Focus view"
          className={cn(
            'h-7 px-2.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1.5 transition-colors',
            currentView === 'focus' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
          )}
        >
          <FontAwesomeIcon icon={faTableColumns} className="text-[11px]" />
          <span>Focus</span>
        </button>
        <button
          type="button"
          onClick={() => onViewChange('wall')}
          aria-label="Wall view"
          className={cn(
            'h-7 px-2.5 rounded-[6px] text-[12px] font-medium flex items-center gap-1.5 transition-colors',
            currentView === 'wall' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
          )}
        >
          <FontAwesomeIcon icon={faGrip} className="text-[11px]" />
          <span>Wall</span>
        </button>
      </div>

      {/* Add Device Button */}
      <button
        type="button"
        onClick={onAddDevice}
        aria-label="Add device"
        className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center transition-colors hover:bg-accent-hover"
      >
        <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
      </button>

      {/* Settings Button */}
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Settings"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
      >
        <FontAwesomeIcon icon={faGear} className="text-[14px]" />
      </button>
    </header>
  )
}
