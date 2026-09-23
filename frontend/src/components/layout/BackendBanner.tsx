import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { API_URL } from '../../lib/config'

export const BackendBanner: React.FC = () => {
  let host = 'server'
  if (API_URL) {
    try {
      host = new URL(API_URL).host
    } catch {
      host = API_URL.replace(/^https?:\/\//, '')
    }
  }

  return (
    <div
      role="alert"
      className="h-9 px-3 w-full bg-danger/10 border border-danger/35 rounded-lg flex items-center gap-2.5 text-[12px] text-text shrink-0"
    >
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-danger text-[13px]" />
      <span>Can't reach the backend at {host}. Retrying…</span>
    </div>
  )
}
