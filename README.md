# Quota — spese di viaggio condivise

App per dividere le spese di un gruppo (viaggi, cene, eventi) tra amici, senza
account: si crea un gruppo, si condivide il link, chi lo apre inserisce solo
il proprio nome. Calcola saldi e il minor numero di trasferimenti possibile
per pareggiare i conti.

## Stack

React + TypeScript + Vite, Tailwind CSS, Supabase (solo Postgres/RLS aperta,
nessuna Auth). Design system proprio ("Modernist", scoped sotto `.quota` in
`src/viaggio/modernist.css`) — Archivo, rosso, spigoli vivi.

## Database

Progetto Supabase dedicato (org "Private", separato da quello di
`famiglia-dashboard`): codice, hosting, dominio e database sono tutti
indipendenti. Le policy RLS restano aperte (`using(true) with check(true)`):
chiunque abbia il link di un gruppo può leggere/scrivere solo i dati di quel
gruppo — non serve un account, coerente con "basta il nome" del prodotto.

Le migration in `supabase/migrations/` sono quelle reali di questo progetto
(CLI linkata a `xjfftogtcojqssnrmifn`). Per applicarne di nuove:

```bash
npx supabase db push --linked
```

## Sviluppo

```bash
npm install
cp .env.example .env.local   # valorizza con le credenziali del progetto Supabase di Quota
npm run dev
```
