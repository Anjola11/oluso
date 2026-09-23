import type { DeviceInfo } from '../../lib/api'
import { CameraTile } from './CameraTile'

interface CameraStripProps {
  devices: DeviceInfo[]
  selectedDeviceId: string
  onSelectDevice: (deviceId: string) => void
}

export const CameraStrip: React.FC<CameraStripProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
}) => {
  if (devices.length <= 1) return null

  return (
    <div
      aria-label="Camera list preview"
      className="h-[108px] w-full shrink-0 flex items-center gap-3 overflow-x-auto py-2 px-1 select-none"
    >
      {devices.map((device) => (
        <CameraTile
          key={device.device_id}
          deviceId={device.device_id}
          mode="thumb"
          isSelected={device.device_id === selectedDeviceId}
          onClick={() => onSelectDevice(device.device_id)}
        />
      ))}
    </div>
  )
}
