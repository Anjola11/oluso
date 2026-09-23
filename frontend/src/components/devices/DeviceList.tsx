import React, { useState, useMemo, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import type { DeviceInfo } from '../../lib/api'
import { DeviceRow } from './DeviceRow'
import { ScrollArea } from '../ui/scroll-area'

interface DeviceListProps {
  devices: DeviceInfo[]
  selectedDeviceId: string
  onSelectDevice: (deviceId: string) => void
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([])

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices
    const q = searchQuery.toLowerCase()
    return devices.filter((d) => d.device_id.toLowerCase().includes(q))
  }, [devices, searchQuery])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = (index + 1) % filteredDevices.length
      rowRefs.current[next]?.focus()
      onSelectDevice(filteredDevices[next].device_id)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = (index - 1 + filteredDevices.length) % filteredDevices.length
      rowRefs.current[prev]?.focus()
      onSelectDevice(filteredDevices[prev].device_id)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col flex-1 min-h-[220px] overflow-hidden select-none">
      {/* Header Row */}
      <div className="h-11 px-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text">Devices</span>
          <span className="h-[18px] px-1.5 rounded-md bg-surface-2 font-mono text-[11px] text-text-muted flex items-center tabular-nums">
            {devices.length}
          </span>
        </div>
      </div>

      {/* Search Input (only shown when >1 devices exist) */}
      {devices.length > 1 && (
        <div className="p-2 pb-0 shrink-0">
          <div className="relative flex items-center">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-2.5 text-text-faint text-[12px] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices"
              className="h-8 w-full rounded-lg bg-surface-2 pl-8 pr-3 text-[12px] text-text placeholder:text-text-faint border border-transparent focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Scrollable Device List */}
      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-1" role="listbox" aria-label="Devices">
          {filteredDevices.map((device, idx) => (
            <DeviceRow
              key={device.device_id}
              ref={(el) => {
                rowRefs.current[idx] = el
              }}
              device={device}
              isSelected={device.device_id === selectedDeviceId}
              onSelect={() => onSelectDevice(device.device_id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            />
          ))}

          {filteredDevices.length === 0 && (
            <div className="p-4 text-center text-[12px] text-text-muted">
              No matching devices found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
