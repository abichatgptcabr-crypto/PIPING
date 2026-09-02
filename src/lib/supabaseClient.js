import { createClient } from "@supabase/supabase-js";

// Estos dos valores NO son secretos: la "publishable key" de Supabase está
// diseñada para vivir en el navegador. La seguridad real la da Row Level
// Security en la base (ver supabase/schema.sql) — sólo usuarios logueados
// (invitados desde el dashboard de Supabase) pueden leer o escribir.
const SUPABASE_URL = "https://vkvruippwlfptoggpdns.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bHmf95AtkjsuS0xy2Agl7w_b2SQ1g4M";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
