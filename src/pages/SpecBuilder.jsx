import React, { useState, useMemo, useEffect } from "react";
import {
  FileStack, Search, X, Printer, ArrowLeft, Building2, ShieldCheck, ShieldAlert,
  CheckSquare, Square, MinusSquare, FileWarning, Loader2, Save, FolderOpen, Trash2,
  FileSpreadsheet, Link2, Check, StickyNote, RotateCcw, Plus,
} from "lucide-react";
import { FAMILIES, COMP_COLS, VALVE_COLS } from "../data/plants";
import { fetchAllPlants, saveSpec, fetchSpecs, fetchSpecItems, fetchSpecById, deleteSpec, fetchServiceCatalog, computeServiceCodes, markReviewed, clearReviewed } from "../lib/api";
import * as XLSX from "xlsx";

/* ═══════════════════════════ Selector cross-planta ═══════════════════════ */
function PlantColumn({ plant, selectedIds, onToggle, onToggleGroup, q }) {
  const filtered = plant.classes.filter((k) => {
    if (!q) return true;
    const hay = (k.code + " " + k.services.join(" ") + " " + k.mat).toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  const groups = useMemo(() => {
    const g = {};
    filtered.forEach((k) => (g[k.fam] ||= []).push(k));
    return Object.entries(g);
  }, [filtered]);
  if (plant.classes.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={14} className="text-slate-400" />
        <h3 className="text-[13px] font-semibold text-slate-800">{plant.name}</h3>
        <span className="text-[11px] text-slate-400">{plant.classes.length} clases</span>
      </div>
      {filtered.length === 0 ? (
        <div className="text-[12px] text-slate-400 pl-6">Sin resultados para el filtro.</div>
      ) : (
        <div className="space-y-3">
          {groups.map(([fam, list]) => {
            const allIn = list.every((k) => selectedIds.has(k.id));
            const someIn = !allIn && list.some((k) => selectedIds.has(k.id));
            return (
              <div key={fam}>
                <button
                  onClick={() => onToggleGroup(plant, list, !allIn)}
                  className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-slate-500 hover:text-[#1F3F6E] mb-1.5"
                >
                  {allIn ? <CheckSquare size={12} className="text-[#2C568E]" /> : someIn ? <MinusSquare size={12} className="text-[#2C568E]" /> : <Square size={12} className="text-slate-300" />}
                  {FAMILIES[fam] || fam} <span className="text-slate-400 normal-case">({list.length})</span>
                </button>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {list.map((k) => {
                    const checked = selectedIds.has(k.id);
                    return (
                      <button
                        key={k.id}
                        onClick={() => onToggle(plant, k)}
                        className={`flex items-start gap-2 text-left px-2.5 py-2 rounded-md border text-[12.5px] transition ${
                          checked ? "border-[#2C568E] bg-[#EAF3FB]" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {checked ? <CheckSquare size={14} className="text-[#2C568E] mt-0.5 shrink-0" /> : <Square size={14} className="text-slate-300 mt-0.5 shrink-0" />}
                        <span className="min-w-0">
                          <span className="font-mono font-semibold text-slate-800">{k.code}</span>
                          <span className="text-slate-500"> · {k.rating} · {k.mat}</span>
                          {!k.detail && <span className="ml-1 text-[10px] text-slate-400">(sólo resumen)</span>}
                          {k.reviewedBy ? <ShieldCheck size={11} className="inline ml-1 -mt-0.5 text-emerald-600" /> : <ShieldAlert size={11} className="inline ml-1 -mt-0.5 text-slate-300" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════ Vista de impresión ═══════════════════════════ */
function PrintSpecTable({ cols, rows }) {
  return (
    <table className="w-full text-[9px] font-mono border-collapse mb-3">
      <thead>
        <tr>
          {cols.map((h) => (
            <th key={h} className="text-left font-bold px-1.5 py-1 border border-black bg-slate-200">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td key={j} className="px-1.5 py-0.5 border border-black align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrintBranchMatrix({ data }) {
  if (!data || !data.sizes || !data.sizes.length) return null;
  const { sizes, m, legend } = data;
  return (
    <div className="mb-3">
      <table className="text-[8px] font-mono border-collapse">
        <thead>
          <tr>
            <th className="border border-black bg-slate-800 text-white px-1 py-0.5">RAMA \ RUN</th>
            {sizes.map((s) => <th key={s} className="border border-black bg-slate-200 px-1 py-0.5">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {sizes.map((br) => (
            <tr key={br}>
              <td className="border border-black bg-slate-100 font-bold px-1 py-0.5">{br}</td>
              {sizes.map((run) => (
                <td key={run} className="border border-black text-center px-1 py-0.5">{(m[br] && m[br][run]) || ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[8px] mt-1 flex flex-wrap gap-x-4">
        {legend.map((l, i) => <span key={i}>{i + 1}. {l}</span>)}
      </div>
    </div>
  );
}

export function Watermark() {
  return (
    <div
      className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <span
        className="text-[38px] font-bold uppercase text-black/10"
        style={{ transform: "rotate(-32deg) scale(0.9)", whiteSpace: "nowrap" }}
      >
        Confidencial — uso interno
      </span>
    </div>
  );
}

export function PrintClassPage({ item, plantName, docMeta, index, total }) {
  const d = item.detail;
  return (
    <section className="print-page relative">
      {docMeta.confidential && <Watermark />}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="flex items-stretch border-b-4 border-black mb-3">
          <div className="flex-1 pb-2">
            <div className="text-[15px] font-bold uppercase">{docMeta.title || "Piping Class"}</div>
            <div className="text-[10px] text-slate-600">Technical Specification{docMeta.client ? ` — Preparado para ${docMeta.client}` : ""}</div>
            <div className="text-[9px] font-mono text-slate-500 mt-1">DOCUMENTO Nº: {docMeta.docNumber || "—"} · REVISIÓN: {docMeta.revision || "0"} · Clase {index + 1} de {total}</div>
          </div>
          <div className="bg-black text-white flex items-center justify-center px-6 shrink-0">
            <span className="text-[32px] font-bold font-mono leading-none tracking-tight">{item.code}</span>
          </div>
        </div>

        <div className="flex text-[9px] border border-black mb-3">
          <div className="flex-1 p-2 border-r border-black">
            <div className="font-bold mb-1">TEMPERATURE °C / DESIGN PRESSURE kg/cm²</div>
            {d ? (
              <table className="font-mono">
                <tbody>
                  <tr>{d.designT.map((t, i) => <td key={i} className="px-2 border border-black">{t}</td>)}</tr>
                  <tr>{d.designP.map((p, i) => <td key={i} className="px-2 border border-black">{p}</td>)}</tr>
                </tbody>
              </table>
            ) : <span className="text-slate-400">{item.design}</span>}
          </div>
          <div className="w-56 p-2">
            <div><b>FLANGE CLASS:</b> {item.rating}</div>
            <div><b>CORROSION:</b> {item.corr}</div>
            <div><b>MATERIAL:</b> {item.mat}</div>
            <div><b>CODE:</b> ASME B31.3</div>
          </div>
        </div>
        <div className="text-[9px] mb-1"><b>SERVICE:</b> {item.services.join(" / ")}</div>
        <div className="text-[9px] mb-3 text-slate-500">
          Origen: {plantName} · clase {item.code}{item.page ? ` · pág. ${item.page} doc. fuente` : ""}
          {item.reviewedBy ? (
            <span className="ml-2 text-emerald-700"><ShieldCheck size={9} className="inline -mt-0.5" /> revisado por {item.reviewedBy} el {new Date(item.reviewedAt).toLocaleDateString("es-AR")}{item.reviewedAgainst ? ` contra ${item.reviewedAgainst}` : ""}</span>
          ) : (
            <span className="ml-2 text-amber-600">sin marcar como revisado</span>
          )}
        </div>

        {!d ? (
          <div className="border border-black p-3 text-[10px] flex items-start gap-2">
            <FileWarning size={14} className="shrink-0 mt-0.5" />
            <span><b className="font-mono">{item.code}</b>: esta clase no tiene el detalle de componentes/válvulas/ramificaciones transcripto todavía —
            sólo se incluye el resumen. Consultar el documento fuente para el detalle completo.</span>
          </div>
        ) : (
          <>
            <div className="flex items-stretch mb-1">
              <div className="bg-black text-white text-[10px] font-bold px-2 py-1 flex-1">PIPING CLASS COMPONENTS</div>
              <div className="bg-black text-white text-[11px] font-bold px-3 py-1 flex items-center border-l border-slate-600">{item.code}</div>
            </div>
            <PrintSpecTable cols={COMP_COLS} rows={d.comps} />
            {d.valves.length > 0 && <>
              <div className="bg-black text-white text-[10px] font-bold px-2 py-1 mb-1">VALVES</div>
              <PrintSpecTable cols={VALVE_COLS} rows={d.valves} />
            </>}
            {d.branch && d.branch.sizes.length > 0 && <>
              <div className="bg-black text-white text-[10px] font-bold px-2 py-1 mb-1">BRANCH TABLE</div>
              <PrintBranchMatrix data={d.branch} />
            </>}
            {d.notes.length > 0 && <>
              <div className="bg-black text-white text-[10px] font-bold px-2 py-1 mb-1">NOTES</div>
              <ol className="text-[9px] space-y-0.5 list-decimal list-inside">
                {d.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ol>
            </>}
          </>
        )}
      </div>
    </section>
  );
}

export function PrintCoverPage({ docMeta, items }) {
  return (
    <section className="print-page relative">
      {docMeta.confidential && <Watermark />}
      <div className="border-2 border-black h-full flex flex-col relative" style={{ zIndex: 1 }}>
        <div className="border-b-2 border-black p-6 text-center">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">{docMeta.company || "Hytech"}</div>
          <div className="text-[26px] font-bold uppercase mb-1">{docMeta.title || "Piping Class"}</div>
          <div className="text-[13px] text-slate-600">Technical Specification</div>
          {docMeta.client && <div className="text-[12px] text-slate-500 mt-1">Preparado para: <b>{docMeta.client}</b></div>}
          {docMeta.confidential && <div className="text-[10px] uppercase tracking-widest text-red-700 font-bold mt-3">Confidencial — uso interno</div>}
        </div>
        <div className="grid grid-cols-2 text-[10px] font-mono border-b-2 border-black">
          <div className="p-3 border-r border-black"><b>PROYECTO:</b> {docMeta.project || "—"}</div>
          <div className="p-3"><b>DOCUMENTO Nº:</b> {docMeta.docNumber || "—"}</div>
          <div className="p-3 border-r border-black"><b>REVISIÓN:</b> {docMeta.revision || "0"}</div>
          <div className="p-3"><b>FECHA:</b> {docMeta.date || "—"}</div>
        </div>
        <div className="p-6 flex-1">
          <div className="text-[11px] font-bold uppercase mb-3 border-b border-black pb-1">Summary — Clases incluidas</div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">Ítem</th><th className="text-left py-1">Clase</th>
                <th className="text-left py-1">Origen</th><th className="text-left py-1">Servicio</th>
                <th className="text-left py-1">Rating</th><th className="text-left py-1">Material</th>
                <th className="text-left py-1">Revisado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-slate-300">
                  <td className="py-1">{i + 1}</td>
                  <td className="py-1 font-bold">{it.item.code}</td>
                  <td className="py-1">{it.plantName}</td>
                  <td className="py-1">{it.item.services[0]}{it.item.services.length > 1 ? " …" : ""}</td>
                  <td className="py-1">{it.item.rating}</td>
                  <td className="py-1">{it.item.mat}</td>
                  <td className="py-1">{it.item.reviewedBy ? "sí" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-[9px] text-slate-400 border-t border-black">
          Documento armado con el Generador de piping class de Hytech Tools — combina clases de más de un proyecto/estándar base. Verificar compatibilidad de códigos, condiciones de diseño y estado de revisión de cada clase antes de emitir para construcción.
        </div>
      </div>
    </section>
  );
}

export function ServiceIndexPage({ items, catalog, codes }) {
  const uniqueNames = [...new Set(items.flatMap((s) => (s.item.services || []).filter((n) => n && !n.startsWith("("))))];
  const withInfo = uniqueNames
    .map((name) => ({ name, code: codes.get(name) || "—", info: catalog.find((c) => c.name === name) }))
    .sort((a, b) => (a.code || "").localeCompare(b.code || ""));

  return (
    <section className="print-page">
      <header className="border-b-2 border-black pb-2 mb-3">
        <div className="text-[15px] font-bold uppercase">Índice de servicios</div>
        <div className="text-[10px] text-slate-600">Códigos de referencia para los servicios incluidos en este documento</div>
      </header>
      <table className="w-full text-[10px] font-mono border-collapse">
        <thead>
          <tr>
            <th className="text-left font-bold px-2 py-1.5 border border-black bg-slate-200 w-20">Código</th>
            <th className="text-left font-bold px-2 py-1.5 border border-black bg-slate-200">Servicio</th>
            <th className="text-left font-bold px-2 py-1.5 border border-black bg-slate-200">Categoría</th>
            <th className="text-left font-bold px-2 py-1.5 border border-black bg-slate-200">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {withInfo.map((s, i) => (
            <tr key={i}>
              <td className="px-2 py-1 border border-black font-semibold">{s.code}</td>
              <td className="px-2 py-1 border border-black">{s.name}</td>
              <td className="px-2 py-1 border border-black">{s.info?.category || "—"}</td>
              <td className="px-2 py-1 border border-black">{s.info?.description || <span className="text-slate-400">sin descripción cargada</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ═══════════════════════════════ Página principal ═══════════════════════ */
export default function SpecBuilder() {
  const [plants, setPlants] = useState([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]); // [{ plantId, plantName, item }]
  const [mode, setMode] = useState("build"); // 'build' | 'print'
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [savedSpecs, setSavedSpecs] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [docMeta, setDocMeta] = useState({
    title: "Piping Class", project: "", client: "", docNumber: "", revision: "0",
    company: "Hytech", confidential: true, serviceCoding: true, date: new Date().toLocaleDateString("es-AR"),
  });
  const [serviceCatalog, setServiceCatalog] = useState([]);

  useEffect(() => {
    fetchAllPlants().then((data) => { setPlants(data); setReady(true); }).catch(() => setReady(true));
    fetchServiceCatalog().then(setServiceCatalog).catch(() => setServiceCatalog([]));
  }, []);
  const serviceCodes = useMemo(() => computeServiceCodes(serviceCatalog), [serviceCatalog]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.item.id)), [selected]);

  const groupedSpecs = useMemo(() => {
    if (!savedSpecs) return [];
    const map = new Map();
    for (const s of savedSpecs) {
      const key = (s.doc_number && s.doc_number.trim()) || `${s.title}::${s.project}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()]
      .map(([key, items]) => ({ key, items: items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }))
      .sort((a, b) => new Date(b.items[0].created_at) - new Date(a.items[0].created_at));
  }, [savedSpecs]);

  const toggle = (plant, item) => {
    setSelected((sel) =>
      sel.some((s) => s.item.id === item.id)
        ? sel.filter((s) => s.item.id !== item.id)
        : [...sel, { plantId: plant.id, plantName: plant.name, item }]
    );
  };
  const toggleGroup = (plant, list, addAll) => {
    setSelected((sel) => {
      const ids = new Set(list.map((k) => k.id));
      const withoutGroup = sel.filter((s) => !ids.has(s.item.id));
      if (!addAll) return withoutGroup;
      const toAdd = list.map((k) => ({ plantId: plant.id, plantName: plant.name, item: k }));
      return [...withoutGroup, ...toAdd];
    });
  };
  const remove = (itemId) => setSelected((sel) => sel.filter((s) => s.item.id !== itemId));

  const [editingNotesFor, setEditingNotesFor] = useState(null);
  const setNotesFor = (itemId, notes) =>
    setSelected((sel) => sel.map((s) => s.item.id === itemId
      ? { ...s, item: { ...s.item, detail: { ...s.item.detail, notes } } } : s));
  const restoreNotes = (itemId) => {
    const master = plants.flatMap((p) => p.classes).find((k) => k.id === itemId);
    if (master?.detail) setNotesFor(itemId, master.detail.notes);
  };

  const toggleReviewed = async (s) => {
    if (s.item.reviewedBy) {
      await clearReviewed(s.item.id);
      setSelected((sel) => sel.map((x) => x.item.id === s.item.id
        ? { ...x, item: { ...x.item, reviewedBy: null, reviewedAt: null, reviewedAgainst: null } } : x));
    } else {
      const updated = await markReviewed(s.item.id, "");
      setSelected((sel) => sel.map((x) => x.item.id === s.item.id
        ? { ...x, item: { ...x.item, reviewedBy: updated.reviewed_by, reviewedAt: updated.reviewed_at, reviewedAgainst: updated.reviewed_against } } : x));
    }
  };

  const downloadExcel = () => {
    const rows = selected.map((s, i) => ({
      "Ítem": i + 1,
      "Código": s.item.code,
      "Origen": s.plantName,
      "Familia": FAMILIES[s.item.fam] || s.item.fam,
      "Servicio": s.item.services.join(" / "),
      "Material": s.item.mat,
      "Corrosión": s.item.corr,
      "Rating": s.item.rating,
      "Diseño": s.item.design,
      "Revisado": s.item.reviewedBy ? "Sí" : "No",
      "Revisado por": s.item.reviewedBy || "",
      "Fecha revisión": s.item.reviewedAt ? new Date(s.item.reviewedAt).toLocaleDateString("es-AR") : "",
      "Contra norma": s.item.reviewedAgainst || "",
    }));
    const wb = XLSX.utils.book_new();
    const metaWs = XLSX.utils.aoa_to_sheet([
      ["Título", docMeta.title], ["Proyecto", docMeta.project], ["Cliente", docMeta.client],
      ["N° de documento", docMeta.docNumber], ["Revisión", docMeta.revision],
      ["Empresa", docMeta.company], ["Fecha", docMeta.date],
    ]);
    XLSX.utils.book_append_sheet(wb, metaWs, "Portada");
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Clases");
    const fileName = (docMeta.docNumber || docMeta.title || "spec").replace(/[\\/:*?"<>|]/g, "-");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const copyShareLink = (specId) => {
    const url = `${window.location.origin}${window.location.pathname}?spec=${specId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(specId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSpec(docMeta, selected);
      setSavedMsg("Especificación guardada.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      setSavedMsg("No se pudo guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const openSavedList = async () => {
    setShowSaved(true);
    if (savedSpecs === null) {
      try { setSavedSpecs(await fetchSpecs()); } catch { setSavedSpecs([]); }
    }
  };

  const loadSpec = async (spec) => {
    const rows = await fetchSpecItems(spec.id);
    setDocMeta({
      title: spec.title, project: spec.project, client: spec.client || "",
      docNumber: spec.doc_number, revision: spec.revision, company: spec.company,
      confidential: spec.confidential, serviceCoding: spec.service_coding, date: spec.date,
    });
    setSelected(rows.map((r) => {
      if (r.plantName) return r; // ya viene completo desde la foto congelada
      const plant = plants.find((p) => p.classes.some((k) => k.id === r.item.id));
      return { plantId: plant?.id || "—", plantName: plant?.name || "—", item: r.item };
    }));
    setShowSaved(false);
  };

  const removeSaved = async (id) => {
    await deleteSpec(id);
    setSavedSpecs((s) => s.filter((x) => x.id !== id));
  };

  if (mode === "print") {
    return (
      <div className="bg-white">
        <div className="print:hidden sticky top-0 z-10 bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setMode("build")} className="flex items-center gap-1.5 text-[13px] hover:text-slate-300">
            <ArrowLeft size={15} /> Volver a editar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[13px] bg-[#2C568E] hover:bg-[#1F3F6E] px-3 py-1.5 rounded-md font-medium">
            <Printer size={15} /> Imprimir / Guardar como PDF
          </button>
        </div>
        <div className="max-w-[850px] mx-auto py-6 print:py-0 print:max-w-none">
          <PrintCoverPage docMeta={docMeta} items={selected} />
          {selected.map((s, i) => (
            <PrintClassPage key={s.item.id} item={s.item} plantName={s.plantName} docMeta={docMeta} index={i} total={selected.length} />
          ))}
          {docMeta.serviceCoding && <ServiceIndexPage items={selected} catalog={serviceCatalog} codes={serviceCodes} />}
        </div>
        <style>{`
          @media print {
            @page { size: letter; margin: 14mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .print-page { page-break-after: always; padding: 4mm; }
          .print-page:last-child { page-break-after: auto; }
          .print-page table { page-break-inside: auto; }
          .print-page tr { page-break-inside: avoid; }
        `}</style>
      </div>
    );
  }

  if (!ready) return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm gap-2"><Loader2 size={16} className="animate-spin" /> Cargando…</div>;

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <FileStack size={18} className="text-[#2C568E]" />
              <h2 className="text-[16px] font-semibold text-slate-900">Armar especificación</h2>
            </div>
            <button onClick={openSavedList} className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-[#1F3F6E]">
              <FolderOpen size={14} /> Specs guardadas
            </button>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">
            Elegí clases de cualquiera de los proyectos cargados para armar un documento nuevo. Se puede combinar EPF y La Calera en la misma spec.
          </p>
          <div className="relative mb-5">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar clase, servicio o material…"
              className="w-full pl-8 pr-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:border-[#2C568E] focus:outline-none bg-white" />
          </div>
          {plants.map((p) => (
            <PlantColumn key={p.id} plant={p} selectedIds={selectedIds} onToggle={toggle} onToggleGroup={toggleGroup} q={q} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[12px] font-semibold text-slate-700 mb-3">Datos del documento</div>
            <div className="space-y-2">
              {[
                ["title", "Título"], ["project", "Proyecto"], ["client", "Cliente destinatario"],
                ["docNumber", "N° de documento"], ["revision", "Revisión"], ["company", "Empresa"], ["date", "Fecha"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400">{label}</label>
                  <input value={docMeta[key]} onChange={(e) => setDocMeta({ ...docMeta, [key]: e.target.value })}
                    className="w-full text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#2C568E] focus:outline-none" />
                  {key === "docNumber" && (
                    <div className="text-[10.5px] text-slate-400 mt-1 leading-snug">Si este N° de documento ya existe entre las specs guardadas, "Guardar" agrega una revisión nueva — no pisa la anterior.</div>
                  )}
                </div>
              ))}
              <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none pt-1">
                <input type="checkbox" checked={docMeta.confidential} onChange={(e) => setDocMeta({ ...docMeta, confidential: e.target.checked })} className="accent-[#2C568E]" />
                Marca de "Confidencial — uso interno" en el PDF
              </label>
              <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={docMeta.serviceCoding} onChange={(e) => setDocMeta({ ...docMeta, serviceCoding: e.target.checked })} className="accent-[#2C568E]" />
                Agregar índice de servicios codificado al final del PDF
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-slate-700">Borrador ({selected.length})</span>
              <span className="text-[10.5px] text-slate-400 flex items-center gap-1"><ShieldAlert size={11} /> tocá el ícono para marcar revisada</span>
            </div>
            {selected.length === 0 ? (
              <div className="text-[12px] text-slate-400">Todavía no elegiste ninguna clase.</div>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {selected.map((s) => (
                  <div key={s.item.id} className="rounded-md bg-slate-50">
                    <div className="flex items-center justify-between gap-2 text-[12px] px-2 py-1.5">
                      <span className="min-w-0 truncate"><span className="font-mono font-semibold">{s.item.code}</span> <span className="text-slate-400">· {s.plantName.split(" · ")[0]}</span></span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {s.item.detail && (
                          <button
                            onClick={() => setEditingNotesFor(editingNotesFor === s.item.id ? null : s.item.id)}
                            title="Editar notas para este documento"
                            className={editingNotesFor === s.item.id ? "text-[#2C568E]" : "text-slate-300 hover:text-[#2C568E]"}
                          >
                            <StickyNote size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => toggleReviewed(s)}
                          title={s.item.reviewedBy ? `Revisado por ${s.item.reviewedBy}` : "Marcar como revisado"}
                          className={s.item.reviewedBy ? "text-emerald-600 hover:text-emerald-700" : "text-slate-300 hover:text-amber-500"}
                        >
                          {s.item.reviewedBy ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        </button>
                        <button onClick={() => remove(s.item.id)} className="text-slate-300 hover:text-red-500"><X size={13} /></button>
                      </div>
                    </div>
                    {editingNotesFor === s.item.id && s.item.detail && (
                      <div className="px-2 pb-2.5 space-y-1.5 border-t border-slate-200 pt-2">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Notas para este documento (no afecta la clase original)</div>
                        {s.item.detail.notes.map((n, i) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <span className="text-[10px] font-mono text-slate-400 mt-1.5 shrink-0">{i + 1}.</span>
                            <textarea
                              value={n} rows={2}
                              onChange={(e) => {
                                const notes = s.item.detail.notes.slice();
                                notes[i] = e.target.value;
                                setNotesFor(s.item.id, notes);
                              }}
                              className="flex-1 text-[11.5px] px-1.5 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none bg-white"
                            />
                            <button
                              onClick={() => setNotesFor(s.item.id, s.item.detail.notes.filter((_, k) => k !== i))}
                              className="text-slate-300 hover:text-red-500 mt-1.5 shrink-0"
                            ><X size={12} /></button>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-0.5">
                          <button onClick={() => setNotesFor(s.item.id, [...s.item.detail.notes, ""])} className="text-[11px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={11} /> Agregar nota</button>
                          <button onClick={() => restoreNotes(s.item.id)} className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"><RotateCcw size={11} /> Restaurar originales</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                disabled={selected.length === 0 || saving}
                onClick={handleSave}
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE] disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
              </button>
              <button
                disabled={selected.length === 0}
                onClick={() => setMode("print")}
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E] disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Printer size={14} /> Ver documento
              </button>
              <button
                disabled={selected.length === 0}
                onClick={downloadExcel}
                className="col-span-2 flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE] disabled:opacity-50"
              >
                <FileSpreadsheet size={14} /> Descargar Excel
              </button>
            </div>
            {savedMsg && <div className="text-[12px] text-emerald-700 mt-2">{savedMsg}</div>}
          </div>
        </div>
      </div>

      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setShowSaved(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-slate-800">Especificaciones guardadas</span>
              <button onClick={() => setShowSaved(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-3 space-y-3">
              {savedSpecs === null ? (
                <div className="text-[13px] text-slate-400 flex items-center gap-2 px-2 py-3"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
              ) : savedSpecs.length === 0 ? (
                <div className="text-[13px] text-slate-400 px-2 py-3">Todavía no guardaste ninguna especificación.</div>
              ) : (
                groupedSpecs.map((group) => (
                  <div key={group.key} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200">
                      <div className="text-[13px] font-semibold text-slate-800 truncate">{group.items[0].project || "sin proyecto"}</div>
                      <div className="text-[11px] text-slate-400 truncate">{group.items[0].title}{group.items[0].doc_number ? ` · ${group.items[0].doc_number}` : ""} · {group.items.length} {group.items.length === 1 ? "revisión" : "revisiones"}</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {group.items.map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 px-2.5 py-2 hover:bg-slate-50">
                          <button onClick={() => loadSpec(s)} className="text-left min-w-0 flex-1">
                            <div className="text-[12.5px] text-slate-700">
                              <span className="font-mono font-medium">Rev. {s.revision}</span>
                              {i === 0 && <span className="ml-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">más reciente</span>}
                            </div>
                            <div className="text-[11px] text-slate-400">{s.client ? `Para ${s.client} · ` : ""}{new Date(s.created_at).toLocaleDateString("es-AR")} · {s.created_by}</div>
                          </button>
                          <button onClick={() => copyShareLink(s.id)} title="Copiar link para compartir (solo lectura)" className="text-slate-300 hover:text-[#2C568E] shrink-0">
                            {copiedId === s.id ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
                          </button>
                          <button onClick={() => removeSaved(s.id)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
