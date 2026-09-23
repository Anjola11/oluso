import { API_URL } from './config'

export interface DeviceInfo {
  device_id: string
  online: boolean | null
  viewers: number
  last_frame_at?: number | null
}

export async function fetchDevices(signal?: AbortSignal): Promise<DeviceInfo[]> {
  if (!API_URL) {
    throw new Error('API_URL is not configured')
  }

  const res = await fetch(`${API_URL}/api/devices`, { signal })
  if (!res.ok) {
    throw new Error(`Failed to fetch devices: HTTP ${res.status}`)
  }

  return (await res.json()) as DeviceInfo[]
}

export async function fetchHealth(signal?: AbortSignal): Promise<boolean> {
  if (!API_URL) return false

  try {
    let res = await fetch(`${API_URL}/health`, { signal })
    if (res.status === 404) {
      res = await fetch(`${API_URL}/`, { signal })
    }
    if (!res.ok) return false
    const data = await res.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
