-- ═══════════════════════════════════════════════════════════════════════
-- Saca el requisito de login temporalmente: cualquiera con la URL puede
-- leer/escribir. Para volver a exigir login más adelante, correr
-- schema.sql de nuevo desde las secciones de "policy" (o pedirle a Claude
-- el SQL de reversión).
-- ═══════════════════════════════════════════════════════════════════════
drop policy if exists "logueados leen plants" on plants;
drop policy if exists "logueados escriben plants" on plants;
create policy "todos leen plants" on plants for select using (true);
create policy "todos escriben plants" on plants for all using (true);

drop policy if exists "logueados leen classes" on classes;
drop policy if exists "logueados escriben classes" on classes;
create policy "todos leen classes" on classes for select using (true);
create policy "todos escriben classes" on classes for all using (true);

drop policy if exists "logueados leen revisions" on class_revisions;
drop policy if exists "logueados escriben revisions" on class_revisions;
create policy "todos leen revisions" on class_revisions for select using (true);
create policy "todos escriben revisions" on class_revisions for insert with check (true);

drop policy if exists "logueados leen specs" on specs;
drop policy if exists "logueados escriben specs" on specs;
create policy "todos leen specs" on specs for select using (true);
create policy "todos escriben specs" on specs for all using (true);

drop policy if exists "logueados leen spec_items" on spec_items;
drop policy if exists "logueados escriben spec_items" on spec_items;
create policy "todos leen spec_items" on spec_items for select using (true);
create policy "todos escriben spec_items" on spec_items for all using (true);
