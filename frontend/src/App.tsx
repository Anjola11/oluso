import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <>
      <AppShell />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '10px',
            fontFamily: 'inherit',
          },
        }}
      />
    </>
  )
}
