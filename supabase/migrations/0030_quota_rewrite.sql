-- Riscrittura "Quota": estende lo schema spese di viaggio con date/luogo del
-- gruppo, categorie di spesa e pagamenti registrati (settlement). Nessun dato
-- reale esiste ancora su queste tabelle: sicuro estendere senza migrazione dati.

alter table viaggi
  add column if not exists data_inizio date,
  add column if not exists data_fine date,
  add column if not exists luogo text,
  add column if not exists chiuso boolean not null default false;

alter table viaggio_spese
  add column if not exists categoria text not null default 'altro';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'viaggio_spese_categoria_check'
  ) then
    alter table viaggio_spese
      add constraint viaggio_spese_categoria_check
      check (categoria in ('voli', 'alloggio', 'trasporti', 'cibo', 'attivita', 'altro'));
  end if;
end $$;

create table if not exists viaggio_pagamenti (
  id uuid primary key default gen_random_uuid(),
  viaggio_id uuid not null references viaggi(id) on delete cascade,
  da uuid not null references viaggio_partecipanti(id) on delete cascade,
  a uuid not null references viaggio_partecipanti(id) on delete cascade,
  importo numeric(10,2) not null check (importo > 0),
  creato_il timestamptz not null default now()
);

create index if not exists idx_viaggio_pagamenti_viaggio on viaggio_pagamenti(viaggio_id);

alter table viaggio_pagamenti enable row level security;

drop policy if exists "accesso pubblico - tutto" on viaggio_pagamenti;
create policy "accesso pubblico - tutto" on viaggio_pagamenti
  for all using (true) with check (true);
