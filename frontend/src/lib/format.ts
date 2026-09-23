export function formatBytesToKB(bytes: number): string {
  if (bytes <= 0) return '—'
  const kb = bytes / 1024
  return `${kb.toFixed(1)} KB`
}

export function formatBitrate(bps: number): string {
  if (bps <= 0) return '—'
  const mbps = bps / (1024 * 1024)
  if (mbps >= 1) {
    return `${mbps.toFixed(1)} Mbps`
  }
  const kbps = bps / 1024
  return `${kbps.toFixed(0)} kbps`
}

export function formatElapsedTime(seconds: number): string {
  if (seconds < 0 || isNaN(seconds)) return '—'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatTimeOnly(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function formatRelativeTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d`
}

export function formatSnapshotFilename(deviceId: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const ss = now.getSeconds().toString().padStart(2, '0')
  return `${deviceId}_${y}${m}${d}_${hh}${mm}${ss}.jpg`
}
