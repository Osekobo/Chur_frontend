/** Transient message shown in the corner, matching mm.html's `#toast`. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface ToastContextValue {
  toast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DURATION_MS = 2000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const toast = useCallback((text: string) => {
    setMessage(text)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), DURATION_MS)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{ display: message ? 'block' : 'none' }}
        // `bottom` is what puts this on screen. Without it a `fixed` box with
        // only `right` set stays at its static position - below the app, on a
        // page whose body cannot scroll - so the message was written and never
        // seen. mm.html's #toast is `bottom:16px; right:16px`.
        className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg bg-accent px-4 py-2.5 text-[13px] text-white"
      >
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): (message: string) => void {
  const context = useContext(ToastContext)
  if (context === null) throw new Error('useToast must be used inside <ToastProvider>')
  return context.toast
}
