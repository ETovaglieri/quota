import { Plane, BedDouble, Car, Utensils, Ticket, MoreHorizontal, type LucideIcon } from 'lucide-react'
import type { CategoriaSpesaViaggio } from '../../lib/database.types'

export const CATEGORIE: { valore: CategoriaSpesaViaggio; etichetta: string; codice: string; icona: LucideIcon }[] = [
  { valore: 'voli', etichetta: 'Voli', codice: 'VOL', icona: Plane },
  { valore: 'alloggio', etichetta: 'Alloggio', codice: 'ALL', icona: BedDouble },
  { valore: 'trasporti', etichetta: 'Trasporti', codice: 'TRA', icona: Car },
  { valore: 'cibo', etichetta: 'Cibo', codice: 'CIB', icona: Utensils },
  { valore: 'attivita', etichetta: 'Attività', codice: 'ATT', icona: Ticket },
  { valore: 'altro', etichetta: 'Altro', codice: 'ALT', icona: MoreHorizontal },
]

export function infoCategoria(valore: CategoriaSpesaViaggio) {
  return CATEGORIE.find((c) => c.valore === valore) ?? CATEGORIE[CATEGORIE.length - 1]
}

export function coloreCategoria(valore: CategoriaSpesaViaggio): string {
  return `var(--q-cat-${valore})`
}
