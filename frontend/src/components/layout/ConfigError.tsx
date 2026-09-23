import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

interface ConfigErrorProps {
  type: 'missing_api' | 'mixed_content'
  message: string
}

export const ConfigError: React.FC<ConfigErrorProps> = ({ type, message }) => {
  return (
    <div className="h-screen w-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-danger/10 border border-danger/30 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-danger text-[16px]" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text">Configuration Error</h2>
            <p className="text-[12px] text-text-muted">
              {type === 'missing_api' ? 'Missing environment variable' : 'Security / Mixed Content'}
            </p>
          </div>
        </div>

        <p className="text-[13px] text-text leading-relaxed">{message}</p>

        {type === 'missing_api' && (
          <div className="bg-bg border border-border rounded-lg p-3 font-mono text-[12px] text-text-muted flex flex-col gap-1">
            <span className="text-text-faint"># Vercel Project Settings &gt; Environment Variables</span>
            <span className="text-text select-all">VITE_API_URL=https://&lt;your-heroku-app&gt;.herokuapp.com</span>
          </div>
        )}

        {type === 'mixed_content' && (
          <div className="bg-bg border border-border rounded-lg p-3 font-mono text-[12px] text-text-muted flex flex-col gap-1">
            <span className="text-text-faint"># Use HTTPS for remote cloud backends</span>
            <span className="text-text select-all">VITE_API_URL=https://...</span>
          </div>
        )}
      </div>
    </div>
  )
}
