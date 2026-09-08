import { CADWORX_DICTIONARY } from "../data/cadworxDictionary";

// Reglas de palabras clave → tipo general esperado. Sólo filtran candidatos
// dentro de esa categoría — la variante puntual (material, schedule, extremos)
// se decide después, por superposición de palabras real.
const RULES = [
  { re: /\bpipe\b/i, type: 3 },
  { re: /45.?(°|deg)?\s*ell|45.?l\b/i, type: 5 },
  { re: /90.?(°|deg)?\s*ell|elbow|90.?l\b/i, type: 4 },
  { re: /reducing tee|tee.*red/i, type: 10 },
  { re: /\btee\b/i, type: 9 },
  { re: /reducer.*ecc|ecc.*reduc/i, type: 16 },
  { re: /reducer|\bred\b/i, type: 15 },
  { re: /swage.*ecc|ecc.*swage/i, type: 18 },
  { re: /swage/i, type: 17 },
  { re: /bushing/i, type: 19 },
  { re: /stub end/i, type: 20 },
  { re: /flange.*(sw|socket)/i, type: 21 },
  { re: /flange.*(wn|weld ?neck).*long/i, type: 22 },
  { re: /flange.*(wn|weld ?neck)/i, type: 23 },
  { re: /flange.*(so|slip ?on)/i, type: 24 },
  { re: /flange.*blind|blind.*flange/i, type: 25 },
  { re: /flange.*(lj|lap ?joint)/i, type: 26 },
  { re: /flange.*(thr|npt|threaded)/i, type: 66 },
  { re: /coupling.*red|red.*coupling/i, type: 32 },
  { re: /half.*coupl|coupling.*half/i, type: 31 },
  { re: /coupling/i, type: 30 },
  { re: /weldolet|threadolet|sockolet|thredolet/i, type: 34 },
  { re: /latrolet/i, type: 35 },
  { re: /nipolet|nip.?olet/i, type: 36 },
  { re: /\bcap\b/i, type: 1 },
  { re: /hex.*plug|plug.*hex/i, type: 2 },
  { re: /ball valve|\bball\b/i, type: 40 },
  { re: /butterfly/i, type: 41 },
  { re: /check valve|\bcheck\b/i, type: 42 },
  { re: /diaphragm/i, type: 45 },
  { re: /gate valve|\bgate\b/i, type: 46 },
  { re: /globe/i, type: 48 },
  { re: /needle/i, type: 49 },
  { re: /plug valve/i, type: 51 },
  { re: /relief/i, type: 52 },
  { re: /stud.*bolt|\bbolt/i, type: 54 },
  { re: /gasket/i, type: 55 },
  { re: /spectacle/i, type: 58 },
  { re: /paddle|spacer/i, type: 57 },
  { re: /union/i, type: 60 },
  { re: /lateral/i, type: 61 },
  { re: /strainer/i, type: 64 },
  { re: /nipple/i, type: 76 },
];

function tokenize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
}

// row: la fila actual. prevDescription: la Descripción de la fila anterior
// (para heredar contexto en filas de continuación, que dejan ese campo
// vacío a propósito — sin esto, una fila de continuación no tiene ninguna
// palabra clave propia y termina "matcheando" cualquier cosa al azar).
export function matchComponent(row, prevDescription) {
  const effectiveDesc = row[0] && row[0].trim() ? row[0] : (prevDescription || "");
  const text = [effectiveDesc, ...row.slice(1)].join(" ");

  const rule = RULES.find((r) => r.re.test(text));
  if (!rule) return { match: null, score: 0 }; // sin regla clara → no se adivina

  const candidates = CADWORX_DICTIONARY.filter((d) => d.type === rule.type);
  const tokens = new Set(tokenize(text));

  let best = null, bestScore = 0;
  for (const cand of candidates) {
    const candTokens = tokenize(cand.long + " " + cand.name);
    const overlap = candTokens.filter((t) => tokens.has(t)).length;
    if (overlap > bestScore) { bestScore = overlap; best = cand; }
  }
  // Umbral más exigente: sólo se acepta si hay coincidencia real de
  // material/schedule/extremos, no sólo la categoría general.
  return bestScore >= 3 ? { match: best, score: bestScore } : { match: null, score: bestScore };
}

// Aplica matchComponent a una lista de filas en orden, pasando el contexto
// de la fila anterior para las filas de continuación (Descripción vacía).
export function matchRows(rows) {
  let prevDesc = "";
  return rows.map((r) => {
    const result = matchComponent(r, prevDesc);
    if (r[0] && r[0].trim()) prevDesc = r[0];
    return { row: r, ...result };
  });
}
