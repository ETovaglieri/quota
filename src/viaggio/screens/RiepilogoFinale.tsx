import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useViaggio } from '../lib/useViaggio'
import { ioNelGruppo } from '../lib/miGruppi'
import { formattaEuroIT, formattaSaldoIT } from '../lib/format'
import { infoCategoria } from '../lib/categorie'
import StatCard from '../components/StatCard'
import TabBar from '../components/TabBar'
import DesktopNav from '../components/DesktopNav'
import type { CategoriaSpesaViaggio } from '../../lib/database.types'
import '../modernist.css'

function numeroGiorni(dataInizio: string | null, dataFine: string | null, speseDateFallback: string[]): number {
  if (dataInizio && dataFine) {
    const giorni = Math.round((new Date(dataFine).getTime() - new Date(dataInizio).getTime()) / 86400000) + 1
    return Math.max(1, giorni)
  }
  const dateUniche = new Set(speseDateFallback)
  return Math.max(1, dateUniche.size)
}

export default function RiepilogoFinale() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { viaggio, partecipanti, spese, caricamento, saldi, trasferimenti } = useViaggio(slug)
  const io = slug ? ioNelGruppo(slug) : ''
  const [chiudendo, setChiudendo] = useState(false)

  if (viaggio === undefined || caricamento) {
    return <div className="quota flex min-h-screen items-center justify-center text-sm">Caricamento…</div>
  }
  if (viaggio === null || !slug) return null

  const totale = spese.reduce((s, sp) => s + sp.importo, 0)
  const giorni = numeroGiorni(viaggio.data_inizio, viaggio.data_fine, spese.map((s) => s.data))
  const alGiorno = totale / giorni
  const aTestaAlGiorno = partecipanti.length > 0 ? alGiorno / partecipanti.length : 0
  const speseOrdinate = [...spese].sort((a, b) => b.importo - a.importo)
  const spesaPiuAlta = speseOrdinate[0]

  const totaliCategoria = new Map<CategoriaSpesaViaggio, number>()
  for (const sp of spese) totaliCategoria.set(sp.categoria, (totaliCategoria.get(sp.categoria) ?? 0) + sp.importo)
  const categoriaTop = [...totaliCategoria.entries()].sort((a, b) => b[1] - a[1])[0]

  const righeTabella = partecipanti.map((p) => {
    const pagato = spese.filter((sp) => sp.pagato_da === p.id).reduce((s, sp) => s + sp.importo, 0)
    const quota = spese.reduce((s, sp) => s + (sp.quote.find((q) => q.partecipante_id === p.id)?.quota ?? 0), 0)
    const saldo = saldi.find((s) => s.id === p.id)?.saldo ?? 0
    return { nome: p.nome, pagato, quota, saldo }
  })

  async function chiudiConti() {
    if (!viaggio) return
    setChiudendo(true)
    await supabase.from('viaggi').update({ chiuso: true }).eq('id', viaggio.id)
    setChiudendo(false)
    navigate(`/${slug}/saldi`)
  }

  return (
    <div className="quota min-h-screen pb-24 lg:pb-0">
      <DesktopNav slug={slug} nomeIo={partecipanti.find((p) => p.id === io)?.nome ?? null} onNuovaSpesa={() => navigate(`/${slug}`)} />

      <main className="mx-auto max-w-2xl pb-8 lg:max-w-4xl">
        <div className="q-poster">
          <p className="q-kicker">Riepilogo finale · {giorni} giorni</p>
          <h1 className="mt-1 text-[34px] lg:text-[42px]">{viaggio.nome}</h1>
          <p className="mt-1 text-[20px] font-extrabold">
            {formattaEuroIT(totale)} in {spese.length} spese
          </p>
        </div>

        <div className="grid grid-cols-2 border-b-2 lg:grid-cols-4" style={{ borderColor: 'var(--q-color-divider)' }}>
          <div className="border-r border-b lg:border-b-0" style={{ borderColor: 'var(--q-color-divider)' }}>
            <StatCard etichetta="Al giorno" valore={formattaEuroIT(alGiorno)} nota="per il gruppo" />
          </div>
          <div className="border-b lg:border-r lg:border-b-0" style={{ borderColor: 'var(--q-color-divider)' }}>
            <StatCard etichetta="A testa al giorno" valore={formattaEuroIT(aTestaAlGiorno)} nota="media" />
          </div>
          <div className="border-r" style={{ borderColor: 'var(--q-color-divider)' }}>
            <StatCard
              etichetta="Spesa più alta"
              valore={spesaPiuAlta ? formattaEuroIT(spesaPiuAlta.importo) : '—'}
              nota={spesaPiuAlta ? infoCategoria(spesaPiuAlta.categoria).etichetta : undefined}
            />
          </div>
          <div>
            <StatCard
              etichetta="Categoria top"
              valore={categoriaTop ? infoCategoria(categoriaTop[0]).etichetta : '—'}
              nota={categoriaTop ? formattaEuroIT(categoriaTop[1]) : undefined}
            />
          </div>
        </div>

        <div className="px-5 py-5 lg:px-0 lg:py-8">
          <p className="q-micro">Chi ha pagato cosa</p>
          <table className="q-table mt-2">
            <thead>
              <tr>
                <th>Persona</th>
                <th className="q-num">Pagato</th>
                <th className="q-num">Quota</th>
                <th className="q-num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {righeTabella.map((r) => (
                <tr key={r.nome}>
                  <td className="font-extrabold">{r.nome}</td>
                  <td className="q-num">{formattaEuroIT(r.pagato)}</td>
                  <td className="q-num">{formattaEuroIT(r.quota)}</td>
                  <td className="q-num font-extrabold" style={{ color: r.saldo > 0.005 ? 'var(--q-accent-700)' : undefined }}>
                    {formattaSaldoIT(r.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="q-no-print space-y-2 px-5 lg:flex lg:flex-row-reverse lg:justify-end lg:gap-3 lg:space-y-0 lg:px-0">
          <button type="button" onClick={() => window.print()} className="q-btn q-btn-primary q-btn-block justify-center lg:w-auto">
            Esporta PDF del viaggio
          </button>
          <button
            type="button"
            onClick={chiudiConti}
            disabled={chiudendo || trasferimenti.length > 0 || viaggio.chiuso}
            className="q-btn q-btn-secondary q-btn-block justify-center lg:w-auto"
          >
            {viaggio.chiuso ? 'Conti chiusi' : `Chiudi i conti${trasferimenti.length > 0 ? ` (${trasferimenti.length} pagamenti)` : ''}`}
          </button>
        </div>
      </main>

      <TabBar slug={slug} />
    </div>
  )
}
