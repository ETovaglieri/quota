import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type {
  Viaggio,
  ViaggioPartecipante,
  ViaggioSpesa,
  ViaggioSpesaPartecipante,
  ViaggioPagamento,
} from '../../lib/database.types'
import { calcolaSaldi, semplificaDebiti } from './algoritmi'

export type SpesaConQuote = ViaggioSpesa & { quote: ViaggioSpesaPartecipante[] }

/** Carica un viaggio (per slug) e tutti i suoi dati, ed espone saldi e
 * settlement già calcolati. Ogni schermata tab lo richiama al mount: non c'è
 * uno stato condiviso tra route (ognuna è una pagina indipendente), ma la
 * query è la stessa ovunque quindi vive qui una volta sola. */
export function useViaggio(slug: string | undefined) {
  const [viaggio, setViaggio] = useState<Viaggio | null | undefined>(undefined)
  const [partecipanti, setPartecipanti] = useState<ViaggioPartecipante[]>([])
  const [spese, setSpese] = useState<SpesaConQuote[]>([])
  const [pagamenti, setPagamenti] = useState<ViaggioPagamento[]>([])
  const [caricamento, setCaricamento] = useState(true)

  const caricaDati = useCallback(async (viaggioId: string) => {
    const [{ data: p }, { data: s }, { data: pag }] = await Promise.all([
      supabase.from('viaggio_partecipanti').select('*').eq('viaggio_id', viaggioId).order('creato_il'),
      supabase.from('viaggio_spese').select('*').eq('viaggio_id', viaggioId).order('data', { ascending: false }),
      supabase.from('viaggio_pagamenti').select('*').eq('viaggio_id', viaggioId).order('creato_il', { ascending: false }),
    ])
    setPartecipanti(p ?? [])
    setPagamenti(pag ?? [])

    const speseCaricate = s ?? []
    if (speseCaricate.length === 0) {
      setSpese([])
      setCaricamento(false)
      return
    }
    const { data: q } = await supabase
      .from('viaggio_spesa_partecipanti')
      .select('*')
      .in(
        'spesa_id',
        speseCaricate.map((sp) => sp.id),
      )
    const quoteCaricate = q ?? []
    setSpese(speseCaricate.map((sp) => ({ ...sp, quote: quoteCaricate.filter((qq) => qq.spesa_id === sp.id) })))
    setCaricamento(false)
  }, [])

  useEffect(() => {
    if (!slug) return
    let attivo = true
    setCaricamento(true)
    supabase
      .from('viaggi')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data: v }) => {
        if (!attivo) return
        setViaggio(v ?? null)
        if (v) await caricaDati(v.id)
        else setCaricamento(false)
      })
    return () => {
      attivo = false
    }
  }, [slug, caricaDati])

  const saldi = calcolaSaldi(
    partecipanti,
    spese.map((sp) => ({
      importo: sp.importo,
      pagato_da: sp.pagato_da,
      quote: sp.quote.map((q) => ({ partecipante_id: q.partecipante_id, quota: q.quota })),
    })),
    pagamenti.map((p) => ({ da: p.da, a: p.a, importo: p.importo })),
  )
  const trasferimenti = semplificaDebiti(saldi)

  return {
    viaggio,
    partecipanti,
    spese,
    pagamenti,
    caricamento,
    saldi,
    trasferimenti,
    ricarica: () => (viaggio ? caricaDati(viaggio.id) : Promise.resolve()),
  }
}
