import type { DeviceInfo } from '../../lib/api'
import { CameraTile } from './CameraTile'

interface WallProps {
  devices: DeviceInfo[]
  onSelectDevice: (deviceId: string) => void
}

export const Wall: React.FC<WallProps> = ({ devices, onSelectDevice }) => {
  if (devices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <span className="text-[14px] font-medium text-text mb-1">No cameras available</span>
        <span className="text-[12px] text-text-muted">Connect a device to see live tiles here.</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-1">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
        {devices.map((device) => (
          <CameraTile
            key={device.device_id}
            deviceId={device.device_id}
            mode="wall"
            onClick={() => onSelectDevice(device.device_id)}
          />
        ))}
      </div>
    </div>
  )
}
