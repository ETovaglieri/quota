// Tipi Supabase per Quota. Il database è condiviso con il progetto
// famiglia-dashboard (stesso Supabase, tabelle separate): questo file
// definisce solo le tabelle viaggio_* che questa app usa.

export type CategoriaSpesaViaggio = 'voli' | 'alloggio' | 'trasporti' | 'cibo' | 'attivita' | 'altro'

export type Viaggio = {
  id: string
  slug: string
  nome: string
  valuta: string
  data_inizio: string | null
  data_fine: string | null
  luogo: string | null
  chiuso: boolean
  creato_il: string
}

export type ViaggioPartecipante = {
  id: string
  viaggio_id: string
  nome: string
  creato_il: string
}

export type ViaggioSpesa = {
  id: string
  viaggio_id: string
  descrizione: string
  importo: number
  pagato_da: string
  categoria: CategoriaSpesaViaggio
  data: string
  creato_il: string
}

export type ViaggioSpesaPartecipante = {
  spesa_id: string
  partecipante_id: string
  quota: number
}

export type ViaggioPagamento = {
  id: string
  viaggio_id: string
  da: string
  a: string
  importo: number
  creato_il: string
}

export type Database = {
  public: {
    Tables: {
      viaggi: {
        Row: Viaggio
        Insert: Omit<Viaggio, 'id' | 'creato_il' | 'valuta' | 'chiuso' | 'data_inizio' | 'data_fine' | 'luogo'> & {
          id?: string
          creato_il?: string
          valuta?: string
          chiuso?: boolean
          data_inizio?: string | null
          data_fine?: string | null
          luogo?: string | null
        }
        Update: Partial<Viaggio>
        Relationships: []
      }
      viaggio_partecipanti: {
        Row: ViaggioPartecipante
        Insert: Omit<ViaggioPartecipante, 'id' | 'creato_il'> & { id?: string; creato_il?: string }
        Update: Partial<ViaggioPartecipante>
        Relationships: []
      }
      viaggio_spese: {
        Row: ViaggioSpesa
        Insert: Omit<ViaggioSpesa, 'id' | 'creato_il' | 'categoria'> & {
          id?: string
          creato_il?: string
          categoria?: CategoriaSpesaViaggio
        }
        Update: Partial<ViaggioSpesa>
        Relationships: []
      }
      viaggio_spesa_partecipanti: {
        Row: ViaggioSpesaPartecipante
        Insert: ViaggioSpesaPartecipante
        Update: Partial<ViaggioSpesaPartecipante>
        Relationships: []
      }
      viaggio_pagamenti: {
        Row: ViaggioPagamento
        Insert: Omit<ViaggioPagamento, 'id' | 'creato_il'> & { id?: string; creato_il?: string }
        Update: Partial<ViaggioPagamento>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
