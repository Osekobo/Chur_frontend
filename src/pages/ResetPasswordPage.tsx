/**
 * Set a new password from an emailed reset link.
 *
 * The server hands out links shaped like
 * `${FRONTEND_URL}/reset-password?token=…` (build_reset_url in
 * app/services/notifications.py), so the token arrives in the query string and is
 * posted straight back to /auth/reset-password.
 *
 * The token is single use: on success the server marks it used and deletes every
 * refresh token for the account, which is why this screen ends by sending the
 * user back to /login rather than into the app.
 */

import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Icon } from '@/components/Icon'

import { authApi } from '@/api/endpoints'
import { Field, SubmitButton } from '@/components/form'
import { PASSWORD_MIN_LENGTH, passwordProblem } from '@/lib/password'

const inputClass =
  'w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const problem = passwordProblem(password)
    if (problem !== null) {
      setError(problem)
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setPending(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (cause: unknown) {
      // The server answers 400 for an unknown, spent or expired token; its
      // message already says so, so pass it straight through.
      setError(cause instanceof Error ? cause.message : 'Could not reset your password.')
    } finally {
      setPending(false)
    }
  }

  const card = 'w-full max-w-[380px] rounded-[10px] border border-line bg-card p-4 sm:p-6'
  const heading = (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent2/15 text-accent2">
        <Icon name="church" className="text-[18px]" />
      </span>
      <h1 className="m-0 text-[19px]">Church Finance</h1>
    </div>
  )

  if (done) {
    return (
      <div className="flex h-full items-center justify-center bg-bg p-5">
        <div className={card}>
          {heading}
          <div className="mb-4 text-[13px]">
            Your password has been updated. Sign in with the new one.
          </div>
          <button type="button" className="ghost" onClick={() => navigate('/login')}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (token === '') {
    return (
      <div className="flex h-full items-center justify-center bg-bg p-5">
        <div className={card}>
          {heading}
          <div className="mb-4 text-[13px] text-muted">
            This link is missing its reset token, so it cannot be used. Request a new
            reset email and open the link straight from that message.
          </div>
          <button type="button" className="ghost" onClick={() => navigate('/login')}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center bg-bg p-5">
      <div className={card}>
        {heading}
        <div className="mb-4 text-[13px] text-muted">
          Choose a new password for your account.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2.5">
            <Field label="New password">
              {(id) => (
                <input
                  id={id}
                  name="password"
                  type="password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Confirm new password">
              {(id) => (
                <input
                  id={id}
                  name="confirm_password"
                  type="password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            <div>
              <SubmitButton pending={pending}>Update password</SubmitButton>
            </div>
          </div>
        </form>

        {error ? <div className="neg mt-3 text-[13px]">{error}</div> : null}

        <div className="mt-4 border-t border-line pt-3 text-[12px] text-muted">
          Passwords need at least {PASSWORD_MIN_LENGTH} characters, including a letter
          and a number.
        </div>
      </div>
    </div>
  )
}