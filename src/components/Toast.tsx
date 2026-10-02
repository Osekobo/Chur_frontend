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
        // Anchored to the top right. Both edges have to be stated: a `fixed` box
        // with only `right` set stays at its static position, below the app on a
        // page whose body does not scroll, which is where this message lived
        // until it was given a bottom edge and no one ever saw it.
        //
        // The safe-area inset keeps it clear of a phone's status bar, and on
        // small screens it starts below the menu bar rather than over it; from
        // `lg` up there is no bar and it sits a plain rem from the top.
        className={[
          'fixed right-4 z-50 max-w-[calc(100vw-2rem)] rounded-lg bg-accent px-4 py-2.5',
          'text-[13px] text-white shadow-lg',
          'top-[calc(env(safe-area-inset-top,0px)+3.75rem)]',
          'lg:top-[calc(env(safe-area-inset-top,0px)+1rem)]',
        ].join(' ')}
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
