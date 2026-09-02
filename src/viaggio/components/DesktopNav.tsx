import { NavLink } from 'react-router-dom'
import Avatar from './Avatar'

const LINK = [
  { to: '', label: 'Gruppi', end: true },
  { to: 'spese', label: 'Spese', end: false },
  { to: 'saldi', label: 'Saldi', end: false },
  { to: 'riepilogo', label: 'Riepiloghi', end: false },
]

export default function DesktopNav({
  slug,
  nomeIo,
  onNuovaSpesa,
}: {
  slug: string
  nomeIo: string | null
  onNuovaSpesa: () => void
}) {
  return (
    <nav className="q-nav q-no-print hidden lg:flex">
      <a href="/" className="q-nav-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        QUOTA
      </a>
      {LINK.map((l) => (
        <NavLink key={l.label} to={`/${slug}${l.to ? `/${l.to}` : ''}`} end={l.end}>
          {l.label}
        </NavLink>
      ))}
      <button type="button" onClick={onNuovaSpesa} className="q-btn q-btn-primary">
        + Nuova spesa
      </button>
      {nomeIo && <Avatar nome={nomeIo} io dimensione={30} />}
    </nav>
  )
}
