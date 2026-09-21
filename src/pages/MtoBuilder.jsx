import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx"; // se usa solo para LEER el crudo de CADWorx
import ExcelJS from "exceljs"; // se usa para ESCRIBIR el entregable con estilo (xlsx no permite colores/bordes)
import {
  Upload, Trash2, Download, Plus, RefreshCw, AlertTriangle, Languages, LayoutGrid, Ruler, X, Filter, ClipboardList,
  CheckCircle2, Info,
} from "lucide-react";
import { buildHeaderMap, parseCrudoRow, consolidate, withDiff, summarize, detectColumns, FIELD_ALIASES } from "../lib/mtoEngine";

// Paleta del entregable — mismos colores que ya usa Hytech Tools en la
// interfaz, para que el Excel se vea de la misma familia visual.
const NAVY = "FF113044";
const BLUE = "FF00589E";
const LIGHT_BAND = "FFEFF4F8";
const WARN_BAND = "FFFEF3C7";
const BORDER_COLOR = "FFB9C4CC";
const THIN_BORDER = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = THIN_BORDER;
  });
  row.height = 22;
}

function styleDataRow(row, flagged) {
  row.eachCell((cell) => {
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", wrapText: true };
    if (flagged) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WARN_BAND } };
  });
}

function downloadWorkbook(wb, filename) {
  return wb.xlsx.writeBuffer().then((buf) => {
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// Etiquetas legibles para la leyenda de columnas reconocidas, en el mismo
// orden que se muestran en pantalla. Se arma a partir de FIELD_ALIASES del
// motor para que la leyenda nunca se desincronice de lo que realmente lee.
const FIELD_LABELS = {
  MARK: { label: "Ítem", req: false },
  SIZE: { label: "Medida / diámetro", req: false },
  DESCRIPTION: { label: "Descripción", req: true },
  LENGTH: { label: "Longitud (para caños)", req: false },
  QUANTITY: { label: "Cantidad", req: true },
  WEIGHT: { label: "Peso", req: false },
  CODIGO_SAP: { label: "Código SAP", req: false },
  AREA: { label: "Área", req: false },
  SOLAPA: { label: "Categoría (solapa de CADWorx)", req: false },
};

// Aviso propio de esta página (no depende de la forma exacta del Toast
// compartido, que no estaba disponible para verificar al construir esto).
function Banner({ msg, kind, onClose }) {
  if (!msg) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm text-[12.5px] px-3.5 py-2.5 rounded-md shadow-lg flex items-start gap-2 ${
        kind === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      }`}
    >
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

const CATEGORIES = ["CAÑERIAS", "ACCESORIOS", "BRIDAS", "JUNTAS", "ESPARRAGOS", "VALVULAS"];
const CAT_LABELS = {
  CAÑERIAS: "Cañerías",
  ACCESORIOS: "Accesorios",
  BRIDAS: "Bridas",
  JUNTAS: "Juntas",
  ESPARRAGOS: "Espárragos",
  VALVULAS: "Válvulas",
};
// Categorías donde suele hacer falta corrección manual (código SAP ausente en el
// crudo, medidas que no salen bien de CADWorx, etc.) — mismo motor, pero el
// usuario sabe que acá conviene mirar con más atención.
const NEEDS_REVIEW = { ESPARRAGOS: true, BRIDAS: true, VALVULAS: true };

function readWorkbookRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheetName = wb.SheetNames.find((n) => /bom|mto/i.test(n)) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        // encontrar la fila de encabezado real (el crudo de CADWorx no siempre
        // tiene las mismas columnas ni en el mismo orden — se identifican por
        // nombre, nunca por posición fija)
        const startIdx = json.findIndex((r) =>
          r.some((c) => /mark|item|description|descripcion|codigo.?sap|solapa/i.test(String(c)))
        );
        const header = startIdx >= 0 ? json[startIdx] : json[0];
        const dataRows = startIdx >= 0 ? json.slice(startIdx + 1) : json.slice(1);
        resolve({ header, rows: dataRows.filter((r) => r.some((c) => String(c).trim() !== "")) });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function FileRow({ f, onRemoveArea, onAreaChange, onRemove }) {
  const ok = f.colInfo?.ok;
  return (
    <div className={`rounded-md px-3 py-2 border ${ok ? "bg-slate-50 border-slate-200" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <AlertTriangle size={14} className="text-red-500 shrink-0" />}
        <span className="text-[12.5px] text-slate-700 flex-1 truncate">{f.name}</span>
        <input
          value={f.area}
          onChange={(e) => onAreaChange(e.target.value)}
          placeholder="Área (opcional)"
          className="w-40 text-[12px] border border-slate-300 rounded px-2 py-1"
        />
        <span className="text-[11px] text-slate-400">{f.rows.length} filas</span>
        <button onClick={onRemove} className="text-slate-400 hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
      {!ok && (
        <p className="text-[11.5px] text-red-700 mt-1.5 pl-6">
          No se puede procesar: no tiene columna de <b>{f.colInfo.missingRequired.join(" ni de ")}</b> — es un
          formato distinto al modelo general que reconoce la herramienta. Columnas detectadas: {f.colInfo.found.join(", ") || "ninguna reconocida"}.
        </p>
      )}
      {ok && f.colInfo.missingRecommended.length > 0 && (
        <p className="text-[11px] text-amber-600 mt-1.5 pl-6">
          Sin columna de {f.colInfo.missingRecommended.map((k) => FIELD_LABELS[k]?.label || k).join(" / ")} — se
          procesa igual, agrupando por descripción en vez de por código.
        </p>
      )}
    </div>
  );
}

function ColumnLegend() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Info size={13} className="text-slate-400" />
        <h2 className="text-[12.5px] font-semibold text-slate-700">Columnas que reconoce esta herramienta</h2>
      </div>
      <p className="text-[11.5px] text-slate-500 mb-2">
        Lee el crudo por el NOMBRE de columna (en inglés o en español, con o sin tilde), no por su posición ni orden.
        No hace falta que el archivo tenga todas — <b>Descripción</b> y <b>Cantidad</b> son las únicas obligatorias;
        el resto es opcional y, si falta, se avisa y se sigue procesando con lo que sí está (por ejemplo, proyectos
        que no usan código SAP se agrupan por descripción + medida en vez de por código).
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(FIELD_ALIASES).map(([field, aliases]) => (
          <span
            key={field}
            className={`text-[11px] px-2 py-1 rounded border ${
              FIELD_LABELS[field]?.req ? "bg-white border-slate-300 text-slate-700 font-medium" : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            {FIELD_LABELS[field]?.label || field} <span className="text-slate-400">({aliases.join(" / ")})</span>
            {FIELD_LABELS[field]?.req && <span className="text-red-500"> *</span>}
          </span>
        ))}
      </div>
      <p className="text-[10.5px] text-slate-400 mt-1.5">* obligatoria — sin esta columna el archivo no se puede procesar.</p>
    </div>
  );
}

export default function MtoBuilder() {
  const [notice, setNotice] = useState(null); // { msg, kind }
  const showToast = (msg, kind = "success") => {
    setNotice({ msg, kind });
    setTimeout(() => setNotice(null), 4000);
  };
  const [files, setFiles] = useState([]); // [{name, area, rows}]
  const [prevFiles, setPrevFiles] = useState([]);
  const [compareRev, setCompareRev] = useState(false);
  const [roundPipe, setRoundPipe] = useState(false);
  const [byArea, setByArea] = useState(false);
  const [lang, setLang] = useState("es"); // "es" | "en"
  const [docInfo, setDocInfo] = useState({ documento: "", proyecto: "", cliente: "", revision: "0" });
  const [result, setResult] = useState(null); // consolidado calculado
  const [edits, setEdits] = useState({}); // overrides manuales por índice
  const [activeTab, setActiveTab] = useState("RESUMEN");
  const [bulkFilter, setBulkFilter] = useState("");
  const [bulkExcluded, setBulkExcluded] = useState({}); // { [cat]: Set(idx) }
  const [bulkSap, setBulkSap] = useState("");
  const [bulkDesc, setBulkDesc] = useState("");
  const fileInputRef = useRef(null);
  const prevInputRef = useRef(null);

  async function handleFiles(fileList, setter) {
    const arr = Array.from(fileList);
    const parsed = await Promise.all(
      arr.map(async (file) => {
        const { header, rows } = await readWorkbookRows(file);
        return { name: file.name, area: "", header, rows, colInfo: detectColumns(header) };
      })
    );
    setter((prev) => [...prev, ...parsed]);
  }

  // Convierte las filas crudas de un set de archivos a filas parseadas,
  // leyendo cada una por el encabezado real de SU propio archivo (no todos
  // los crudos traen las mismas columnas) y descartando filas de pie de
  // página / totales que no tienen descripción (no son componentes).
  function parseFileSet(fileSet) {
    const out = [];
    for (const f of fileSet) {
      const headerMap = buildHeaderMap(f.header);
      for (const r of f.rows) {
        const parsed = parseCrudoRow(headerMap, r, f.area || null);
        if (parsed.description) out.push(parsed);
      }
    }
    return out;
  }

  function generar() {
    if (files.length === 0) {
      showToast("Subí al menos un archivo crudo de CADWorx.", "error");
      return;
    }
    const rotos = files.filter((f) => f.colInfo && !f.colInfo.ok);
    if (rotos.length > 0) {
      showToast(
        `No se puede generar: ${rotos.map((f) => f.name).join(", ")} no tiene columnas de ` +
          `${[...new Set(rotos.flatMap((f) => f.colInfo.missingRequired))].join(" / ")} — es un formato distinto ` +
          `al modelo general. Sacá ese archivo o avisame para agregar soporte a ese formato.`,
        "error"
      );
      return;
    }
    const allRows = parseFileSet(files);
    let consolidado = consolidate(allRows, { roundPipeTo12: roundPipe, byArea });

    if (compareRev && prevFiles.length > 0) {
      const prevRows = parseFileSet(prevFiles);
      const prevConsolidado = consolidate(prevRows, { roundPipeTo12: roundPipe, byArea });
      consolidado = withDiff(consolidado, prevConsolidado);
    }
    setResult(consolidado);
    setEdits({});
    const sinClasificar = allRows.filter((r) => r.categoria === "SIN_CLASIFICAR").length;
    const sinTraducir = consolidado.filter((c) => c.sinTraducir).length;
    showToast(
      `Generado — ${consolidado.length} ítems consolidados` +
        (sinClasificar ? ` · ${sinClasificar} filas sin clasificar` : "") +
        (sinTraducir ? ` · ${sinTraducir} sin traducción verificada` : ""),
      sinClasificar || sinTraducir ? "error" : "success"
    );
  }

  function rowKey(catRows, idx) {
    return `${catRows === undefined ? "" : ""}${idx}`;
  }

  function updateCell(cat, idx, field, value) {
    setEdits((prev) => ({
      ...prev,
      [cat]: { ...(prev[cat] || {}), [idx]: { ...((prev[cat] || {})[idx] || {}), [field]: value } },
    }));
  }

  const grouped = useMemo(() => {
    if (!result) return {};
    const g = {};
    for (const cat of CATEGORIES) g[cat] = result.filter((r) => r.categoria === cat);
    return g;
  }, [result]);

  const resumen = useMemo(() => (result ? summarize(result, lang) : null), [result, lang]);

  function displayDesc(row) {
    if (lang === "en") return row.descripcionOriginal;
    return row.descripcionEspanol || row.descripcionOriginal; // sin traducción -> fallback inglés, marcado
  }

  // ---------- Edición en bloque ----------
  // Filtra las filas de la categoría activa por texto (descripción o código SAP),
  // muestra cuáles matchean y deja sacar del lote las que no correspondan antes
  // de aplicar el mismo código SAP y/o descripción a todo el resto de una.
  const bulkMatches = useMemo(() => {
    if (!result || !bulkFilter.trim()) return [];
    const needle = bulkFilter.trim().toLowerCase();
    const rows = grouped[activeTab] || [];
    return rows
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => (displayDesc(r) + " " + (r.sap || "")).toLowerCase().includes(needle));
  }, [result, bulkFilter, activeTab, grouped, lang]);

  const excludedSet = bulkExcluded[activeTab] || new Set();

  function toggleExcluded(idx) {
    setBulkExcluded((prev) => {
      const set = new Set(prev[activeTab] || []);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...prev, [activeTab]: set };
    });
  }

  function aplicarEnBloque() {
    const objetivo = bulkMatches.filter(({ idx }) => !excludedSet.has(idx));
    if (objetivo.length === 0) {
      showToast("No hay filas seleccionadas para aplicar.", "error");
      return;
    }
    setEdits((prev) => {
      const catEdits = { ...(prev[activeTab] || {}) };
      for (const { idx } of objetivo) {
        catEdits[idx] = {
          ...(catEdits[idx] || {}),
          ...(bulkSap.trim() ? { sap: bulkSap.trim() } : {}),
          ...(bulkDesc.trim() ? { descripcion: bulkDesc.trim() } : {}),
        };
      }
      return { ...prev, [activeTab]: catEdits };
    });
    showToast(`Aplicado a ${objetivo.length} fila(s).`, "success");
    setBulkFilter(""); setBulkSap(""); setBulkDesc("");
    setBulkExcluded((prev) => ({ ...prev, [activeTab]: new Set() }));
  }

  async function exportarExcel() {
    if (!result) return;
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "Hytech Tools";
      wb.created = new Date();

      // ---------- Carátula ----------
      // Cuadro de título + datos del documento + historial de revisiones,
      // con el mismo esquema de colores que el resto de la herramienta
      // (siguiendo el estilo de carátula real de Hytech que vimos en
      // 1029-SCH-P-LM-001.xlsm: banda de título, cuadro de datos con
      // bordes, tabla de revisiones abajo).
      const car = wb.addWorksheet("Carátula");
      car.columns = [{ width: 20 }, { width: 42 }, { width: 16 }, { width: 20 }, { width: 20 }];
      car.mergeCells("A1:E2");
      const title = car.getCell("A1");
      title.value = "GENERADOR DE MTO — HYTECH TOOLS";
      title.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      title.alignment = { vertical: "middle", horizontal: "center" };
      for (let rr = 1; rr <= 2; rr++)
        for (let cc = 1; cc <= 5; cc++)
          car.getRow(rr).getCell(cc).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };

      let r = 4;
      [
        ["DOCUMENTO N°", docInfo.documento || "—"],
        ["PROYECTO", docInfo.proyecto || "—"],
        ["CLIENTE", docInfo.cliente || "—"],
        ["REVISIÓN", docInfo.revision || "0"],
        ["FECHA", new Date().toLocaleDateString("es-AR")],
      ].forEach(([label, value]) => {
        const lc = car.getCell(`A${r}`);
        lc.value = label;
        lc.font = { bold: true, color: { argb: NAVY } };
        lc.border = THIN_BORDER;
        lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BAND } };
        car.mergeCells(`B${r}:E${r}`);
        const vc = car.getCell(`B${r}`);
        vc.value = value;
        vc.border = THIN_BORDER;
        r += 1;
      });

      r += 1;
      car.mergeCells(`A${r}:E${r}`);
      const revTitle = car.getCell(`A${r}`);
      revTitle.value = "HISTORIAL DE REVISIONES";
      revTitle.font = { bold: true, color: { argb: "FFFFFFFF" } };
      revTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
      revTitle.alignment = { horizontal: "center" };
      r += 1;
      const revHeaderRow = car.getRow(r);
      ["REV.", "DESCRIPCIÓN", "FECHA", "", ""].forEach((h, i) => (revHeaderRow.getCell(i + 1).value = h));
      styleHeaderRow(revHeaderRow);
      r += 1;
      const revDataRow = car.getRow(r);
      revDataRow.getCell(1).value = docInfo.revision || "0";
      revDataRow.getCell(2).value = "EMISIÓN";
      revDataRow.getCell(3).value = new Date().toLocaleDateString("es-AR");
      styleDataRow(revDataRow, false);
      r += 2;
      const footer = car.getCell(`A${r}`);
      footer.value = "Generado con Hytech Tools — Generador de MTO. Lo marcado en amarillo en las hojas de detalle requiere revisión manual.";
      footer.font = { italic: true, size: 9, color: { argb: "FF64748B" } };

      // ---------- Resumen de compra ----------
      if (resumen) {
        const rs = wb.addWorksheet("Resumen");
        rs.columns = [
          { header: "CATEGORÍA", key: "cat", width: 16 },
          { header: "DESCRIPCIÓN", key: "desc", width: 44 },
          { header: "MEDIDA", key: "size", width: 12 },
          { header: "CANTIDAD", key: "cant", width: 12 },
          { header: "UNIDAD", key: "un", width: 10 },
        ];
        styleHeaderRow(rs.getRow(1));
        rs.views = [{ state: "frozen", ySplit: 1 }];
        for (const cat of CATEGORIES) {
          const rdata = resumen[cat];
          if (!rdata || rdata.lineas.length === 0) continue;
          rdata.lineas.forEach((l) => {
            const row = rs.addRow({ cat: CAT_LABELS[cat], desc: l.descripcion || "", size: l.size, cant: l.cantidad, un: l.unidad });
            styleDataRow(row, false);
          });
          const totalRow = rs.addRow({ cat: "", desc: `TOTAL ${CAT_LABELS[cat].toUpperCase()}`, size: "", cant: rdata.total, un: rdata.unidad });
          totalRow.eachCell((c) => {
            c.font = { bold: true };
            c.border = THIN_BORDER;
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BAND } };
          });
        }
      }

      // ---------- Hojas por categoría ----------
      for (const cat of CATEGORIES) {
        const rows = grouped[cat] || [];
        if (rows.length === 0) continue;
        const ws = wb.addWorksheet(CAT_LABELS[cat].slice(0, 31));
        const cols = compareRev
          ? [
              { header: "ITEM", key: "item", width: 8 },
              { header: "CODIGO SAP", key: "sap", width: 14 },
              { header: "DESCRIPCIÓN", key: "desc", width: 46 },
              { header: "DIAMETRO", key: "size", width: 12 },
              { header: "UNIDAD", key: "un", width: 9 },
              { header: "CANT. ANTERIOR", key: "prev", width: 14 },
              { header: "CANT. ACTUAL", key: "cant", width: 13 },
              { header: "DIF.", key: "dif", width: 9 },
              { header: "SURPLUS", key: "surplus", width: 10 },
              { header: "OBSERVACIONES", key: "obs", width: 34 },
            ]
          : [
              { header: "ITEM", key: "item", width: 8 },
              { header: "CODIGO SAP", key: "sap", width: 14 },
              { header: "DESCRIPCIÓN", key: "desc", width: 46 },
              { header: "DIAMETRO", key: "size", width: 12 },
              { header: "UNIDAD", key: "un", width: 9 },
              { header: "CANTIDAD", key: "cant", width: 12 },
              { header: "SURPLUS", key: "surplus", width: 10 },
              { header: "OBSERVACIONES", key: "obs", width: 34 },
            ];
        ws.columns = cols;
        styleHeaderRow(ws.getRow(1));
        ws.views = [{ state: "frozen", ySplit: 1 }];
        rows.forEach((row0, i) => {
          const ed = (edits[cat] || {})[i] || {};
          const desc = ed.descripcion ?? displayDesc(row0);
          const sap = ed.sap ?? row0.sap;
          const size = ed.size ?? row0.size;
          const surplus = ed.surplus ?? "";
          const flagged = row0.sinCodigo || row0.sinTraducir;
          const obs = ed.obs ?? (row0.sinCodigo ? "Sin código SAP en crudo — revisar" : row0.sinTraducir ? "Sin traducción verificada — revisar" : "");
          const rowData = compareRev
            ? { item: i + 1, sap, desc, size, un: row0.unidad, prev: row0.cantidadAnterior ?? 0, cant: row0.cantidad, dif: row0.diferencia ?? 0, surplus, obs }
            : { item: i + 1, sap, desc, size, un: row0.unidad, cant: row0.cantidad, surplus, obs };
          const row = ws.addRow(rowData);
          styleDataRow(row, flagged);
        });
        ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + cols.length)}1` };
      }

      const fname = (docInfo.documento || "MTO") + ".xlsx";
      await downloadWorkbook(wb, fname);
      showToast("Excel generado y descargado.", "success");
    } catch (err) {
      showToast("No se pudo generar el Excel: " + err.message, "error");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <Banner msg={notice?.msg} kind={notice?.kind} onClose={() => setNotice(null)} />
      <h1 className="text-[20px] font-display font-semibold text-[#113044] mb-1">Generar MTO</h1>
      <p className="text-[13px] text-slate-500 mb-5">
        Subí el/los crudo(s) exportado(s) de CADWorx y armá el MTO consolidado — clasificado, sumado y
        traducido a la nomenclatura de Hytech cuando el código SAP ya está verificado. Lo que no se puede
        resolver con certeza queda marcado para que lo revises, nunca se inventa.
      </p>

      <ColumnLegend />

      {/* Datos del documento */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {["documento", "proyecto", "cliente", "revision"].map((k) => (
          <input
            key={k}
            value={docInfo[k]}
            onChange={(e) => setDocInfo((d) => ({ ...d, [k]: e.target.value }))}
            placeholder={k === "documento" ? "N° documento" : k[0].toUpperCase() + k.slice(1)}
            className="text-[12.5px] border border-slate-300 rounded-md px-2.5 py-1.5"
          />
        ))}
      </div>

      {/* Carga de archivos */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-semibold text-slate-700">Crudo de CADWorx</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[12.5px] bg-[#00589E] text-white px-3 py-1.5 rounded-md hover:bg-[#00406E]"
          >
            <Upload size={13} /> Subir archivo(s)
          </button>
          <input
            ref={fileInputRef} type="file" multiple accept=".xlsx,.xls,.xlsm" className="hidden"
            onChange={(e) => { handleFiles(e.target.files, setFiles); e.target.value = ""; }}
          />
        </div>
        {files.length === 0 ? (
          <p className="text-[12px] text-slate-400 italic">Ningún archivo cargado todavía.</p>
        ) : (
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <FileRow
                key={i} f={f}
                onAreaChange={(v) => setFiles((prev) => prev.map((x, j) => (j === i ? { ...x, area: v } : x)))}
                onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-2">
          Si el modelo está dividido en áreas, subí un archivo por área y ponele el nombre al lado — si no,
          dejalo en blanco y se procesa como un solo bloque.
        </p>
      </div>

      {/* Comparar con revisión anterior */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <label className="flex items-center gap-2 text-[13px] font-medium text-slate-700 cursor-pointer">
          <input type="checkbox" checked={compareRev} onChange={(e) => setCompareRev(e.target.checked)} />
          Comparar contra una revisión anterior (si es la primera vez, dejalo destildado — sale todo en 0)
        </label>
        {compareRev && (
          <div className="mt-3">
            <button
              onClick={() => prevInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[12.5px] border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50"
            >
              <Plus size={13} /> Subir crudo de la revisión anterior
            </button>
            <input
              ref={prevInputRef} type="file" multiple accept=".xlsx,.xls,.xlsm" className="hidden"
              onChange={(e) => { handleFiles(e.target.files, setPrevFiles); e.target.value = ""; }}
            />
            <div className="mt-2 space-y-1.5">
              {prevFiles.map((f, i) => (
                <FileRow
                  key={i} f={f}
                  onAreaChange={(v) => setPrevFiles((prev) => prev.map((x, j) => (j === i ? { ...x, area: v } : x)))}
                  onRemove={() => setPrevFiles((prev) => prev.filter((_, j) => j !== i))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opciones */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
          <input type="checkbox" checked={roundPipe} onChange={(e) => setRoundPipe(e.target.checked)} />
          <Ruler size={13} /> Redondear metros de caño a múltiplos de 12
        </label>
        <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer">
          <input type="checkbox" checked={byArea} onChange={(e) => setByArea(e.target.checked)} />
          <LayoutGrid size={13} /> Desglosar por área (si etiquetaste áreas arriba)
        </label>
        <div className="flex items-center gap-2 text-[12.5px] text-slate-700">
          <Languages size={13} />
          <button
            onClick={() => setLang("es")}
            className={`px-2 py-1 rounded ${lang === "es" ? "bg-[#00589E] text-white" : "bg-slate-100"}`}
          >Español</button>
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded ${lang === "en" ? "bg-[#00589E] text-white" : "bg-slate-100"}`}
          >Original (inglés)</button>
        </div>
      </div>

      <button
        onClick={generar}
        className="flex items-center gap-2 bg-[#113044] text-white text-[13px] font-medium px-4 py-2 rounded-md hover:bg-[#0c2333] mb-6"
      >
        <RefreshCw size={14} /> Generar MTO consolidado
      </button>

      {/* Resultado editable por categoría */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveTab("RESUMEN")}
                className={`text-[12px] px-3 py-1.5 rounded-md flex items-center gap-1 font-medium ${
                  activeTab === "RESUMEN" ? "bg-[#113044] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ClipboardList size={12} /> Resumen de compra
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`text-[12px] px-3 py-1.5 rounded-md flex items-center gap-1 ${
                    activeTab === cat ? "bg-[#00589E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {CAT_LABELS[cat]} ({(grouped[cat] || []).length})
                  {NEEDS_REVIEW[cat] && <AlertTriangle size={11} className={activeTab === cat ? "text-yellow-300" : "text-yellow-500"} />}
                </button>
              ))}
            </div>
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 text-[12.5px] bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700"
            >
              <Download size={13} /> Descargar Excel
            </button>
          </div>

          {activeTab === "RESUMEN" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => {
                const r = resumen?.[cat];
                if (!r || r.lineas.length === 0) return null;
                return (
                  <div key={cat} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-[#00589E] text-white text-[12.5px] font-medium px-3 py-2 flex justify-between">
                      <span>{CAT_LABELS[cat]}</span>
                      <span>{r.total} {r.unidad}</span>
                    </div>
                    <table className="w-full text-[12px]">
                      <tbody>
                        {r.lineas.map((l, i) => (
                          <tr key={`${l.descripcion || ""}-${l.size}-${i}`} className="border-t border-slate-100">
                            {l.descripcion != null && (
                              <td className="px-3 py-1.5 text-slate-600 truncate max-w-[220px]" title={l.descripcion}>{l.descripcion}</td>
                            )}
                            <td className="px-3 py-1.5 text-slate-600">{l.size}</td>
                            <td className="px-3 py-1.5 text-right font-medium whitespace-nowrap">{l.cantidad} {l.unidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              <p className="sm:col-span-2 text-[11.5px] text-slate-400">
                Esta vista suma todas las medidas de cada categoría — es la que sirve para salir a comprar.
                El detalle ítem por ítem está en las otras pestañas.
              </p>
            </div>
          ) : (
          <>
          {NEEDS_REVIEW[activeTab] && (
            <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} /> En esta categoría el código SAP y las medidas a veces no vienen
              bien del crudo — revisá y editá directamente en la tabla antes de exportar.
            </p>
          )}

          {/* Edición en bloque: filtrás por texto, la herramienta te muestra qué matchea,
              podés sacar del lote lo que no corresponda, y aplicás código/descripción a todo el resto */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-slate-400" />
              <input
                value={bulkFilter}
                onChange={(e) => setBulkFilter(e.target.value)}
                placeholder='Filtrar grupo (ej: 7/8" o STUD BOLT)'
                className="text-[12px] border border-slate-300 rounded px-2 py-1 w-56"
              />
              {bulkFilter.trim() && (
                <span className="text-[11.5px] text-slate-500">{bulkMatches.length} fila(s) encontradas</span>
              )}
            </div>
            {bulkFilter.trim() && bulkMatches.length > 0 && (
              <>
                <div className="mt-2 max-h-32 overflow-y-auto border border-slate-200 rounded bg-white divide-y divide-slate-100">
                  {bulkMatches.map(({ r, idx }) => (
                    <label key={idx} className="flex items-center gap-2 px-2 py-1 text-[11.5px] cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={!excludedSet.has(idx)}
                        onChange={() => toggleExcluded(idx)}
                      />
                      <span className={excludedSet.has(idx) ? "line-through text-slate-400" : ""}>
                        {r.sap || "—"} · {displayDesc(r)} · {r.size}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <input
                    value={bulkSap} onChange={(e) => setBulkSap(e.target.value)}
                    placeholder="Nuevo código SAP (opcional)"
                    className="text-[12px] border border-slate-300 rounded px-2 py-1 w-44"
                  />
                  <input
                    value={bulkDesc} onChange={(e) => setBulkDesc(e.target.value)}
                    placeholder="Nueva descripción (opcional)"
                    className="text-[12px] border border-slate-300 rounded px-2 py-1 w-64"
                  />
                  <button
                    onClick={aplicarEnBloque}
                    className="text-[12px] bg-[#00589E] text-white px-3 py-1.5 rounded-md hover:bg-[#00406E]"
                  >
                    Aplicar a {bulkMatches.length - excludedSet.size} fila(s)
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-2 py-2">Código SAP</th>
                  <th className="px-2 py-2">Descripción</th>
                  <th className="px-2 py-2">Medida</th>
                  <th className="px-2 py-2">Unidad</th>
                  {compareRev && <th className="px-2 py-2">Ant.</th>}
                  <th className="px-2 py-2">Cantidad</th>
                  {compareRev && <th className="px-2 py-2">Dif.</th>}
                  <th className="px-2 py-2">Surplus</th>
                  <th className="px-2 py-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[activeTab] || []).map((r, i) => {
                  const ed = (edits[activeTab] || {})[i] || {};
                  const flagged = r.sinCodigo || r.sinTraducir;
                  return (
                    <tr key={i} className={`border-t border-slate-100 ${flagged ? "bg-amber-50/60" : ""}`}>
                      <td className="px-2 py-1">
                        <input
                          value={ed.sap ?? r.sap ?? ""}
                          onChange={(e) => updateCell(activeTab, i, "sap", e.target.value)}
                          className="w-24 border border-transparent focus:border-slate-300 rounded px-1 py-0.5 bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={ed.descripcion ?? displayDesc(r)}
                          onChange={(e) => updateCell(activeTab, i, "descripcion", e.target.value)}
                          className="w-full min-w-[220px] border border-transparent focus:border-slate-300 rounded px-1 py-0.5 bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={ed.size ?? r.size}
                          onChange={(e) => updateCell(activeTab, i, "size", e.target.value)}
                          className="w-16 border border-transparent focus:border-slate-300 rounded px-1 py-0.5 bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1 text-slate-500">{r.unidad}</td>
                      {compareRev && <td className="px-2 py-1 text-slate-500">{r.cantidadAnterior ?? 0}</td>}
                      <td className="px-2 py-1 font-medium">{r.cantidad}</td>
                      {compareRev && (
                        <td className={`px-2 py-1 ${r.diferencia > 0 ? "text-emerald-600" : r.diferencia < 0 ? "text-red-500" : "text-slate-400"}`}>
                          {r.diferencia > 0 ? "+" : ""}{r.diferencia ?? 0}
                        </td>
                      )}
                      <td className="px-2 py-1">
                        <input
                          value={ed.surplus ?? ""}
                          onChange={(e) => updateCell(activeTab, i, "surplus", e.target.value)}
                          placeholder="—"
                          className="w-16 border border-transparent focus:border-slate-300 rounded px-1 py-0.5 bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          value={ed.obs ?? (r.sinCodigo ? "Sin código SAP en crudo" : r.sinTraducir ? "Sin traducción verificada" : "")}
                          onChange={(e) => updateCell(activeTab, i, "obs", e.target.value)}
                          className="w-full min-w-[160px] border border-transparent focus:border-slate-300 rounded px-1 py-0.5 bg-transparent text-amber-700"
                        />
                      </td>
                    </tr>
                  );
                })}
                {(grouped[activeTab] || []).length === 0 && (
                  <tr><td colSpan={9} className="px-2 py-6 text-center text-slate-400">Sin ítems en esta categoría.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}
