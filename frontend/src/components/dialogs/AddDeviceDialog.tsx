import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { API_URL, WS_URL, isLocalBackend } from '../../lib/config'

interface AddDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingDeviceCount: number
  existingDeviceIds?: string[]
}

export const AddDeviceDialog: React.FC<AddDeviceDialogProps> = ({
  open,
  onOpenChange,
  existingDeviceCount,
  existingDeviceIds,
}) => {
  const suggestedId = `camera-${(existingDeviceCount + 1).toString().padStart(3, '0')}`
  const [deviceId, setDeviceId] = useState(suggestedId)
  const [copied, setCopied] = useState(false)

  // Parse server host and port from API_URL
  let serverHost = '127.0.0.1'
  let serverPort = 8000
  if (API_URL) {
    try {
      const parsed = new URL(API_URL)
      serverHost = parsed.hostname
      serverPort = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80
    } catch {
      serverHost = API_URL.replace(/^https?:\/\//, '').split(':')[0]
    }
  }

  const validDeviceId = /^[a-zA-Z0-9_-]{1,64}$/.test(deviceId.trim())
  const effectiveId = validDeviceId ? deviceId.trim() : suggestedId
  const wsEndpoint = WS_URL ? `${WS_URL}/ws/device/${effectiveId}` : `ws://${serverHost}:${serverPort}/ws/device/${effectiveId}`

  const codeSnippet = `#define SERVER_HOST "${serverHost}"
#define SERVER_PORT ${serverPort}          // ${isLocalBackend ? '8000 locally' : '443 in cloud'}
#define DEVICE_ID   "${effectiveId}"
// WebSocket: ${wsEndpoint}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[480px] p-5 gap-4">
        <DialogHeader>
          <DialogTitle>Add device</DialogTitle>
          <DialogDescription>Point an ESP32 at this hub.</DialogDescription>
        </DialogHeader>

        {/* Device ID Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="device-id-input" className="text-[12px] font-medium text-text-muted">
            Device ID
          </label>
          <Input
            id="device-id-input"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="camera-002"
            className="font-mono text-[13px] h-9"
          />
          {!validDeviceId && (
            <span className="text-[11px] text-danger">
              Device ID must be 1-64 alphanumeric characters, hyphens or underscores.
            </span>
          )}
          {validDeviceId && existingDeviceIds?.includes(effectiveId) && (
            <span className="text-[11px] text-warning flex items-center gap-1.5 font-medium">
              ⚠️ Warning: &apos;{effectiveId}&apos; already exists. Two ESPs sharing this ID will disconnect each other and conflict.
            </span>
          )}
        </div>

        {/* Firmware Configuration Code Block */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-text-muted">
            Firmware configuration (C++)
          </span>
          <div className="relative rounded-lg bg-bg border border-border p-3 font-mono text-[12px] text-text leading-relaxed select-all">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy configuration snippet"
              title="Copy snippet"
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-md bg-surface-2 hover:bg-surface text-text-muted hover:text-text flex items-center justify-center transition-colors"
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[12px]" />
            </button>
            <pre className="overflow-x-auto pr-8 m-0 font-mono text-[12px]">
              {codeSnippet}
            </pre>
          </div>
        </div>

        <p className="text-[12px] text-text-muted leading-relaxed">
          {isLocalBackend
            ? 'Ensure your ESP32 is on the same local network as this computer.'
            : 'In Cloud mode, the device must connect with TLS (wss) over port 443.'}
        </p>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-[13px]"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
