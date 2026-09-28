import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Viaggio, ViaggioPartecipante, CategoriaSpesaViaggio } from '../../lib/database.types'
import { CATEGORIE } from '../lib/categorie'
import { calcolaQuotePerPeso, residuoImportiEsatti } from '../lib/algoritmi'
import { formattaEuroIT } from '../lib/format'
import Avatar from '../components/Avatar'
import Segmented from '../components/Segmented'

type ModoDivisione = 'uguale' | 'quote' | 'importi'

const oggiISO = () => new Date().toISOString().slice(0, 10)

export default function AggiungiSpesa({
  viaggio,
  partecipanti,
  ioDefault,
  onChiudi,
  onSalvato,
}: {
  viaggio: Viaggio
  partecipanti: ViaggioPartecipante[]
  ioDefault: string
  onChiudi: () => void
  onSalvato: () => void
}) {
  const [descrizione, setDescrizione] = useState('')
  const [importo, setImporto] = useState('')
  const [categoria, setCategoria] = useState<CategoriaSpesaViaggio>('altro')
  const [pagatoDa, setPagatoDa] = useState(ioDefault || partecipanti[0]?.id || '')
  const [data, setData] = useState(oggiISO())
  const [modo, setModo] = useState<ModoDivisione>('uguale')
  const [inclusi, setInclusi] = useState<Set<string>>(new Set(partecipanti.map((p) => p.id)))
  const [pesi, setPesi] = useState<Record<string, number>>(() => Object.fromEntries(partecipanti.map((p) => [p.id, 1])))
  const [importiManuali, setImportiManuali] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const importoNumerico = Number(importo.replace(',', '.')) || 0

  function toggleIncluso(id: string) {
    setInclusi((attuale) => {
      const nuovo = new Set(attuale)
      if (nuovo.has(id)) nuovo.delete(id)
      else nuovo.add(id)
      return nuovo
    })
  }

  function cambiaPeso(id: string, delta: number) {
    setPesi((attuale) => ({ ...attuale, [id]: Math.max(1, Math.min(9, (attuale[id] ?? 1) + delta)) }))
  }

  const residuoImporti =
    modo === 'importi'
      ? residuoImportiEsatti(
          importoNumerico,
          partecipanti.map((p) => Number((importiManuali[p.id] ?? '0').replace(',', '.')) || 0),
        )
      : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrore(null)

    if (!descrizione.trim() || !pagatoDa || importoNumerico <= 0) {
      setErrore('Compila descrizione, importo e chi ha pagato.')
      return
    }
    if (modo !== 'importi' && inclusi.size === 0) {
      setErrore('Seleziona almeno un partecipante coinvolto.')
      return
    }
    if (modo === 'importi' && Math.abs(residuoImporti) > 0.005) {
      setErrore(`Gli importi non tornano: manca ${formattaEuroIT(residuoImporti)} al totale.`)
      return
    }

    setSalvando(true)
    const { data: spesaInserita, error } = await supabase
      .from('viaggio_spese')
      .insert({
        viaggio_id: viaggio.id,
        descrizione: descrizione.trim(),
        importo: importoNumerico,
        pagato_da: pagatoDa,
        categoria,
        data,
      })
      .select()
      .single()

    if (error || !spesaInserita) {
      setSalvando(false)
      setErrore('Impossibile salvare la spesa: ' + (error?.message ?? 'errore sconosciuto'))
      return
    }

    const quote =
      modo === 'importi'
        ? partecipanti
            .map((p) => ({ partecipante_id: p.id, quota: Number((importiManuali[p.id] ?? '0').replace(',', '.')) || 0 }))
            .filter((q) => q.quota > 0)
        : calcolaQuotePerPeso(
            importoNumerico,
            Array.from(inclusi).map((id) => ({ partecipante_id: id, peso: modo === 'quote' ? (pesi[id] ?? 1) : 1 })),
          )

    const { error: erroreQuote } = await supabase
      .from('viaggio_spesa_partecipanti')
      .insert(quote.map((q) => ({ ...q, spesa_id: spesaInserita.id })))

    setSalvando(false)
    if (erroreQuote) {
      setErrore('Spesa salvata ma senza ripartizione: ' + erroreQuote.message)
      return
    }
    onSalvato()
  }

  return (
    <div className="quota q-overlay-backdrop">
      <div className="mx-auto max-w-lg px-5 pb-10 pt-5 lg:max-w-2xl">
        <div className="flex items-center justify-between border-b-2 pb-3" style={{ borderColor: 'var(--q-color-divider)' }}>
          <button type="button" onClick={onChiudi} className="q-btn q-btn-ghost">
            ← Annulla
          </button>
          <span className="text-[15px] font-extrabold">Nuova spesa</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <p className="q-micro">Importo pagato</p>
            <div className="flex items-baseline gap-1 border-b-2 pb-1" style={{ borderColor: 'var(--q-color-text)' }}>
              <span className="text-[22px] font-extrabold" style={{ color: 'var(--q-color-accent)' }}>
                €
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                placeholder="0,00"
                className="w-full border-0 bg-transparent text-[38px] font-extrabold outline-none"
                style={{ letterSpacing: '-0.03em' }}
              />
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[1fr_180px] lg:gap-4">
            <div className="q-field">
              <label>Descrizione</label>
              <input
                className="q-input"
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="es. Cena al ristorante"
              />
            </div>
            <div className="q-field mt-5 lg:mt-0">
              <label>Data</label>
              <input type="date" className="q-input" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          <div className="q-field">
            <label>Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIE.map((c) => (
                <button
                  key={c.valore}
                  type="button"
                  className="q-tag"
                  data-attivo={categoria === c.valore ? 'true' : undefined}
                  onClick={() => setCategoria(c.valore)}
                >
                  {c.etichetta}
                </button>
              ))}
            </div>
          </div>

          <div className="q-field">
            <label>Ha pagato</label>
            <div className="flex gap-1.5">
              {partecipanti.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPagatoDa(p.id)}
                  className="q-tag flex-1 flex-col gap-0.5 py-2"
                  data-attivo={pagatoDa === p.id ? 'true' : undefined}
                  style={{ flexDirection: 'column' }}
                >
                  <span className="text-xs font-extrabold">{p.nome.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border p-3" style={{ borderColor: 'var(--q-color-divider)', background: 'var(--q-color-surface)' }}>
            <p className="q-micro">Divisione</p>
            <div className="mt-2">
              <Segmented
                opzioni={[
                  { valore: 'uguale', etichetta: 'Uguale' },
                  { valore: 'quote', etichetta: 'A quote' },
                  { valore: 'importi', etichetta: 'Importi' },
                ]}
                valore={modo}
                onChange={setModo}
              />
            </div>
            <p className="q-muted mt-3 text-xs">
              {modo === 'uguale' && 'Tocca un partecipante per escluderlo da questa spesa.'}
              {modo === 'quote' && 'Le quote servono quando qualcuno pesa di più: camera doppia, due cene, un bambino.'}
              {modo === 'importi' && 'Inserisci gli importi esatti: la somma deve tornare al totale.'}
            </p>

            <div className="mt-3 space-y-2 lg:columns-2 lg:gap-6 lg:space-y-0 [&>*]:break-inside-avoid lg:[&>*]:mb-2">
              {partecipanti.map((p) => {
                const incluso = inclusi.has(p.id)
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => modo !== 'importi' && toggleIncluso(p.id)}
                      title={incluso ? 'Escludi' : 'Includi'}
                    >
                      <Avatar nome={p.nome} io={incluso || modo === 'importi'} dimensione={26} />
                    </button>
                    <span className="flex-1 text-[13px] font-extrabold">{p.nome}</span>

                    {modo === 'quote' && incluso && (
                      <div className="flex items-center gap-1">
                        <button type="button" className="q-btn q-btn-secondary q-btn-icon" onClick={() => cambiaPeso(p.id, -1)}>
                          −
                        </button>
                        <span className="w-6 text-center text-[13px] font-extrabold">{pesi[p.id] ?? 1}</span>
                        <button type="button" className="q-btn q-btn-secondary q-btn-icon" onClick={() => cambiaPeso(p.id, 1)}>
                          +
                        </button>
                      </div>
                    )}

                    {modo === 'importi' ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={importiManuali[p.id] ?? ''}
                        onChange={(e) => setImportiManuali((attuale) => ({ ...attuale, [p.id]: e.target.value }))}
                        placeholder="0,00"
                        className="q-input w-20 text-right"
                      />
                    ) : (
                      <span className="w-16 text-right text-sm font-extrabold" style={{ color: incluso ? undefined : 'var(--q-neutral-500)' }}>
                        {incluso ? '' : '—'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {modo === 'importi' && (
              <p
                className="mt-3 text-right text-xs font-extrabold"
                style={{ color: Math.abs(residuoImporti) > 0.005 ? 'var(--q-accent-700)' : 'var(--q-neutral-600)' }}
              >
                {Math.abs(residuoImporti) > 0.005 ? `Mancano ${formattaEuroIT(residuoImporti)}` : 'Importi corretti'}
              </p>
            )}
          </div>

          <button type="submit" disabled={salvando} className="q-btn q-btn-primary q-btn-block justify-center">
            {salvando ? 'Salvataggio...' : 'Salva spesa'}
          </button>
          {errore && (
            <p className="text-sm" style={{ color: 'var(--q-accent-700)' }}>
              {errore}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
