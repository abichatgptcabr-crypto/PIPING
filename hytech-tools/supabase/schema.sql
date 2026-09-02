-- ═══════════════════════════════════════════════════════════════════════
-- Hytech Tools · esquema de base de datos (Supabase / Postgres)
-- ═══════════════════════════════════════════════════════════════════════

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ── PLANTAS / PROYECTOS ───────────────────────────────────────────────
-- naming_convention: JSON genérico que describe cómo se arman los códigos
--   { "type": "segmented", "slots": [ { "slot":"A", "label":"...", "rows":[{"code":"A","value":"..."}] }, ... ] }
--   { "type": "freeform" }
create table plants (
  id text primary key,                 -- slug legible, ej. 'epf-og'
  name text not null,
  kind text default '',
  ref text default '—',
  code text default 'ASME B31.3',
  seeded boolean default true,
  naming_convention jsonb not null default '{"type":"freeform"}'::jsonb,
  created_at timestamptz default now()
);

-- ── CLASES DE PIPING ──────────────────────────────────────────────────
create table classes (
  id uuid primary key default gen_random_uuid(),
  plant_id text not null references plants(id) on delete cascade,
  code text not null,
  fam text default 'custom',
  mat text default '',
  corr text default '',
  rating text default '',
  design text default '',
  services jsonb not null default '[]'::jsonb,
  page int,
  included boolean default true,
  detail jsonb,                        -- { designT, designP, comps, valves, branch, notes } o null

  -- Punto 2: trazabilidad de revisión
  reviewed_by text,
  reviewed_at timestamptz,
  reviewed_against text,               -- ej. "ASME B31.3-2024"

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (plant_id, code)
);

-- ── HISTORIAL DE REVISIONES (una fila por cada guardado de una clase) ──
create table class_revisions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  edited_by text not null,             -- email de quien editó
  edited_at timestamptz default now(),
  snapshot jsonb not null,             -- copia completa de la clase en ese momento
  note text default ''                 -- comentario opcional de qué cambió
);

-- ── ESPECIFICACIONES ARMADAS (desde "Armar especificación") ────────────
create table specs (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Piping Class',
  project text default '',
  client text default '',              -- punto 3: cliente destinatario
  doc_number text default '',
  revision text default '0',
  company text default 'Hytech',
  confidential boolean default true,   -- punto 3: marca de confidencialidad en el PDF
  date text default '',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table spec_items (
  id uuid primary key default gen_random_uuid(),
  spec_id uuid not null references specs(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  position int not null default 0
);

-- ═══════════════════════════════════════════════════════════════════════
-- Seguridad: sólo usuarios logueados (equipo Hytech) pueden leer/escribir
-- ═══════════════════════════════════════════════════════════════════════
alter table plants enable row level security;
alter table classes enable row level security;
alter table class_revisions enable row level security;
alter table specs enable row level security;
alter table spec_items enable row level security;

create policy "logueados leen plants" on plants for select using (auth.role() = 'authenticated');
create policy "logueados escriben plants" on plants for all using (auth.role() = 'authenticated');

create policy "logueados leen classes" on classes for select using (auth.role() = 'authenticated');
create policy "logueados escriben classes" on classes for all using (auth.role() = 'authenticated');

create policy "logueados leen revisions" on class_revisions for select using (auth.role() = 'authenticated');
create policy "logueados escriben revisions" on class_revisions for insert with check (auth.role() = 'authenticated');

create policy "logueados leen specs" on specs for select using (auth.role() = 'authenticated');
create policy "logueados escriben specs" on specs for all using (auth.role() = 'authenticated');

create policy "logueados leen spec_items" on spec_items for select using (auth.role() = 'authenticated');
create policy "logueados escriben spec_items" on spec_items for all using (auth.role() = 'authenticated');

-- Actualiza updated_at automáticamente en cada cambio de clase
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger classes_set_updated_at before update on classes
  for each row execute function set_updated_at();
create trigger specs_set_updated_at before update on specs
  for each row execute function set_updated_at();
