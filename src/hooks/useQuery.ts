/**
 * Small query hooks.
 *
 * The screens need fetch + loading + error + refetch and nothing more, so this
 * replaces a query library rather than pulling one in. A `deps` array behaves
 * like a dependency list: change it and the request runs again.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/api/client'

export interface QueryState<T> {
  data: T | null
  error: string | null
  loading: boolean
  refetch: () => void
}

export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  /** When false the request is skipped and the previous data is kept. */
  enabled = true,
): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  // Keep the latest fetcher without making it a dependency: callers pass
  // inline arrow functions, which would otherwise refetch on every render.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let active = true

    setLoading(true)
    // Clear the previous failure up front. `Async` checks `error` before `data`,
    // so leaving it set would keep showing the old error (and its retry button)
    // while the new request is still in flight.
    setError(null)
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return
        setData(result)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return
        setError(cause instanceof ApiError ? cause.message : 'Could not reach the server.')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [...deps, nonce, enabled])

  const refetch = useCallback(() => setNonce((value) => value + 1), [])

  return { data, error, loading, refetch }
}

export interface MutationState<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | null>
  pending: boolean
  error: string | null
  /**
   * The failure message from the most recent `run`, or null if it succeeded.
   *
   * Read this instead of `error` inside a `.then()` continuation: `run` resolves
   * before React commits the `setError` above, so `error` is still null there on
   * the first attempt and the caller would show a generic message.
   */
  getError: () => string | null
  reset: () => void
}

/** Wrap a write call, tracking pending state and the error message for the toast. */
export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  onSuccess?: (result: TResult) => void,
): MutationState<TArgs, TResult> {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actionRef = useRef(action)
  actionRef.current = action
  const successRef = useRef(onSuccess)
  successRef.current = onSuccess
  // Mirrors `error` so callers can read it synchronously, before React commits.
  const errorRef = useRef<string | null>(null)

  const run = useCallback(async (...args: TArgs): Promise<TResult | null> => {
    setPending(true)
    setError(null)
    errorRef.current = null
    try {
      const result = await actionRef.current(...args)
      successRef.current?.(result)
      return result
    } catch (cause: unknown) {
      const message =
        cause instanceof ApiError ? cause.message : 'Something went wrong. Please try again.'
      errorRef.current = message
      setError(message)
      return null
    } finally {
      setPending(false)
    }
  }, [])

  const getError = useCallback(() => errorRef.current, [])

  const reset = useCallback(() => {
    errorRef.current = null
    setError(null)
  }, [])

  return { run, pending, error, getError, reset }
}

/** Debounce a value, used by the contribution search box. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
