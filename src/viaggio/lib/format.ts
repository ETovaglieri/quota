// Formattazione valuta per Quota — italiano, simbolo prima con spazio,
// minus tipografico sui saldi (spec del mockup Modernist).

const LOCALE_IT = 'it-IT'
const MINUS = '−'

function formattaNumero(valore: number): string {
  return new Intl.NumberFormat(LOCALE_IT, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.abs(valore),
  )
}

export function formattaEuroIT(valore: number): string {
  return `€ ${formattaNumero(valore)}`
}

export function formattaSaldoIT(valore: number, soglia = 0.005): string {
  if (Math.abs(valore) <= soglia) return 'in pari'
  const segno = valore > 0 ? '+' : MINUS
  return `${segno} € ${formattaNumero(valore)}`
}

export function formattaDataBreve(dataISO: string): string {
  return new Date(dataISO + 'T00:00:00').toLocaleDateString(LOCALE_IT, { day: 'numeric', month: 'short' })
}

export function formattaIntervalloDate(inizio: string | null, fine: string | null): string {
  if (!inizio) return ''
  const opzioniGiorno: Intl.DateTimeFormatOptions = { day: 'numeric' }
  const opzioniMese: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  const dInizio = new Date(inizio + 'T00:00:00')
  if (!fine) return dInizio.toLocaleDateString(LOCALE_IT, opzioniMese)
  const dFine = new Date(fine + 'T00:00:00')
  const stessoMese = dInizio.getMonth() === dFine.getMonth() && dInizio.getFullYear() === dFine.getFullYear()
  const inizioTesto = stessoMese
    ? dInizio.toLocaleDateString(LOCALE_IT, opzioniGiorno)
    : dInizio.toLocaleDateString(LOCALE_IT, opzioniMese)
  return `${inizioTesto} – ${dFine.toLocaleDateString(LOCALE_IT, opzioniMese)}`
}
