-- ═══════════════════════════════════════════════════════════════════════
-- Catálogo de servicios (cross-planta) + flag de codificación en las specs
-- ═══════════════════════════════════════════════════════════════════════

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,          -- texto del servicio tal como aparece en las clases
  category text not null default 'Otros',
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table services enable row level security;
create policy "todos leen services" on services for select using (true);
create policy "todos escriben services" on services for all using (true);

create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

-- Si al generar una spec se incluye o no el índice de servicios codificado
alter table specs add column if not exists service_coding boolean default true;
