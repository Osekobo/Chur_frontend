/**
 * Sign in, and create an account where the server allows public registration.
 *
 * This screen is not in mm.html, which read from shared storage without an
 * account. Every backend endpoint requires a bearer token, so the app needs a
 * way in before the sidebar can load any data.
 */

import { useState, type FormEvent } from 'react'

import { Icon } from '@/components/Icon'

import { useAuth } from '@/auth/AuthContext'
import { authApi } from '@/api/endpoints'
import { Field, SubmitButton, TextInput } from '@/components/form'
import { useQuery } from '@/hooks/useQuery'
import { PASSWORD_MIN_LENGTH, passwordProblem } from '@/lib/password'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Until this lands `data` is null, so the sign-up toggle stays hidden rather
  // than flashing up on a deployment that has ALLOW_PUBLIC_REGISTRATION off.
  const config = useQuery(() => authApi.config(), [])
  const canRegister = config.data?.allow_public_registration === true

  const signingUp = mode === 'signup'

  function switchMode(next: Mode) {
    setMode(next)
    // Carry the email across so switching modes does not retype it.
    setConfirm('')
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (signingUp) {
      const problem = passwordProblem(password)
      if (problem !== null) {
        setError(problem)
        return
      }
      if (password !== confirm) {
        setError('The two passwords do not match.')
        return
      }
    }

    setPending(true)
    try {
      if (signingUp) {
        await register(email, fullName, password)
      } else {
        await login(email, password)
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-bg p-5">
      <div
        className="w-full max-w-[380px] rounded-[10px] border border-line bg-card p-4 sm:p-6"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent2/15 text-accent2">
            <Icon name="church" className="text-[18px]" />
          </span>
          <h1 className="m-0 text-[19px]">Church Finance</h1>
        </div>
        <div className="mb-4 text-[13px] text-muted">
          {signingUp ? 'Create an account to open the church ledger.' : 'Sign in to open the church ledger.'}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2.5">
            <Field label="Email">
              {(id) => (
                <TextInput
                  id={id}
                  name="email"
                  type="text"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            {signingUp ? (
              <Field label="Full name">
                {(id) => (
                  <TextInput
                    id={id}
                    name="full_name"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                )}
              </Field>
            ) : null}
            <Field label="Password">
              {(id) => (
                <input
                  id={id}
                  name="password"
                  type="password"
                  required
                  minLength={signingUp ? PASSWORD_MIN_LENGTH : 1}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
                />
              )}
            </Field>
            {signingUp ? (
              <Field label="Confirm password">
                {(id) => (
                  <input
                    id={id}
                    name="confirm_password"
                    type="password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
                  />
                )}
              </Field>
            ) : null}
            <div>
              <SubmitButton pending={pending}>
                {signingUp ? 'Create account' : 'Sign in'}
              </SubmitButton>
            </div>
          </div>
        </form>

        {error ? <div className="neg mt-3 text-[13px]">{error}</div> : null}

        <div className="mt-4 border-t border-line pt-3 text-[12px] text-muted">
          {canRegister ? (
            <button
              type="button"
              className="ghost"
              onClick={() => switchMode(signingUp ? 'signin' : 'signup')}
            >
              {signingUp ? 'Already have an account? Sign in' : 'Create an account'}
            </button>
          ) : (
            <span>Ask an administrator for an account if you do not have one yet.</span>
          )}
          {signingUp ? (
            <div className="mt-2">
              Passwords need at least {PASSWORD_MIN_LENGTH} characters, including a letter and a number.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}