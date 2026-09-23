import React, { useState, useEffect, useRef } from 'react'
import { IconRail } from './IconRail'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BackendBanner } from './BackendBanner'
import { ConfigError } from './ConfigError'
import { DeviceList } from '../devices/DeviceList'
import { ActivityPanel } from '../activity/ActivityPanel'
import { CameraTile } from '../stream/CameraTile'
import { CameraStrip } from '../stream/CameraStrip'
import { Wall } from '../stream/Wall'
import { AddDeviceDialog } from '../dialogs/AddDeviceDialog'
import { SettingsDialog } from '../dialogs/SettingsDialog'
import { useDevices } from '../../hooks/useDevices'
import { useBackendHealth } from '../../hooks/useBackendHealth'
import { useActivityLog } from '../../hooks/useActivityLog'
import { checkConfigError, DEFAULT_DEVICE_ID } from '../../lib/config'
import { cn } from '../../lib/utils'

export const AppShell: React.FC = () => {
  // Check for critical configuration errors first
  const configError = checkConfigError()

  // Responsive breakpoint tracking
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  )

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = viewportWidth < 1024
  const isTablet = viewportWidth >= 1024 && viewportWidth < 1280

  // URL query params synchronization (?device=camera-001&view=focus)
  const [currentView, setCurrentView] = useState<'focus' | 'wall'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const v = params.get('view')
      if (v === 'wall' || v === 'focus') return v
    }
    return 'focus'
  })

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const d = params.get('device')
      if (d) return d
    }
    return DEFAULT_DEVICE_ID
  })

  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('streaming_sidebar_collapsed') === 'true'
    }
    return false
  })

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('streaming_sidebar_collapsed', String(next))
      return next
    })
  }

  // Modals state
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Live polling hooks
  const { devices } = useDevices()
  const health = useBackendHealth()
  const { events, addEvent, clearEvents } = useActivityLog()

  // Accessibility announcement message
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('')

  // Sync selected device if query param wasn't set and devices load
  useEffect(() => {
    if (devices.length > 0) {
      const exists = devices.some((d) => d.device_id === selectedDeviceId)
      if (!exists) {
        const firstOnline = devices.find((d) => d.online)?.device_id
        if (firstOnline) {
          handleSelectDevice(firstOnline)
        }
      }
    }
  }, [devices, selectedDeviceId])

  // Track online/offline transitions for activity log
  const prevDeviceStateRef = useRef<Map<string, boolean | null>>(new Map())
  useEffect(() => {
    const prevMap = prevDeviceStateRef.current
    for (const dev of devices) {
      const prev = prevMap.get(dev.device_id)
      if (prev !== undefined && prev !== dev.online) {
        if (dev.online === true) {
          addEvent('online', `${dev.device_id} came online`)
          setAriaAnnouncement(`${dev.device_id} is online`)
        } else if (dev.online === false && prev === true) {
          addEvent('offline', `${dev.device_id} went offline`)
          setAriaAnnouncement(`${dev.device_id} went offline`)
        }
      }
      prevMap.set(dev.device_id, dev.online)
    }
  }, [devices, addEvent])

  // Track backend health transitions
  const prevHealthRef = useRef<string>(health)
  useEffect(() => {
    if (prevHealthRef.current !== health) {
      if (health === 'down') {
        addEvent('error', 'Backend health check failed')
      } else if (health === 'ok' && prevHealthRef.current === 'down') {
        addEvent('online', 'Backend connection restored')
      }
      prevHealthRef.current = health
    }
  }, [health, addEvent])

  // Update URL query params without reload
  const updateUrlParams = (deviceId: string, view: 'focus' | 'wall') => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('device', deviceId)
      params.set('view', view)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState(null, '', newUrl)
    }
  }

  const handleSelectDevice = (id: string) => {
    setSelectedDeviceId(id)
    updateUrlParams(id, currentView)
  }

  const handleViewChange = (view: 'focus' | 'wall') => {
    setCurrentView(view)
    updateUrlParams(selectedDeviceId, view)
  }

  // Count online devices
  const onlineCount = devices.filter((d) => d.online === true).length

  if (configError) {
    return <ConfigError type={configError.type} message={configError.message} />
  }

  return (
    <div className="h-[100dvh] w-screen bg-bg text-text flex flex-col overflow-hidden select-none">
      {/* Visually Hidden Aria-Live Polite Region */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        aria-atomic="true"
      >
        {ariaAnnouncement}
      </div>

      {/* Mobile TopBar for viewports < 1024px */}
      {isMobile && (
        <TopBar
          currentView={currentView}
          onViewChange={handleViewChange}
          onAddDevice={() => setAddDeviceOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Desktop / Tablet Container */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Left Rail (Desktop & Tablet) */}
        {!isMobile && (
          <IconRail
            currentView={currentView}
            onViewChange={handleViewChange}
            showViewSwitch={isTablet || isSidebarCollapsed}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {/* Sidebar (Desktop only when not collapsed) */}
        {!isMobile && !isTablet && !isSidebarCollapsed && (
          <Sidebar
            currentView={currentView}
            onViewChange={handleViewChange}
            onCollapse={toggleSidebarCollapse}
            health={health}
            onlineDeviceCount={onlineCount}
            onAddDevice={() => setAddDeviceOpen(true)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 h-full p-3 flex flex-col gap-3 overflow-hidden bg-bg">
          {/* Backend failure banner */}
          {health === 'down' && <BackendBanner />}

          {/* Mobile view content layout */}
          {isMobile ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
              {currentView === 'focus' ? (
                <>
                  {/* Focus Video Feed */}
                  <div className="w-full shrink-0 aspect-[4/3] max-h-[50vh]">
                    <CameraTile
                      deviceId={selectedDeviceId}
                      mode="focus"
                      onStateChange={(state) => {
                        if (state === 'live') {
                          setAriaAnnouncement(`${selectedDeviceId} feed is live`)
                        }
                      }}
                    />
                  </div>

                  {/* Horizontal Device Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0 select-none">
                    {devices.map((d) => (
                      <button
                        key={d.device_id}
                        type="button"
                        onClick={() => handleSelectDevice(d.device_id)}
                        className={cn(
                          'h-8 px-3 rounded-lg flex items-center gap-2 font-mono text-[12px] whitespace-nowrap border shrink-0',
                          d.device_id === selectedDeviceId
                            ? 'bg-accent-soft text-text border-accent/40'
                            : 'bg-surface-2 text-text-muted border-transparent hover:text-text'
                        )}
                      >
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            d.online ? 'bg-success' : 'bg-danger'
                          )}
                        />
                        <span>{d.device_id}</span>
                      </button>
                    ))}
                  </div>

                  {/* Activity Panel */}
                  <div className="flex-1 min-h-[220px]">
                    <ActivityPanel events={events} onClear={clearEvents} />
                  </div>
                </>
              ) : (
                <Wall
                  devices={devices}
                  onSelectDevice={(id) => {
                    handleSelectDevice(id)
                    handleViewChange('focus')
                  }}
                />
              )}
            </div>
          ) : (
            /* Desktop / Tablet Layout */
            <div className="flex-1 flex min-h-0 w-full gap-3 overflow-hidden">
              {currentView === 'focus' ? (
                <>
                  {/* Left Column: Stacked Devices and Activity panels */}
                  <div className={cn('flex flex-col gap-3 shrink-0 h-full', isTablet ? 'w-[260px]' : 'w-[300px]')}>
                    <DeviceList
                      devices={devices}
                      selectedDeviceId={selectedDeviceId}
                      onSelectDevice={handleSelectDevice}
                    />
                    <ActivityPanel events={events} onClear={clearEvents} />
                  </div>

                  {/* Right Column: Focus Feed Panel + CameraStrip if >1 device */}
                  <div className="flex-1 min-w-0 h-full flex flex-col gap-3 overflow-hidden">
                    <CameraTile
                      deviceId={selectedDeviceId}
                      mode="focus"
                      onStateChange={(state) => {
                        if (state === 'live') {
                          setAriaAnnouncement(`${selectedDeviceId} feed is live`)
                        }
                      }}
                    />

                    {/* Camera strip when multiple devices exist */}
                    <CameraStrip
                      devices={devices}
                      selectedDeviceId={selectedDeviceId}
                      onSelectDevice={handleSelectDevice}
                    />
                  </div>
                </>
              ) : (
                /* Wall View */
                <Wall
                  devices={devices}
                  onSelectDevice={(id) => {
                    handleSelectDevice(id)
                    handleViewChange('focus')
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Add Device Dialog */}
      <AddDeviceDialog
        open={addDeviceOpen}
        onOpenChange={setAddDeviceOpen}
        existingDeviceCount={devices.length}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        health={health}
        onlineDeviceCount={onlineCount}
      />
    </div>
  )
}
