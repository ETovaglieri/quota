import Avatar from './Avatar'
import { formattaEuroIT } from '../lib/format'
import type { Trasferimento } from '../lib/algoritmi'

export default function RigaSettlement({
  trasferimento,
  io,
  onSalda,
}: {
  trasferimento: Trasferimento
  io: string
  onSalda: () => void
}) {
  const testo =
    trasferimento.daId === io
      ? `Tu paghi a ${trasferimento.aNome}`
      : trasferimento.aId === io
        ? `${trasferimento.daNome} paga a te`
        : `${trasferimento.daNome} paga a ${trasferimento.aNome}`

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--q-color-divider)] py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex" style={{ gap: 3 }}>
          <Avatar nome={trasferimento.daNome} dimensione={28} io={trasferimento.daId === io} />
          <Avatar nome={trasferimento.aNome} dimensione={28} io={trasferimento.aId === io} />
        </div>
        <div>
          <p className="text-sm font-extrabold">{testo}</p>
          <p className="q-muted text-xs">{formattaEuroIT(trasferimento.importo)}</p>
        </div>
      </div>
      <button type="button" onClick={onSalda} className="q-btn q-btn-secondary">
        Salda
      </button>
    </div>
  )
}
