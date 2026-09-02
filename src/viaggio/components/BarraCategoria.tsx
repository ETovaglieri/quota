import { infoCategoria, coloreCategoria } from '../lib/categorie'
import { formattaEuroIT } from '../lib/format'
import type { CategoriaSpesaViaggio } from '../../lib/database.types'

export default function BarraCategoria({
  categoria,
  importo,
  percentuale,
}: {
  categoria: CategoriaSpesaViaggio
  importo: number
  percentuale: number
}) {
  const info = infoCategoria(categoria)
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-extrabold">{info.etichetta}</span>
        <span className="q-muted">
          {formattaEuroIT(importo)} · {Math.round(percentuale)}%
        </span>
      </div>
      <div className="q-bar-cat-track mt-1.5">
        <div
          className="q-bar-cat-fill"
          style={{ width: `${Math.min(100, percentuale)}%`, background: coloreCategoria(categoria) }}
        />
      </div>
    </div>
  )
}
