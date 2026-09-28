import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { generaSlug, calcolaSaldi } from '../lib/algoritmi'
import { elencoGruppiLocali, aggiungiGruppoLocale, ioNelGruppo, type GruppoLocale } from '../lib/miGruppi'
import { formattaEuroIT, formattaSaldoIT, formattaIntervalloDate } from '../lib/format'
import '../modernist.css'

type RigaGruppo = GruppoLocale & {
  luogo: string | null
  dataInizio: string | null
  dataFine: string | null
  chiuso: boolean
  nPartecipanti: number
  saldoIo: number | null
}

async function caricaRigaGruppo(gruppo: GruppoLocale): Promise<RigaGruppo | null> {
  const { data: viaggio } = await supabase.from('viaggi').select('*').eq('slug', gruppo.slug).maybeSingle()
  if (!viaggio) return null

  const [{ data: partecipanti }, { data: spese }, { data: pagamenti }] = await Promise.all([
    supabase.from('viaggio_partecipanti').select('*').eq('viaggio_id', viaggio.id),
    supabase.from('viaggio_spese').select('*').eq('viaggio_id', viaggio.id),
    supabase.from('viaggio_pagamenti').select('*').eq('viaggio_id', viaggio.id),
  ])

  const io = ioNelGruppo(gruppo.slug)
  let saldoIo: number | null = null
  if (io && partecipanti && partecipanti.length > 0) {
    const speseIds = (spese ?? []).map((s) => s.id)
    const { data: quote } =
      speseIds.length > 0
        ? await supabase.from('viaggio_spesa_partecipanti').select('*').in('spesa_id', speseIds)
        : { data: [] }
    const saldi = calcolaSaldi(
      partecipanti,
      (spese ?? []).map((sp) => ({
        importo: sp.importo,
        pagato_da: sp.pagato_da,
        quote: (quote ?? []).filter((q) => q.spesa_id === sp.id).map((q) => ({ partecipante_id: q.partecipante_id, quota: q.quota })),
      })),
      (pagamenti ?? []).map((p) => ({ da: p.da, a: p.a, importo: p.importo })),
    )
    saldoIo = saldi.find((s) => s.id === io)?.saldo ?? 0
  }

  return {
    ...gruppo,
    luogo: viaggio.luogo,
    dataInizio: viaggio.data_inizio,
    dataFine: viaggio.data_fine,
    chiuso: viaggio.chiuso,
    nPartecipanti: partecipanti?.length ?? 0,
    saldoIo,
  }
}

function progressoGruppo(riga: RigaGruppo): number {
  if (riga.chiuso) return 100
  if (!riga.dataInizio || !riga.dataFine) return 0
  const inizio = new Date(riga.dataInizio).getTime()
  const fine = new Date(riga.dataFine).getTime()
  if (fine <= inizio) return 0
  const oggi = Date.now()
  return Math.max(0, Math.min(100, ((oggi - inizio) / (fine - inizio)) * 100))
}

export default function ListaGruppi() {
  const navigate = useNavigate()
  const [righe, setRighe] = useState<RigaGruppo[] | null>(null)
  const [nome, setNome] = useState('')
  const [luogo, setLuogo] = useState('')
  const [dataInizio, setDataInizio] = useState('')
  const [dataFine, setDataFine] = useState('')
  const [creando, setCreando] = useState(false)
  const [codice, setCodice] = useState('')
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    const gruppi = elencoGruppiLocali()
    if (gruppi.length === 0) {
      setRighe([])
      return
    }
    Promise.all(gruppi.map(caricaRigaGruppo)).then((risultati) => {
      setRighe(risultati.filter((r): r is RigaGruppo => r !== null))
    })
  }, [])

  const saldoComplessivo = (righe ?? []).reduce((tot, r) => tot + (r.saldoIo ?? 0), 0)
  const haSaldiNoti = (righe ?? []).some((r) => r.saldoIo !== null)

  async function creaGruppo(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setCreando(true)
    setErrore(null)
    const slug = generaSlug()
    const { error } = await supabase.from('viaggi').insert({
      slug,
      nome: nome.trim(),
      luogo: luogo.trim() || null,
      data_inizio: dataInizio || null,
      data_fine: dataFine || null,
    })
    setCreando(false)
    if (error) {
      setErrore("Impossibile creare il gruppo: " + error.message)
      return
    }
    aggiungiGruppoLocale({ slug, nome: nome.trim() })
    navigate(`/${slug}`)
  }

  function entraConCodice(e: React.FormEvent) {
    e.preventDefault()
    const slug = codice.trim().toLowerCase()
    if (slug) navigate(`/${slug}`)
  }

  return (
    <div className="quota min-h-screen pb-10">
      <header className="border-b-2 px-5 pb-4 pt-5 lg:px-6" style={{ borderColor: 'var(--q-color-divider)' }}>
        <p className="q-kicker">Quota</p>
        <h1 className="text-[30px] lg:text-[36px]">I tuoi gruppi</h1>
        {haSaldiNoti && (
          <p className="q-muted mt-1 text-[13px]">
            Nel complesso ti spettano <b className="text-[var(--q-color-text)]">{formattaEuroIT(saldoComplessivo)}</b>
          </p>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-5 py-2 lg:grid lg:max-w-5xl lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10 lg:px-6 lg:py-8">
        <div>
          {righe === null ? (
            <p className="q-muted py-6 text-sm">Caricamento…</p>
          ) : righe.length === 0 ? (
            <p className="q-muted py-6 text-sm">
              Nessun gruppo ancora su questo dispositivo. Creane uno qui a fianco, oppure apri il link che ti ha
              mandato un amico.
            </p>
          ) : (
            <div className="lg:grid lg:grid-cols-2 lg:gap-4">
              {righe.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => navigate(`/${r.slug}`)}
                  className="block w-full border-b py-4 text-left lg:border lg:p-4"
                  style={{ borderColor: 'var(--q-color-divider)', borderBottomWidth: 1 }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[19px] font-extrabold">{r.nome}</span>
                    <span
                      className="shrink-0 text-[15px] font-extrabold"
                      style={{
                        color:
                          r.saldoIo === null || Math.abs(r.saldoIo) < 0.005
                            ? 'var(--q-neutral-600)'
                            : r.saldoIo > 0
                              ? 'var(--q-accent-700)'
                              : 'var(--q-color-text)',
                      }}
                    >
                      {r.saldoIo === null ? '—' : formattaSaldoIT(r.saldoIo)}
                    </span>
                  </div>
                  <div className="q-muted mt-2 flex items-baseline justify-between text-xs">
                    <span>
                      {formattaIntervalloDate(r.dataInizio, r.dataFine)}
                      {r.chiuso ? ' · chiuso' : ''}
                    </span>
                    <span>{r.nPartecipanti} partecipanti</span>
                  </div>
                  <div className="q-bar-track mt-2">
                    <div className="q-bar-fill" style={{ width: `${progressoGruppo(r)}%` }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 lg:mt-0 lg:border lg:p-5" style={{ borderColor: 'var(--q-color-divider)' }}>
          <form onSubmit={creaGruppo} className="space-y-3">
            <div className="q-field">
              <label>Nome del gruppo</label>
              <input
                className="q-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="es. Highlands & Skye"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="q-field col-span-3 sm:col-span-1 lg:col-span-3">
                <label>Luogo</label>
                <input className="q-input" value={luogo} onChange={(e) => setLuogo(e.target.value)} placeholder="es. Scozia" />
              </div>
              <div className="q-field lg:col-span-1">
                <label>Dal</label>
                <input type="date" className="q-input" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)} />
              </div>
              <div className="q-field lg:col-span-2">
                <label>Al</label>
                <input type="date" className="q-input" value={dataFine} onChange={(e) => setDataFine(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={creando || !nome.trim()} className="q-btn q-btn-secondary q-btn-block">
              + Nuovo gruppo
            </button>
            <p className="q-muted text-[11px]">Chi entra da link non deve creare un account: basta il nome.</p>
            {errore && <p className="text-xs" style={{ color: 'var(--q-accent-700)' }}>{errore}</p>}
          </form>

          <div className="q-hr my-6" />

          <form onSubmit={entraConCodice} className="flex gap-2">
            <input
              className="q-input"
              value={codice}
              onChange={(e) => setCodice(e.target.value)}
              placeholder="Hai un codice? es. 7htq2wke"
            />
            <button type="submit" disabled={!codice.trim()} className="q-btn q-btn-secondary shrink-0">
              Vai
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
