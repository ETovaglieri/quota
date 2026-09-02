import { NavLink } from 'react-router-dom'
import { Map, Receipt, Scale, FileText } from 'lucide-react'

const TAB = [
  { to: '', label: 'Viaggio', icona: Map, end: true },
  { to: 'spese', label: 'Spese', icona: Receipt, end: false },
  { to: 'saldi', label: 'Saldi', icona: Scale, end: false },
  { to: 'riepilogo', label: 'Riepilogo', icona: FileText, end: false },
]

export default function TabBar({ slug }: { slug: string }) {
  return (
    <nav className="q-tabbar q-no-print grid lg:hidden">
      {TAB.map((t) => (
        <NavLink key={t.label} to={`/${slug}${t.to ? `/${t.to}` : ''}`} end={t.end}>
          <t.icona size={18} strokeWidth={2} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
