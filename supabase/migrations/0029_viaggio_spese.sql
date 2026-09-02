-- Splitter spese viaggio: pagina pubblica (nessun login) condivisa via link
-- con slug non indovinabile. Tabelle separate da quelle familiari, RLS aperta
-- al ruolo anon solo qui: chiunque abbia il link del viaggio può leggere e
-- scrivere i dati di quel viaggio.

create extension if not exists pgcrypto;

create table if not exists viaggi (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  valuta text not null default 'EUR',
  creato_il timestamptz not null default now()
);

create table if not exists viaggio_partecipanti (
  id uuid primary key default gen_random_uuid(),
  viaggio_id uuid not null references viaggi(id) on delete cascade,
  nome text not null,
  creato_il timestamptz not null default now()
);

create table if not exists viaggio_spese (
  id uuid primary key default gen_random_uuid(),
  viaggio_id uuid not null references viaggi(id) on delete cascade,
  descrizione text not null,
  importo numeric(10,2) not null check (importo > 0),
  pagato_da uuid not null references viaggio_partecipanti(id) on delete cascade,
  data date not null default current_date,
  creato_il timestamptz not null default now()
);

create table if not exists viaggio_spesa_partecipanti (
  spesa_id uuid not null references viaggio_spese(id) on delete cascade,
  partecipante_id uuid not null references viaggio_partecipanti(id) on delete cascade,
  quota numeric(10,2) not null,
  primary key (spesa_id, partecipante_id)
);

create index if not exists idx_viaggio_partecipanti_viaggio on viaggio_partecipanti(viaggio_id);
create index if not exists idx_viaggio_spese_viaggio on viaggio_spese(viaggio_id);
create index if not exists idx_viaggio_spesa_partecipanti_spesa on viaggio_spesa_partecipanti(spesa_id);

alter table viaggi enable row level security;
alter table viaggio_partecipanti enable row level security;
alter table viaggio_spese enable row level security;
alter table viaggio_spesa_partecipanti enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'viaggi',
    'viaggio_partecipanti',
    'viaggio_spese',
    'viaggio_spesa_partecipanti'
  ]
  loop
    execute format('drop policy if exists "accesso pubblico - tutto" on %I', t);
    execute format(
      'create policy "accesso pubblico - tutto" on %I for all using (true) with check (true)',
      t
    );
  end loop;
end $$;
