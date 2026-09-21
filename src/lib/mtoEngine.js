// Motor de consolidación de MTO (Material Take-Off) a partir del crudo
// exportado de CADWorx. No inventa nada: clasifica por reglas verificadas
// contra archivos reales de Hytech, y todo lo que no puede resolver con
// certeza queda marcado explícitamente para que alguien lo complete a mano.
import { lookupSap } from "../data/mtoDictionary.js";

// ---------- 1. Clasificación por categoría ----------
// Reglas verificadas contra 1046-RDA-P-LM-102 y 1029-SCH-P-LM-001 (reales).
const RULES = [
  { cat: "CAÑERIAS", test: (d) => /^PIPE,/i.test(d) },
  { cat: "BRIDAS", test: (d) => /\bFLG\b/i.test(d) },
  { cat: "JUNTAS", test: (d) => /GASKET/i.test(d) || /RING\s*JOINT/i.test(d) },
  { cat: "ESPARRAGOS", test: (d) => /STUD BOLT/i.test(d) },
  { cat: "VALVULAS", test: (d) => /^V[ÁA]LVULA/i.test(d) || /\bVALVE\b/i.test(d) },
  {
    cat: "ACCESORIOS",
    test: (d) =>
      /\bELL\b/i.test(d) ||
      /\bTEE\b/i.test(d) ||
      /\bRED\s+(ECC|CON|EXC)?\b/i.test(d) ||
      /WELDOLET/i.test(d) ||
      /CASQUETE|CAP\b/i.test(d) ||
      /COUPLING|UNION/i.test(d) ||
      /SOCKOLET/i.test(d) ||
      /\bNIPPLE\b/i.test(d) ||
      /HEX HEAD PLUG|\bPLUG\b/i.test(d) ||
      /WELD GAP/i.test(d),
  },
];

export function classify(description) {
  const d = (description || "").trim();
  for (const r of RULES) {
    if (r.test(d)) return r.cat;
  }
  return "SIN_CLASIFICAR";
}

// ---------- 2. Parseo de una fila cruda de CADWorx ----------
// El crudo de CADWorx NO siempre trae las mismas columnas ni en el mismo orden
// (verificado con 3 exportaciones reales distintas: una de 7 columnas sin AREA
// ni SOLAPA, una de 11 columnas con AREA+SOLAPA, y una de 10 sin ellas pero con
// WEIGHT). Por eso se lee por NOMBRE de columna, tomado del encabezado real,
// nunca por posición fija.
const VALID_CATS = ["CAÑERIAS", "ACCESORIOS", "BRIDAS", "JUNTAS", "ESPARRAGOS", "VALVULAS"];

// El crudo aparece con nombres de columna en inglés o en español según cómo
// esté configurado el reporte — verificado con 4 exportaciones reales
// distintas. Se reconoce por cualquiera de estos alias, sin importar
// mayúsculas ni tildes.
const FIELD_ALIASES = {
  MARK: ["MARK", "ITEM"],
  SIZE: ["SIZE", "DIAMETRO"],
  DESCRIPTION: ["DESCRIPTION", "DESCRIPCION"],
  LENGTH: ["LENGTH", "LONGITUD"],
  QUANTITY: ["QUANTITY", "CANTIDAD"],
  WEIGHT: ["WEIGHT", "PESO"],
  CODIGO_SAP: ["CODIGO_SAP", "CODIGO SAP", "SAP"],
  AREA: ["AREA"],
  SOLAPA: ["SOLAPA", "CATEGORIA"],
};

function stripAccents(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function buildHeaderMap(headerRow) {
  const rawByNormalized = {};
  (headerRow || []).forEach((h, i) => {
    const key = stripAccents(h).trim().toUpperCase();
    if (key && !(key in rawByNormalized)) rawByNormalized[key] = i;
  });
  const map = {};
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (alias in rawByNormalized) {
        map[canonical] = rawByNormalized[alias];
        break;
      }
    }
  }
  return map;
}

// SOLAPA es la categoría que el propio CADWorx ya asigna al exportar — cuando
// viene, es más confiable que adivinar por palabras clave en la descripción.
function normalizeCategoria(raw) {
  if (raw == null) return null;
  const v = String(raw).trim().toUpperCase().replace("CANERIAS", "CAÑERIAS");
  return VALID_CATS.includes(v) ? v : null;
}

export function parseCrudoRow(headerMap, row, area = null) {
  const get = (name) => {
    const idx = headerMap[name];
    return idx === undefined ? undefined : row[idx];
  };
  const description = String(get("DESCRIPTION") ?? "").trim();
  const size = get("SIZE") ?? "";
  const lengthRaw = get("LENGTH");
  const lenNum = typeof lengthRaw === "number" ? lengthRaw : parseFloat(lengthRaw);
  const sapRaw = get("CODIGO_SAP");
  const sap = sapRaw != null && String(sapRaw).trim() !== "-" && String(sapRaw).trim() !== ""
    ? String(sapRaw).trim() : null;
  const areaCol = get("AREA");
  const areaFinal = areaCol !== undefined && areaCol !== null && String(areaCol).trim() !== ""
    ? String(areaCol).trim() : area;
  const categoriaSolapa = normalizeCategoria(get("SOLAPA"));

  return {
    mark: get("MARK"),
    size,
    description,
    lengthMm: Number.isFinite(lenNum) ? lenNum : null, // '-' u otros -> null (no es caño)
    quantity: Number(get("QUANTITY")) || 0,
    weight: Number(get("WEIGHT")) || 0,
    sap,
    area: areaFinal,
    categoria: categoriaSolapa || classify(description),
    categoriaVerificada: !!categoriaSolapa, // vino de SOLAPA, no se adivinó por palabra clave
  };
}

// ---------- 3. Consolidación ----------
// Llave de agrupación: código SAP cuando existe (es el dato confiable);
// si no hay código SAP, se agrupa por descripción+medida tal cual viene
// (y queda marcado sinCodigo: true para que se revise a mano).
function groupKey(row) {
  if (row.sap) return `sap:${row.sap}`;
  return `desc:${row.categoria}:${row.description}::${row.size}`;
}

export function consolidate(rows, { roundPipeTo12 = false, byArea = false } = {}) {
  const groups = new Map();

  for (const row of rows) {
    const key = byArea ? `${row.area || "—"}::${groupKey(row)}` : groupKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        sap: row.sap,
        categoria: row.categoria,
        description: row.description,
        size: row.size,
        area: byArea ? row.area : null,
        sinCodigo: !row.sap,
        totalQuantity: 0,
        totalLengthMm: 0,
        totalWeight: 0,
        esCano: row.categoria === "CAÑERIAS",
      });
    }
    const g = groups.get(key);
    g.totalQuantity += row.quantity || 0;
    g.totalWeight += row.weight || 0;
    if (row.lengthMm) g.totalLengthMm += row.lengthMm;
  }

  const out = [];
  for (const g of groups.values()) {
    let cantidad = g.totalQuantity;
    let unidad = "Un.";
    if (g.esCano) {
      let metros = g.totalLengthMm / 1000;
      if (roundPipeTo12 && metros % 12 !== 0) {
        metros = Math.ceil(metros / 12) * 12;
      }
      cantidad = metros;
      unidad = "m";
    }
    const dicHit = g.sap ? lookupSap(g.sap) : null;
    out.push({
      sap: g.sap || "",
      categoria: g.categoria,
      area: g.area,
      descripcionOriginal: g.description,
      descripcionEspanol: dicHit ? dicHit.nombre : null, // null = sin traducir, se muestra el original
      size: g.size,
      unidad,
      cantidad,
      peso: Math.round(g.totalWeight * 100) / 100,
      sinCodigo: g.sinCodigo,
      sinTraducir: g.categoria !== "VALVULAS" && !dicHit,
    });
  }
  // orden estable: por categoría, luego por diámetro descendente cuando es numérico, si no alfabético
  return out.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.size.localeCompare(b.size));
}

// ---------- 4. Resumen de compra (agrupado por categoría + medida) ----------
// Esta es la vista con la que el cliente sale a comprar: metros totales de
// caño por diámetro, y cantidad total de unidades por diámetro en cada una
// de las otras categorías. No reemplaza el detalle, lo resume.
export function summarize(consolidado) {
  const porCategoria = {};
  for (const cat of ["CAÑERIAS", "ACCESORIOS", "BRIDAS", "JUNTAS", "ESPARRAGOS", "VALVULAS"]) {
    const filas = consolidado.filter((r) => r.categoria === cat);
    const porMedida = new Map();
    for (const f of filas) {
      const key = f.size || "—";
      porMedida.set(key, (porMedida.get(key) || 0) + (f.cantidad || 0));
    }
    const unidad = cat === "CAÑERIAS" ? "m" : "Un.";
    const lineas = [...porMedida.entries()]
      .map(([size, cantidad]) => ({ size, cantidad: Math.round(cantidad * 100) / 100, unidad }))
      .sort((a, b) => a.size.localeCompare(b.size));
    const total = Math.round(lineas.reduce((s, l) => s + l.cantidad, 0) * 100) / 100;
    porCategoria[cat] = { lineas, total, unidad };
  }
  return porCategoria;
}

// ---------- 5. Comparación contra revisión anterior ----------
export function withDiff(actual, anterior) {
  const prevByKey = new Map();
  for (const r of anterior) {
    const k = r.sap ? `sap:${r.sap}` : `desc:${r.categoria}:${r.descripcionOriginal}::${r.size}`;
    prevByKey.set(k, r.cantidad);
  }
  return actual.map((r) => {
    const k = r.sap ? `sap:${r.sap}` : `desc:${r.categoria}:${r.descripcionOriginal}::${r.size}`;
    const prev = prevByKey.has(k) ? prevByKey.get(k) : 0;
    return { ...r, cantidadAnterior: prev, diferencia: Math.round((r.cantidad - prev) * 100) / 100 };
  });
}
