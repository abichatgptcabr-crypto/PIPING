-- ═══════════════════════════════════════════════════════════════════════
-- 1) Congela el contenido de cada clase al momento de guardar una spec
--    (para que las revisiones viejas no cambien si alguien edita la clase
--    original más adelante), y habilita notas editables por documento.
-- ═══════════════════════════════════════════════════════════════════════
alter table spec_items add column if not exists snapshot jsonb;

-- ═══════════════════════════════════════════════════════════════════════
-- 2) Corrige categorías de servicios que la clasificación automática por
--    palabras clave no reconoció bien (por tildes / español vs inglés).
--    Sólo afecta filas que ya existían — la función se corrigió en el
--    código para que esto no vuelva a pasar con servicios nuevos.
-- ═══════════════════════════════════════════════════════════════════════
update services set category = 'Gas y utilitarios' where name in ('Nitrógeno', 'Aire de instrumentos');
update services set category = 'Venteos y antorcha' where name in ('Atm. Vents', 'Cold Vents');
