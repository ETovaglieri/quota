import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useViaggio } from '../lib/useViaggio'
import { ioNelGruppo } from '../lib/miGruppi'
import { formattaEuroIT, formattaSaldoIT } from '../lib/format'
import type { Trasferimento } from '../lib/algoritmi'
import Avatar from '../components/Avatar'
import RigaSettlement from '../components/RigaSettlement'
import TabBar from '../components/TabBar'
import DesktopNav from '../components/DesktopNav'
import AggiungiSpesa from './AggiungiSpesa'
import '../modernist.css'

export default function Saldi() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { viaggio, partecipanti, pagamenti, caricamento, saldi, trasferimenti, ricarica } = useViaggio(slug)
  const io = slug ? ioNelGruppo(slug) : ''
  const [modaleAperta, setModaleAperta] = useState(false)
  const [confermaTrasferimento, setConfermaTrasferimento] = useState<Trasferimento | null>(null)
  const [salvandoPagamento, setSalvandoPagamento] = useState(false)

  if (viaggio === undefined || caricamento) {
    return <div className="quota flex min-h-screen items-center justify-center text-sm">Caricamento…</div>
  }
  if (viaggio === null || !slug) return null

  function nomeDi(id: string) {
    return partecipanti.find((p) => p.id === id)?.nome ?? '—'
  }

  async function confermaSalda() {
    if (!confermaTrasferimento || !viaggio) return
    setSalvandoPagamento(true)
    await supabase.from('viaggio_pagamenti').insert({
      viaggio_id: viaggio.id,
      da: confermaTrasferimento.daId,
      a: confermaTrasferimento.aId,
      importo: confermaTrasferimento.importo,
    })
    setSalvandoPagamento(false)
    setConfermaTrasferimento(null)
    await ricarica()
  }

  const numeroPagamentiUnoAUno = (partecipanti.length * (partecipanti.length - 1)) / 2

  return (
    <div className="quota min-h-screen pb-24 lg:pb-0">
      <DesktopNav slug={slug} nomeIo={partecipanti.find((p) => p.id === io)?.nome ?? null} onNuovaSpesa={() => setModaleAperta(true)} />

      <header className="flex items-center justify-between border-b-2 px-5 py-4" style={{ borderColor: 'var(--q-color-divider)' }}>
        <button type="button" onClick={() => navigate(`/${slug}`)} className="q-btn q-btn-ghost">
          ← Viaggio
        </button>
        <span className="text-[15px] font-extrabold">Chi deve a chi</span>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-5 py-6">
        <section>
          <p className="q-micro">Saldi del gruppo</p>
          <div className="mt-2 space-y-2">
            {saldi.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b py-2" style={{ borderColor: 'var(--q-color-divider)' }}>
                <div className="flex items-center gap-2">
                  <Avatar nome={s.nome} io={s.id === io} dimensione={26} />
                  <span className="text-sm">{s.id === io ? 'Tu' : s.nome}</span>
                </div>
                <span className="text-sm font-extrabold" style={{ color: s.saldo > 0.005 ? 'var(--q-accent-700)' : undefined }}>
                  {formattaSaldoIT(s.saldo)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          {trasferimenti.length > 0 ? (
            <>
              <h2 className="text-[30px]">{trasferimenti.length} pagamenti e siete in pari</h2>
              <p className="q-muted mt-1 text-xs">
                Quota compensa i debiti incrociati: invece di {numeroPagamentiUnoAUno} rimborsi tra tutti, ne bastano{' '}
                {trasferimenti.length}.
              </p>
              <div className="mt-4">
                {trasferimenti.map((t, i) => (
                  <RigaSettlement key={i} trasferimento={t} io={io} onSalda={() => setConfermaTrasferimento(t)} />
                ))}
              </div>
            </>
          ) : (
            <div className="border-2 p-6 text-center" style={{ borderColor: 'var(--q-color-accent)' }}>
              <h2 className="text-xl" style={{ color: 'var(--q-accent-700)' }}>
                Tutti in pari
              </h2>
              <p className="q-muted mt-1 text-xs">Nessun trasferimento da fare.</p>
            </div>
          )}
        </section>

        {pagamenti.length > 0 && (
          <section>
            <p className="q-micro">Pagamenti registrati</p>
            <div className="mt-2 space-y-1.5">
              {pagamenti.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span>
                    {nomeDi(p.da)} → {p.a === io ? 'te' : nomeDi(p.a)}
                  </span>
                  <span className="font-extrabold">{formattaEuroIT(p.importo)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <TabBar slug={slug} />

      {confermaTrasferimento && (
        <div className="quota q-dialog-backdrop q-no-print" onClick={() => setConfermaTrasferimento(null)}>
          <div className="q-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="q-kicker">
              {confermaTrasferimento.daNome} rimborsa {confermaTrasferimento.aNome}
            </p>
            <p className="text-[32px] font-extrabold">{formattaEuroIT(confermaTrasferimento.importo)}</p>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="q-btn q-btn-secondary" onClick={() => setConfermaTrasferimento(null)}>
                Annulla
              </button>
              <button type="button" className="q-btn q-btn-primary" onClick={confermaSalda} disabled={salvandoPagamento}>
                {salvandoPagamento ? 'Salvataggio...' : 'Segna come pagato'}
              </button>
            </div>
          </div>
        </div>
      )}

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
