// Registro locale dei gruppi (nessun account: "Lista gruppi" mostra solo i
// viaggi creati o aperti *su questo dispositivo*, non sincronizzati altrove).

const CHIAVE_GRUPPI = 'quota:miei-gruppi'

export type GruppoLocale = { slug: string; nome: string }

export function elencoGruppiLocali(): GruppoLocale[] {
  try {
    const raw = localStorage.getItem(CHIAVE_GRUPPI)
    return raw ? (JSON.parse(raw) as GruppoLocale[]) : []
  } catch {
    return []
  }
}

export function aggiungiGruppoLocale(gruppo: GruppoLocale) {
  try {
    const attuali = elencoGruppiLocali()
    if (attuali.some((g) => g.slug === gruppo.slug)) return
    localStorage.setItem(CHIAVE_GRUPPI, JSON.stringify([...attuali, gruppo]))
  } catch {
    // storage non disponibile (es. modalità privata): il gruppo resta comunque
    // raggiungibile dal suo link, solo non compare nella lista in home.
  }
}

export function ioNelGruppo(slug: string): string {
  try {
    return localStorage.getItem(`quota:${slug}:io`) ?? ''
  } catch {
    return ''
  }
}

export function impostaIoNelGruppo(slug: string, partecipanteId: string) {
  try {
    localStorage.setItem(`quota:${slug}:io`, partecipanteId)
  } catch {
    // ignorato: la preselezione "sei tu" resta solo per la sessione corrente.
  }
}
