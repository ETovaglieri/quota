import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useViaggio } from '../lib/useViaggio'
import { ioNelGruppo } from '../lib/miGruppi'
import { formattaEuroIT, formattaDataBreve } from '../lib/format'
import { CATEGORIE, infoCategoria } from '../lib/categorie'
import TabBar from '../components/TabBar'
import DesktopNav from '../components/DesktopNav'
import AggiungiSpesa from './AggiungiSpesa'
import type { CategoriaSpesaViaggio } from '../../lib/database.types'
import '../modernist.css'

export default function FeedSpese() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { viaggio, partecipanti, spese, caricamento, ricarica } = useViaggio(slug)
  const io = slug ? ioNelGruppo(slug) : ''
  const [filtro, setFiltro] = useState<CategoriaSpesaViaggio | 'tutte'>('tutte')
  const [modaleAperta, setModaleAperta] = useState(false)

  const speseFiltrate = filtro === 'tutte' ? spese : spese.filter((s) => s.categoria === filtro)

  const gruppiPerGiorno = useMemo(() => {
    const mappa = new Map<string, typeof speseFiltrate>()
    for (const sp of speseFiltrate) {
      const lista = mappa.get(sp.data) ?? []
      lista.push(sp)
      mappa.set(sp.data, lista)
    }
    return Array.from(mappa.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [speseFiltrate])

  if (viaggio === undefined || caricamento) {
    return <div className="quota flex min-h-screen items-center justify-center text-sm">Caricamento…</div>
  }
  if (viaggio === null || !slug) return null

  function nomeDi(id: string) {
    return partecipanti.find((p) => p.id === id)?.nome ?? '—'
  }

  return (
    <div className="quota min-h-screen pb-24 lg:pb-0">
      <DesktopNav slug={slug} nomeIo={partecipanti.find((p) => p.id === io)?.nome ?? null} onNuovaSpesa={() => setModaleAperta(true)} />

      <header className="flex items-center justify-between border-b-2 px-5 py-4" style={{ borderColor: 'var(--q-color-divider)' }}>
        <button type="button" onClick={() => navigate(`/${slug}`)} className="q-btn q-btn-ghost">
          ← Viaggio
        </button>
        <span className="text-[15px] font-extrabold">Spese · {spese.length}</span>
      </header>

      <div className="flex gap-2 overflow-x-auto border-b px-5 py-3" style={{ borderColor: 'var(--q-color-divider)' }}>
        <button type="button" className="q-tag shrink-0" data-attivo={filtro === 'tutte' ? 'true' : undefined} onClick={() => setFiltro('tutte')}>
          Tutte
        </button>
        {CATEGORIE.map((c) => (
          <button
            key={c.valore}
            type="button"
            className="q-tag shrink-0"
            data-attivo={filtro === c.valore ? 'true' : undefined}
            onClick={() => setFiltro(c.valore)}
          >
            {c.etichetta}
          </button>
        ))}
      </div>

      <main className="mx-auto max-w-3xl">
        {gruppiPerGiorno.length === 0 ? (
          <p className="q-muted px-5 py-8 text-sm">Nessuna spesa {filtro !== 'tutte' ? 'in questa categoria' : 'ancora'}.</p>
        ) : (
          gruppiPerGiorno.map(([giorno, speseGiorno]) => (
            <div key={giorno}>
              <div className="flex items-baseline justify-between px-5 py-1.5" style={{ background: 'var(--q-neutral-200)' }}>
                <span className="q-micro">{formattaDataBreve(giorno)}</span>
                <span className="text-xs font-extrabold">
                  {formattaEuroIT(speseGiorno.reduce((s, sp) => s + sp.importo, 0))}
                </span>
              </div>
              {speseGiorno.map((sp) => {
                const cat = infoCategoria(sp.categoria)
                const mieQuota = sp.quote.find((q) => q.partecipante_id === io)
                return (
                  <div key={sp.id} className="flex items-center gap-3 border-b px-5 py-3" style={{ borderColor: 'var(--q-color-divider)' }}>
                    <div
                      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center border text-[8px] font-extrabold uppercase"
                      style={{ borderColor: 'var(--q-color-divider)', color: 'var(--q-neutral-700)' }}
                    >
                      {cat.codice}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold">{sp.descrizione}</p>
                      <p className="q-muted text-xs">{sp.pagato_da === io ? 'Hai pagato tu' : `${nomeDi(sp.pagato_da)} ha pagato`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold">{formattaEuroIT(sp.importo)}</p>
                      <p className="text-xs" style={{ color: mieQuota ? 'var(--q-neutral-600)' : 'var(--q-accent-700)' }}>
                        {mieQuota ? `quota ${formattaEuroIT(mieQuota.quota)}` : 'non ti riguarda'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </main>

      <div className="q-no-print fixed inset-x-0 bottom-16 px-5 lg:static lg:mx-auto lg:max-w-3xl lg:py-5">
        <button type="button" onClick={() => setModaleAperta(true)} className="q-btn q-btn-primary q-btn-block justify-center shadow-lg">
          + Aggiungi spesa
        </button>
      </div>

      <TabBar slug={slug} />

      {modaleAperta && viaggio && (
        <AggiungiSpesa
          viaggio={viaggio}
          partecipanti={partecipanti}
          ioDefault={io}
          onChiudi={() => setModaleAperta(false)}
          onSalvato={async () => {
            setModaleAperta(false)
            await ricarica()
          }}
        />
      )}
    </div>
  )
}
