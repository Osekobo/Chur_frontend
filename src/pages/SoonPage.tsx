/** Fallback for a link that no longer exists, e.g. an old bookmark. */

import { Link, useParams } from 'react-router-dom'

export function SoonPage() {
  const params = useParams<{ name: string }>()
  const name = params.name ?? 'This screen'

  return (
    <div className="soon">
      <b>{name}</b>
      This screen has been replaced — the section it stood for now lives somewhere else in the menu.
      If you followed a saved link, the Dashboard has the current list of screens.
      <div style={{ marginTop: 12 }}>
        <Link to="/dashboard">Go to the Dashboard</Link>
      </div>
    </div>
  )
}
