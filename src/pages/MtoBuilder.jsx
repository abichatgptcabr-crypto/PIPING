import React, { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload, Trash2, Download, Plus, RefreshCw, AlertTriangle, Languages, LayoutGrid, Ruler, X, Filter, ClipboardList,
} from "lucide-react";
import { parseCrudoRow, consolidate, withDiff, summarize } from "../lib/mtoEngine";

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
        // saltar encabezado: primer fila con texto tipo MARK/SIZE/DESCRIPTION
        const startIdx = json.findIndex((r) =>
          r.some((c) => /mark|description|codigo_sap/i.test(String(c)))
        );
        const dataRows = startIdx >= 0 ? json.slice(startIdx + 1) : json;
        resolve(dataRows.filter((r) => r.some((c) => String(c).trim() !== "")));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function FileRow({ f, onRemoveArea, onAreaChange, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
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
      arr.map(async (file) => ({ name: file.name, area: "", rows: await readWorkbookRows(file) }))
    );
    setter((prev) => [...prev, ...parsed]);
  }

  function generar() {
    if (files.length === 0) {
      showToast("Subí al menos un archivo crudo de CADWorx.", "error");
      return;
    }
    const allRows = [];
    for (const f of files) {
      for (const r of f.rows) allRows.push(parseCrudoRow(r, f.area || null));
    }
    let consolidado = consolidate(allRows, { roundPipeTo12: roundPipe, byArea });

    if (compareRev && prevFiles.length > 0) {
      const prevRows = [];
      for (const f of prevFiles) {
        for (const r of f.rows) prevRows.push(parseCrudoRow(r, f.area || null));
      }
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

  const resumen = useMemo(() => (result ? summarize(result) : null), [result]);

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

  function exportarExcel() {
    if (!result) return;
    const wb = XLSX.utils.book_new();

    // Carátula simple
    const caratula = [
      ["DOCUMENTO N°", docInfo.documento],
      ["PROYECTO", docInfo.proyecto],
      ["CLIENTE", docInfo.cliente],
      ["REVISIÓN", docInfo.revision],
      ["GENERADO CON", "Hytech Tools — Generador de MTO"],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(caratula), "Carátula");

    // Hoja de Resumen — con esto se sale a comprar: metros totales de caño
    // por diámetro, y cantidad total de unidades por diámetro en cada categoría.
    if (resumen) {
      const aoaResumen = [["CATEGORÍA", "MEDIDA", "CANTIDAD", "UNIDAD"]];
      for (const cat of CATEGORIES) {
        const r = resumen[cat];
        if (!r || r.lineas.length === 0) continue;
        r.lineas.forEach((l) => aoaResumen.push([CAT_LABELS[cat], l.size, l.cantidad, l.unidad]));
        aoaResumen.push(["", `TOTAL ${CAT_LABELS[cat].toUpperCase()}`, r.total, r.unidad]);
        aoaResumen.push(["", "", "", ""]);
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoaResumen), "Resumen");
    }

    for (const cat of CATEGORIES) {
      const rows = grouped[cat] || [];
      if (rows.length === 0) continue;
      const header = compareRev
        ? ["ITEM", "CODIGO SAP", "DESCRIPCIÓN", "DIAMETRO", "UNIDAD", "CANT. ANTERIOR", "CANT. ACTUAL", "DIF.", "SURPLUS", "OBSERVACIONES"]
        : ["ITEM", "CODIGO SAP", "DESCRIPCIÓN", "DIAMETRO", "UNIDAD", "CANTIDAD", "SURPLUS", "OBSERVACIONES"];
      const aoa = [header];
      rows.forEach((r, i) => {
        const ed = (edits[cat] || {})[i] || {};
        const desc = ed.descripcion ?? displayDesc(r);
        const sap = ed.sap ?? r.sap;
        const size = ed.size ?? r.size;
        const surplus = ed.surplus ?? "";
        const obs = ed.obs ?? (r.sinCodigo ? "Sin código SAP en crudo — revisar" : r.sinTraducir ? "Sin traducción verificada — revisar" : "");
        if (compareRev) {
          aoa.push([i + 1, sap, desc, size, r.unidad, r.cantidadAnterior ?? 0, r.cantidad, r.diferencia ?? 0, surplus, obs]);
        } else {
          aoa.push([i + 1, sap, desc, size, r.unidad, r.cantidad, surplus, obs]);
        }
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), CAT_LABELS[cat].slice(0, 31));
    }

    const fname = (docInfo.documento || "MTO") + ".xlsx";
    XLSX.writeFile(wb, fname);
    showToast("Excel generado y descargado.", "success");
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
                        {r.lineas.map((l) => (
                          <tr key={l.size} className="border-t border-slate-100">
                            <td className="px-3 py-1.5 text-slate-600">{l.size}</td>
                            <td className="px-3 py-1.5 text-right font-medium">{l.cantidad} {l.unidad}</td>
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
