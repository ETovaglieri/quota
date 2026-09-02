import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useViaggio } from '../lib/useViaggio'
import { aggiungiGruppoLocale, elencoGruppiLocali, ioNelGruppo, impostaIoNelGruppo } from '../lib/miGruppi'
import { formattaEuroIT, formattaSaldoIT, formattaIntervalloDate } from '../lib/format'
import { CATEGORIE } from '../lib/categorie'
import Avatar from '../components/Avatar'
import BarraCategoria from '../components/BarraCategoria'
import TabBar from '../components/TabBar'
import DesktopNav from '../components/DesktopNav'
import AggiungiSpesa from './AggiungiSpesa'
import '../modernist.css'

export default function DashboardViaggio() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { viaggio, partecipanti, spese, caricamento, saldi, ricarica } = useViaggio(slug)

  const [io, setIo] = useState(() => (slug ? ioNelGruppo(slug) : ''))
  const [nuovoPartecipante, setNuovoPartecipante] = useState('')
  const [salvandoPartecipante, setSalvandoPartecipante] = useState(false)
  const [modaleAperta, setModaleAperta] = useState(false)
  const [gruppiLocali, setGruppiLocali] = useState(() => elencoGruppiLocali())

  useEffect(() => {
    if (viaggio && slug) {
      aggiungiGruppoLocale({ slug, nome: viaggio.nome })
      setGruppiLocali(elencoGruppiLocali())
    }
  }, [viaggio, slug])

  function selezionaIo(id: string) {
    if (!slug) return
    setIo(id)
    impostaIoNelGruppo(slug, id)
  }

  async function aggiungiPartecipante(e: React.FormEvent) {
    e.preventDefault()
    if (!nuovoPartecipante.trim() || !viaggio) return
    setSalvandoPartecipante(true)
    await supabase.from('viaggio_partecipanti').insert({ viaggio_id: viaggio.id, nome: nuovoPartecipante.trim() })
    setNuovoPartecipante('')
    setSalvandoPartecipante(false)
    await ricarica()
  }

  if (viaggio === undefined || caricamento) {
    return <div className="quota flex min-h-screen items-center justify-center text-sm">Caricamento…</div>
  }
  if (viaggio === null || !slug) {
    return (
      <div className="quota flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <h1 className="text-xl">Gruppo non trovato</h1>
          <a href="/" className="q-btn q-btn-secondary mt-4 inline-flex">
            Torna ai gruppi
          </a>
        </div>
      </div>
    )
  }

  const totale = spese.reduce((s, sp) => s + sp.importo, 0)
  const aTesta = partecipanti.length > 0 ? totale / partecipanti.length : 0
  const saldoIo = saldi.find((s) => s.id === io)?.saldo ?? null
  const nomeIo = partecipanti.find((p) => p.id === io)?.nome ?? null

  const perCategoria = CATEGORIE.map((c) => ({
    ...c,
    importo: spese.filter((s) => s.categoria === c.valore).reduce((s, sp) => s + sp.importo, 0),
  }))
    .filter((c) => c.importo > 0)
    .sort((a, b) => b.importo - a.importo)

  const kicker = [formattaIntervalloDate(viaggio.data_inizio, viaggio.data_fine), viaggio.luogo].filter(Boolean).join(' · ')

  const BloccoPartecipanti = (
    <div>
      <p className="q-micro">Partecipanti</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {partecipanti.map((p) => (
          <button key={p.id} type="button" onClick={() => selezionaIo(p.id)} className="flex items-center gap-1.5" title="Tocca per segnarti come 'tu'">
            <Avatar nome={p.nome} io={io === p.id} dimensione={26} />
            <span className="text-xs">{p.nome}{io === p.id ? ' (tu)' : ''}</span>
          </button>
        ))}
      </div>
      <form onSubmit={aggiungiPartecipante} className="mt-2 flex max-w-xs gap-2">
        <input
          className="q-input"
          value={nuovoPartecipante}
          onChange={(e) => setNuovoPartecipante(e.target.value)}
          placeholder="Aggiungi partecipante"
        />
        <button type="submit" disabled={salvandoPartecipante || !nuovoPartecipante.trim()} className="q-btn q-btn-secondary shrink-0">
          Aggiungi
        </button>
      </form>
    </div>
  )

  const BloccoCategorie = perCategoria.length > 0 && (
    <div>
      <p className="q-micro">Spesa per categoria</p>
      <div className="mt-1">
        {perCategoria.map((c) => (
          <BarraCategoria key={c.valore} categoria={c.valore} importo={c.importo} percentuale={totale > 0 ? (c.importo / totale) * 100 : 0} />
        ))}
      </div>
    </div>
  )

  const BloccoSaldi = partecipanti.length > 0 && (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="q-micro">Saldi del gruppo</p>
        <button type="button" onClick={() => navigate(`/${slug}/saldi`)} className="q-btn q-btn-ghost text-xs">
          Chi deve a chi →
        </button>
      </div>
      <div className="mt-1 space-y-2">
        {saldi.map((s) => {
          const massimo = Math.max(1, ...saldi.map((x) => Math.abs(x.saldo)))
          const pct = (Math.abs(s.saldo) / massimo) * 50
          return (
            <div key={s.id} className="flex items-center gap-3">
              <Avatar nome={s.nome} io={s.id === io} dimensione={26} />
              <span className="w-16 shrink-0 text-xs font-extrabold">{s.id === io ? 'Tu' : s.nome.split(' ')[0]}</span>
              <div className="relative h-1.5 flex-1" style={{ background: 'var(--q-neutral-300)' }}>
                {s.saldo < 0 && (
                  <div className="absolute right-1/2 h-full" style={{ width: `${pct}%`, background: 'var(--q-neutral-700)' }} />
                )}
                {s.saldo > 0 && (
                  <div className="absolute left-1/2 h-full" style={{ width: `${pct}%`, background: 'var(--q-color-accent)' }} />
                )}
              </div>
              <span className="w-20 shrink-0 text-right text-[13px] font-extrabold">{formattaSaldoIT(s.saldo)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="quota min-h-screen pb-24 lg:pb-0">
      <DesktopNav slug={slug} nomeIo={nomeIo} onNuovaSpesa={() => setModaleAperta(true)} />

      {/* — mobile — */}
      <div className="lg:hidden">
        <header className="border-b-2 px-5 pb-4 pt-5" style={{ borderColor: 'var(--q-color-divider)' }}>
          {kicker && <p className="q-kicker">{kicker}</p>}
          <h1 className="text-[26px]">{viaggio.nome}</h1>
        </header>

        <main className="space-y-6 px-5 py-5">
          {BloccoPartecipanti}

          {partecipanti.length > 0 && (
            <div className="grid grid-cols-3 border-t" style={{ borderColor: 'var(--q-color-divider)' }}>
              <div className="py-3">
                <p className="q-micro">Totale</p>
                <p className="mt-1 text-base font-extrabold">{formattaEuroIT(totale)}</p>
              </div>
              <div className="border-l py-3 pl-3" style={{ borderColor: 'var(--q-color-divider)' }}>
                <p className="q-micro">A testa</p>
                <p className="mt-1 text-base font-extrabold">{formattaEuroIT(aTesta)}</p>
              </div>
              <div className="border-l py-3 pl-3" style={{ borderColor: 'var(--q-color-divider)' }}>
                <p className="q-micro">Il tuo saldo</p>
                <p className="mt-1 text-base font-extrabold" style={{ color: saldoIo !== null && saldoIo >= 0 ? 'var(--q-accent-700)' : undefined }}>
                  {saldoIo === null ? '—' : formattaSaldoIT(saldoIo)}
                </p>
              </div>
            </div>
          )}

          {BloccoCategorie}
          {BloccoSaldi}

          {partecipanti.length > 0 && (
            <div className="space-y-2 pt-2">
              <button type="button" onClick={() => setModaleAperta(true)} className="q-btn q-btn-primary q-btn-block justify-center">
                + Aggiungi spesa
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigate(`/${slug}/spese`)} className="q-btn q-btn-secondary flex-1 justify-center">
                  Spese
                </button>
                <button type="button" onClick={() => navigate(`/${slug}/riepilogo`)} className="q-btn q-btn-secondary flex-1 justify-center">
                  Riepilogo
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* — desktop: 240px gruppi | 1fr contenuto | 320px pannello — */}
      <div className="hidden lg:grid" style={{ gridTemplateColumns: '240px 1fr 320px' }}>
        <aside className="border-r p-4" style={{ borderColor: 'var(--q-color-divider)' }}>
          <p className="q-micro">Gruppi</p>
          <div className="mt-2 space-y-1">
            {gruppiLocali.map((g) => (
              <button
                key={g.slug}
                onClick={() => navigate(`/${g.slug}`)}
                className="block w-full px-2 py-2 text-left text-sm"
                style={{ background: g.slug === slug ? 'var(--q-neutral-200)' : undefined }}
              >
                {g.nome}
              </button>
            ))}
          </div>
          <div className="q-hr my-3" />
          <a href="/" className="q-btn q-btn-secondary q-btn-block">
            + Nuovo gruppo
          </a>
        </aside>

        <section className="border-r p-6" style={{ borderColor: 'var(--q-color-divider)' }}>
          <div className="flex items-end justify-between gap-6">
            <div>
              {kicker && <p className="q-kicker">{kicker}</p>}
              <h1 className="text-[36px]">{viaggio.nome}</h1>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="q-micro">Totale</p>
                <p className="text-[22px] font-extrabold">{formattaEuroIT(totale)}</p>
              </div>
              <div>
                <p className="q-micro">A testa</p>
                <p className="text-[22px] font-extrabold">{formattaEuroIT(aTesta)}</p>
              </div>
              <div>
                <p className="q-micro">Il tuo saldo</p>
                <p className="text-[22px] font-extrabold">{saldoIo === null ? '—' : formattaSaldoIT(saldoIo)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">{BloccoPartecipanti}</div>

          <div className="mt-6">
            <table className="q-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Spesa</th>
                  <th>Categoria</th>
                  <th>Pagato da</th>
                  <th className="q-num">Importo</th>
                </tr>
              </thead>
              <tbody>
                {spese.map((sp) => (
                  <tr key={sp.id}>
                    <td>{sp.data}</td>
                    <td>{sp.descrizione}</td>
                    <td>
                      <span className="q-tag q-tag-neutral">{sp.categoria}</span>
                    </td>
                    <td>{partecipanti.find((p) => p.id === sp.pagato_da)?.nome ?? '—'}</td>
                    <td className="q-num">{formattaEuroIT(sp.importo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6 p-4">
          {BloccoSaldi}
          {BloccoCategorie}
        </aside>
      </div>

      <TabBar slug={slug} />

      {modaleAperta && (
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
