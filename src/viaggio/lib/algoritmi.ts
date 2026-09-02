// Algoritmi dello splitter Quota — saldi, settlement e divisione spese.
// Portati dal mockup (design_handoff_quota/README.md, sezione "Algoritmi"),
// adattati a interi in centesimi con distribuzione del resto per
// largest-remainder, come richiesto dal README stesso per la produzione.

export type SaldoPartecipante = {
  id: string
  nome: string
  /** Positivo: gli altri gli devono soldi. Negativo: deve soldi. */
  saldo: number
}

export type Trasferimento = {
  daId: string
  daNome: string
  aId: string
  aNome: string
  importo: number
}

const SOGLIA = 0.005

function arrotonda(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcolaSaldi(
  partecipanti: { id: string; nome: string }[],
  spese: { importo: number; pagato_da: string; quote: { partecipante_id: string; quota: number }[] }[],
  pagamenti: { da: string; a: string; importo: number }[] = [],
): SaldoPartecipante[] {
  const saldi = new Map(partecipanti.map((p) => [p.id, 0]))
  for (const spesa of spese) {
    saldi.set(spesa.pagato_da, (saldi.get(spesa.pagato_da) ?? 0) + spesa.importo)
    for (const q of spesa.quote) {
      saldi.set(q.partecipante_id, (saldi.get(q.partecipante_id) ?? 0) - q.quota)
    }
  }
  for (const pagamento of pagamenti) {
    saldi.set(pagamento.da, (saldi.get(pagamento.da) ?? 0) + pagamento.importo)
    saldi.set(pagamento.a, (saldi.get(pagamento.a) ?? 0) - pagamento.importo)
  }
  return partecipanti.map((p) => ({ id: p.id, nome: p.nome, saldo: arrotonda(saldi.get(p.id) ?? 0) }))
}

/** Riduce i saldi al minor numero di trasferimenti possibile, abbinando
 * ogni volta il debitore e il creditore con l'importo maggiore. */
export function semplificaDebiti(saldi: SaldoPartecipante[]): Trasferimento[] {
  const creditori = saldi
    .filter((s) => s.saldo > SOGLIA)
    .map((s) => ({ ...s }))
    .sort((a, b) => b.saldo - a.saldo)
  const debitori = saldi
    .filter((s) => s.saldo < -SOGLIA)
    .map((s) => ({ ...s }))
    .sort((a, b) => a.saldo - b.saldo)

  const trasferimenti: Trasferimento[] = []
  let i = 0
  let j = 0
  while (i < debitori.length && j < creditori.length) {
    const debitore = debitori[i]
    const creditore = creditori[j]
    const importo = arrotonda(Math.min(-debitore.saldo, creditore.saldo))
    if (importo > SOGLIA) {
      trasferimenti.push({
        daId: debitore.id,
        daNome: debitore.nome,
        aId: creditore.id,
        aNome: creditore.nome,
        importo,
      })
      debitore.saldo = arrotonda(debitore.saldo + importo)
      creditore.saldo = arrotonda(creditore.saldo - importo)
    }
    if (Math.abs(debitore.saldo) <= SOGLIA) i++
    if (Math.abs(creditore.saldo) <= SOGLIA) j++
  }
  return trasferimenti
}

/** Distribuisce `totaleCentesimi` proporzionalmente a `pesi`, assegnando i
 * centesimi residui (dopo l'arrotondamento per difetto) a chi ha la
 * frazione scartata più alta — largest-remainder, la somma torna sempre
 * esatta al totale. */
function distribuisciCentesimi(totaleCentesimi: number, pesi: number[]): number[] {
  const pesoTotale = pesi.reduce((s, p) => s + p, 0)
  if (pesoTotale <= 0) return pesi.map(() => 0)

  const esatti = pesi.map((p) => (totaleCentesimi * p) / pesoTotale)
  const base = esatti.map(Math.floor)
  let resto = totaleCentesimi - base.reduce((s, b) => s + b, 0)

  const ordinePerFrazione = esatti
    .map((e, i) => ({ i, frazione: e - Math.floor(e) }))
    .sort((a, b) => b.frazione - a.frazione)

  const risultato = [...base]
  for (let k = 0; k < ordinePerFrazione.length && resto > 0; k++) {
    risultato[ordinePerFrazione[k].i] += 1
    resto--
  }
  return risultato
}

/** Divide `importo` proporzionalmente ai pesi dati (quote 1..9, o 1 per
 * tutti nel caso della divisione "in parti uguali"). */
export function calcolaQuotePerPeso(
  importo: number,
  pesi: { partecipante_id: string; peso: number }[],
): { partecipante_id: string; quota: number }[] {
  const centesimiTotali = Math.round(importo * 100)
  const centesimi = distribuisciCentesimi(
    centesimiTotali,
    pesi.map((p) => p.peso),
  )
  return pesi.map((p, i) => ({ partecipante_id: p.partecipante_id, quota: centesimi[i] / 100 }))
}

export function calcolaQuoteUguali(
  importo: number,
  partecipantiIds: string[],
): { partecipante_id: string; quota: number }[] {
  return calcolaQuotePerPeso(
    importo,
    partecipantiIds.map((id) => ({ partecipante_id: id, peso: 1 })),
  )
}

/** Residuo tra il totale della spesa e la somma degli importi esatti
 * inseriti a mano: 0 quando tornano, positivo/negativo altrimenti (da
 * mostrare in UI per far correggere l'utente). */
export function residuoImportiEsatti(importo: number, valori: number[]): number {
  const somma = valori.reduce((s, v) => s + v, 0)
  return arrotonda(importo - somma)
}

const ALFABETO_SLUG = 'abcdefghjkmnpqrstuvwxyz23456789' // esclusi caratteri ambigui (i, l, o, 0, 1)

export function generaSlug(lunghezza = 8): string {
  let slug = ''
  for (let i = 0; i < lunghezza; i++) {
    slug += ALFABETO_SLUG[Math.floor(Math.random() * ALFABETO_SLUG.length)]
  }
  return slug
}
