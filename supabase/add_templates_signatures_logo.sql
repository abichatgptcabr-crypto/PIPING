-- ═══════════════════════════════════════════════════════════════════════
-- 1) Plantillas de selección reutilizables (recetas de clases, no documentos)
-- ═══════════════════════════════════════════════════════════════════════
create table spec_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  created_by text,
  created_at timestamptz default now()
);
create table spec_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references spec_templates(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  position int not null default 0
);
alter table spec_templates enable row level security;
alter table spec_template_items enable row level security;
create policy "todos leen templates" on spec_templates for select using (true);
create policy "todos escriben templates" on spec_templates for all using (true);
create policy "todos leen template_items" on spec_template_items for select using (true);
create policy "todos escriben template_items" on spec_template_items for all using (true);

-- ═══════════════════════════════════════════════════════════════════════
-- 4) Firmas del documento: Preparado / Revisado / Aprobado, con nombre y fecha
-- ═══════════════════════════════════════════════════════════════════════
alter table specs add column if not exists prepared_by text default '';
alter table specs add column if not exists prepared_date text default '';
alter table specs add column if not exists checked_by text default '';
alter table specs add column if not exists checked_date text default '';
alter table specs add column if not exists approved_by text default '';
alter table specs add column if not exists approved_date text default '';

-- ═══════════════════════════════════════════════════════════════════════
-- 5) Logo del cliente en la portada del PDF
-- ═══════════════════════════════════════════════════════════════════════
alter table specs add column if not exists client_logo_url text default '';
