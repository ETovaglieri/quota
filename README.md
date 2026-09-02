# Quota — spese di viaggio condivise

App per dividere le spese di un gruppo (viaggi, cene, eventi) tra amici, senza
account: si crea un gruppo, si condivide il link, chi lo apre inserisce solo
il proprio nome. Calcola saldi e il minor numero di trasferimenti possibile
per pareggiare i conti.

## Stack

React + TypeScript + Vite, Tailwind CSS, Supabase (solo Postgres/RLS aperta,
nessuna Auth). Design system proprio ("Modernist", scoped sotto `.quota` in
`src/viaggio/modernist.css`) — Archivo, rosso, spigoli vivi.

## Database condiviso

**Questo progetto usa lo stesso progetto Supabase di `famiglia-dashboard`**
(un'altra app, non correlata), ma solo le tabelle `viaggio_*`, con le proprie
policy RLS (`using(true) with check(true)`: chiunque abbia il link di un
gruppo può leggere/scrivere solo i dati di quel gruppo). Le due app sono
completamente indipendenti a livello di codice, hosting e dominio — condividono
solo il database Postgres sottostante per evitare di duplicare
l'infrastruttura per un caso d'uso a basso rischio.

Le migration in `supabase/migrations/` sono qui **solo come documentazione**
dello schema: sono già state applicate al progetto Supabase condiviso dal
repo `famiglia-dashboard` (quello linkato via Supabase CLI). Non c'è bisogno
di rieseguirle da qui.

## Sviluppo

```bash
npm install
cp .env.example .env.local   # valorizza con le credenziali Supabase condivise
npm run dev
```
