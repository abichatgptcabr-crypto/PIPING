import React, { useState, useMemo, useEffect } from "react";
import {
  FileStack, Search, X, Printer, ArrowLeft, Building2, ShieldCheck, ShieldAlert,
  CheckSquare, Square, MinusSquare, FileWarning, Loader2, Save, FolderOpen, Trash2,
  FileSpreadsheet, Link2, Check, StickyNote, RotateCcw, Plus, LayoutTemplate,
  Copy, ImagePlus, Pencil, Repeat, Users, Gauge, Table2, CircleDot,
} from "lucide-react";
import { FAMILIES, COMP_COLS, VALVE_COLS } from "../data/plants";
import {
  fetchAllPlants, saveSpec, fetchSpecs, fetchSpecItems, fetchSpecById, deleteSpec,
  fetchServiceCatalog, computeServiceCodes, markReviewed, clearReviewed,
  saveTemplate, fetchTemplates, fetchTemplateItems, deleteTemplate, uploadClientLogo,
  fetchRevisionHistory, saveClientProfile, fetchClientProfiles, deleteClientProfile,
} from "../lib/api";
import { EditTable, DesignEdit } from "./Generador";
import { useToast, Toast } from "../components/Toast";
import * as XLSX from "xlsx";
import QRCode from "qrcode";

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
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#00589E] bg-[#EAF3FB] hover:bg-[#d8e9f7] px-2.5 py-1 rounded mb-1.5"
                >
                  {allIn ? <CheckSquare size={12} className="text-[#00589E]" /> : someIn ? <MinusSquare size={12} className="text-[#00589E]" /> : <Square size={12} className="text-[#00589E]/40" />}
                  {FAMILIES[fam] || fam} <span className="text-[#00589E]/60 normal-case">({list.length})</span>
                </button>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {list.map((k) => {
                    const checked = selectedIds.has(k.id);
                    return (
                      <button
                        key={k.id}
                        onClick={() => onToggle(plant, k)}
                        className={`flex items-start gap-2 text-left px-2.5 py-2 rounded-md border text-[12.5px] transition ${
                          checked ? "border-[#00589E] bg-[#EAF3FB]" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {checked ? <CheckSquare size={14} className="text-[#00589E] mt-0.5 shrink-0" /> : <Square size={14} className="text-slate-300 mt-0.5 shrink-0" />}
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
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="flex items-stretch border-b-4 border-black mb-3">
          <div className="flex-1 pb-2">
            <div className="text-[16px] font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-doc)" }}>{docMeta.title || "Piping Class"}</div>
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

export function PrintCoverPage({ docMeta, items, qrDataUrl, revisionHistory }) {
  return (
    <section className="print-page relative">
      <div className="border-2 border-black h-full flex flex-col relative" style={{ zIndex: 1 }}>
        <div className="border-b-2 border-black p-6 text-center">
          {docMeta.clientLogoUrl ? (
            <img src={docMeta.clientLogoUrl} alt={docMeta.client || "Cliente"} className="h-14 mx-auto mb-3 object-contain" />
          ) : (
            <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">{docMeta.company || "Hytech"}</div>
          )}
          <div className="text-[30px] font-bold uppercase mb-1 tracking-wide" style={{ fontFamily: "var(--font-doc)" }}>{docMeta.title || "Piping Class"}</div>
          <div className="text-[13px] text-slate-600">Technical Specification</div>
          {docMeta.client && <div className="text-[12px] text-slate-500 mt-1">Preparado para: <b>{docMeta.client}</b></div>}
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

        {revisionHistory && revisionHistory.length > 0 && (
          <div className="px-6 pb-4">
            <div className="text-[10px] font-bold uppercase border-b border-black pb-1 mb-1.5">Historial de revisiones</div>
            <table className="w-full text-[9px] font-mono">
              <thead><tr className="border-b border-black">
                <th className="text-left py-0.5 w-10">Rev.</th><th className="text-left py-0.5 w-20">Fecha</th>
                <th className="text-left py-0.5">Descripción</th>
                <th className="text-left py-0.5 w-28">Preparado</th><th className="text-left py-0.5 w-28">Aprobado</th>
              </tr></thead>
              <tbody>
                {revisionHistory.map((r, i) => (
                  <tr key={i} className="border-b border-slate-300">
                    <td className="py-0.5 font-bold">{r.revision}</td>
                    <td className="py-0.5">{r.date || "—"}</td>
                    <td className="py-0.5">{r.change_note || "—"}</td>
                    <td className="py-0.5">{r.prepared_by || "—"}</td>
                    <td className="py-0.5">{r.approved_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-3 border-t-2 border-black text-[9px]">
          {[["PREPARADO POR", docMeta.preparedBy, docMeta.preparedDate],
            ["REVISADO POR", docMeta.checkedBy, docMeta.checkedDate],
            ["APROBADO POR", docMeta.approvedBy, docMeta.approvedDate]].map(([label, name, date], i) => (
            <div key={label} className={`p-3 ${i < 2 ? "border-r border-black" : ""}`}>
              <div className="uppercase tracking-wider text-slate-500 mb-3">{label}</div>
              <div className="border-b border-slate-400 pb-1 mb-1 min-h-[14px] font-medium">{name || ""}</div>
              <div className="text-slate-400">{date ? `Fecha: ${date}` : "Nombre y fecha"}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-3 text-[9px] text-slate-400 border-t border-black">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Código QR de verificación" className="w-14 h-14 shrink-0" />
          ) : (
            <div className="w-14 h-14 shrink-0 border border-dashed border-slate-300 flex items-center justify-center text-center text-[7px] text-slate-300 leading-tight px-1">
              QR al guardar
            </div>
          )}
          {qrDataUrl && <div>Escaneá el código para ver la versión online de este documento.</div>}
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
        <div className="text-[16px] font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-doc)" }}>Índice de servicios</div>
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
const EDIT_TABS = [
  { id: "cond", label: "Condiciones", icon: Gauge },
  { id: "comp", label: "Componentes", icon: Table2 },
  { id: "valv", label: "Válvulas", icon: CircleDot },
  { id: "notes", label: "Notas", icon: StickyNote },
];

// Edición completa de una clase, pero SÓLO para este documento — nunca
// toca la clase original del registro. onChange reemplaza el item entero
// en el estado local del borrador.
function EditForDocPanel({ item, onChange, onClose, onRestore }) {
  const [tab, setTab] = useState("cond");
  const d = item.detail;
  if (!d) return null;
  const setD = (patch) => onChange({ ...item, detail: { ...d, ...patch } });
  const setField = (key, val) => onChange({ ...item, [key]: val });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-white shadow-lg border border-slate-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="font-mono text-[18px] font-bold text-slate-900">{item.code}</div>
            <div className="text-[12px] text-slate-500">Editando sólo para este documento — la clase original del registro no cambia</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRestore} className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:border-[#00589E]"><RotateCcw size={12} /> Restaurar original</button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
          </div>
        </div>
        <div className="px-5 pt-3 grid grid-cols-3 gap-2 pb-3 border-b border-slate-200">
          <input value={item.mat} onChange={(e) => setField("mat", e.target.value)} placeholder="Material" className="text-[12.5px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
          <input value={item.corr} onChange={(e) => setField("corr", e.target.value)} placeholder="Corrosión" className="text-[12.5px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
          <input value={item.rating} onChange={(e) => setField("rating", e.target.value)} placeholder="Rating" className="text-[12.5px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
        </div>
        <div className="px-5 pt-3 flex gap-1 border-b border-slate-200 overflow-x-auto">
          {EDIT_TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-[13px] whitespace-nowrap border-b-2 ${active ? "border-[#00589E] text-slate-900 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "cond" && <DesignEdit T={d.designT} P={d.designP} rating={item.rating} onChange={(T, P) => setD({ designT: T, designP: P })} />}
          {tab === "comp" && <EditTable cols={COMP_COLS} rows={d.comps} onChange={(rows) => setD({ comps: rows })} />}
          {tab === "valv" && <EditTable cols={VALVE_COLS} rows={d.valves} onChange={(rows) => setD({ valves: rows })} />}
          {tab === "notes" && (
            <div className="space-y-2">
              {d.notes.map((n, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="font-mono text-[12px] text-slate-400 mt-2">{i + 1}.</span>
                  <textarea value={n} onChange={(e) => { const notes = d.notes.slice(); notes[i] = e.target.value; setD({ notes }); }} rows={2} className="flex-1 text-[13px] px-2 py-1.5 border border-slate-200 rounded focus:border-[#00589E] focus:outline-none" />
                  <button onClick={() => setD({ notes: d.notes.filter((_, k) => k !== i) })} className="text-slate-300 hover:text-red-500 mt-2"><X size={14} /></button>
                </div>
              ))}
              <button onClick={() => setD({ notes: [...d.notes, ""] })} className="text-[12px] text-[#00406E] hover:text-[#113044] flex items-center gap-1"><Plus size={13} /> Agregar nota</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini selector cross-planta para "Cambiar por..." — reemplaza una clase
// del borrador por otra, en el mismo lugar de la lista.
function ReplacePicker({ plants, onPick, onCancel }) {
  const [plantId, setPlantId] = useState(plants[0]?.id || "");
  const [code, setCode] = useState("");
  const plant = plants.find((p) => p.id === plantId);
  const selStyle = "flex-1 text-[12px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none bg-white";
  return (
    <div className="flex gap-1.5 items-center px-2 pb-2">
      <select value={plantId} onChange={(e) => { setPlantId(e.target.value); setCode(""); }} className={selStyle}>
        {plants.map((p) => <option key={p.id} value={p.id}>{p.name.split(" · ")[0]}</option>)}
      </select>
      <select value={code} onChange={(e) => setCode(e.target.value)} className={selStyle}>
        <option value="">Elegí clase…</option>
        {plant?.classes.map((k) => <option key={k.id} value={k.code}>{k.code}</option>)}
      </select>
      <button
        disabled={!code}
        onClick={() => onPick(plant, plant.classes.find((k) => k.code === code))}
        className="text-[12px] px-2 py-1.5 rounded-md bg-[#00589E] text-white disabled:opacity-40"
      ><Check size={13} /></button>
      <button onClick={onCancel} className="text-slate-400 hover:text-red-500 px-1"><X size={14} /></button>
    </div>
  );
}

// Insignia numerada de paso — con conector opcional hacia abajo, para que
// la página se lea como un instructivo corto en vez de una lista de campos.
function StepBadge({ n, title, desc, connector }) {
  return (
    <div className="flex items-start gap-3 mb-3 relative">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-7 h-7 rounded-full bg-[#00589E] text-white flex items-center justify-center font-display font-bold text-[13px] shadow-md shadow-[#00589E]/30">
          {n}
        </div>
        {connector && <div className="w-[2px] flex-1 bg-[#00589E]/20 mt-1" style={{ minHeight: 24 }} />}
      </div>
      <div className="pt-0.5">
        <div className="text-[13px] font-bold text-[#113044] uppercase tracking-wide">{title}</div>
        {desc && <div className="text-[12px] text-slate-500 mt-0.5">{desc}</div>}
      </div>
    </div>
  );
}

export default function SpecBuilder() {
  const [plants, setPlants] = useState([]);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]); // [{ plantId, plantName, item }]
  const [mode, setMode] = useState("build"); // 'build' | 'print'
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const [showSaved, setShowSaved] = useState(false);
  const [savedSpecs, setSavedSpecs] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [docMeta, setDocMeta] = useState({
    title: "Piping Class", project: "", client: "", docNumber: "", revision: "0",
    company: "Hytech", confidential: true, serviceCoding: true, date: new Date().toLocaleDateString("es-AR"),
    preparedBy: "", preparedDate: "", checkedBy: "", checkedDate: "", approvedBy: "", approvedDate: "",
    clientLogoUrl: "", changeNote: "",
  });
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [currentSpecId, setCurrentSpecId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingFullFor, setEditingFullFor] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const [bulkNote, setBulkNote] = useState("");
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [clientProfiles, setClientProfiles] = useState(null);
  const [showClientProfiles, setShowClientProfiles] = useState(false);
  const [savingClientProfile, setSavingClientProfile] = useState(false);

  useEffect(() => {
    fetchAllPlants().then((data) => { setPlants(data); setReady(true); }).catch(() => setReady(true));
    fetchServiceCatalog().then(setServiceCatalog).catch(() => setServiceCatalog([]));
  }, []);
  const serviceCodes = useMemo(() => computeServiceCodes(serviceCatalog), [serviceCatalog]);

  // Historial de revisiones del documento (mismo N°) — para la tabla de
  // control de cambios en la portada.
  useEffect(() => {
    fetchRevisionHistory(docMeta.docNumber).then(setRevisionHistory).catch(() => setRevisionHistory([]));
  }, [docMeta.docNumber]);

  // Código QR de verificación — sólo existe una vez que la spec está
  // guardada (necesita un id real para armar el link).
  useEffect(() => {
    if (!currentSpecId) { setQrDataUrl(""); return; }
    const url = `${window.location.origin}${window.location.pathname}?spec=${currentSpecId}`;
    QRCode.toDataURL(url, { margin: 1, width: 160 }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [currentSpecId]);

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

  // Edición completa por documento — reemplaza el item local del borrador,
  // nunca toca la clase original del registro.
  const updateSelectedItem = (itemId, newItem) =>
    setSelected((sel) => sel.map((s) => (s.item.id === itemId ? { ...s, item: newItem } : s)));
  const restoreItem = (itemId) => {
    const master = plants.flatMap((p) => p.classes).find((k) => k.id === itemId);
    if (master) updateSelectedItem(itemId, { ...master });
  };

  // "Cambiar por..." — reemplaza una clase del borrador por otra, en el
  // mismo lugar de la lista.
  const replaceItem = (oldId, plant, newClass) => {
    setSelected((sel) => sel.map((s) => (s.item.id === oldId ? { plantId: plant.id, plantName: plant.name, item: newClass } : s)));
    setReplacingId(null);
  };

  // Nota en bloque: agrega la misma nota a todas las clases del borrador
  // que tengan detalle cargado — para requisitos que aplican al documento
  // entero, sin entrar clase por clase.
  const applyBulkNote = () => {
    if (!bulkNote.trim()) return;
    setSelected((sel) => sel.map((s) => (s.item.detail
      ? { ...s, item: { ...s.item, detail: { ...s.item.detail, notes: [...s.item.detail.notes, bulkNote.trim()] } } }
      : s)));
    setBulkNote("");
  };

  /* ═══════════════════════ Perfiles de cliente ═══════════════════════════ */
  const openClientProfiles = async () => {
    setShowClientProfiles(true);
    if (clientProfiles === null) {
      try { setClientProfiles(await fetchClientProfiles()); } catch { setClientProfiles([]); }
    }
  };
  const useClientProfile = (p) => {
    setDocMeta((d) => ({ ...d, client: p.name, clientLogoUrl: p.logo_url || "" }));
    setShowClientProfiles(false);
  };
  const removeClientProfile = async (id) => {
    await deleteClientProfile(id);
    setClientProfiles((c) => c.filter((x) => x.id !== id));
  };
  const confirmSaveClientProfile = async () => {
    if (!docMeta.client.trim()) return;
    setSavingClientProfile(true);
    try {
      await saveClientProfile(docMeta.client.trim(), docMeta.clientLogoUrl);
      setClientProfiles(null);
      showToast("Perfil de cliente guardado.");
    } catch (e) {
      showToast("No se pudo guardar el perfil: " + e.message, "error");
    } finally {
      setSavingClientProfile(false);
    }
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
      const spec = await saveSpec(docMeta, selected);
      setCurrentSpecId(spec.id);
      fetchRevisionHistory(docMeta.docNumber).then(setRevisionHistory).catch(() => {});
      showToast("Especificación guardada.");
    } catch (e) {
      showToast("No se pudo guardar: " + e.message, "error");
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

  const applyRows = (rows) => setSelected(rows.map((r) => {
    if (r.plantName) return r; // ya viene completo desde la foto congelada
    const plant = plants.find((p) => p.classes.some((k) => k.id === r.item.id));
    return { plantId: plant?.id || "—", plantName: plant?.name || "—", item: r.item };
  }));

  // Cargar una revisión: se sigue editando la MISMA spec (guardar de nuevo
  // agrega otra revisión con el mismo N° de documento).
  const loadSpec = async (spec) => {
    const rows = await fetchSpecItems(spec.id);
    setDocMeta({
      title: spec.title, project: spec.project, client: spec.client || "",
      docNumber: spec.doc_number, revision: spec.revision, company: spec.company,
      confidential: spec.confidential, serviceCoding: spec.service_coding, date: spec.date,
      preparedBy: spec.prepared_by || "", preparedDate: spec.prepared_date || "",
      checkedBy: spec.checked_by || "", checkedDate: spec.checked_date || "",
      approvedBy: spec.approved_by || "", approvedDate: spec.approved_date || "",
      clientLogoUrl: spec.client_logo_url || "", changeNote: "",
    });
    applyRows(rows);
    setCurrentSpecId(spec.id);
    setShowSaved(false);
  };

  // "Usar como base para documento nuevo": mismo contenido, pero limpia el
  // N° de documento y la revisión — al guardar, nace un documento nuevo,
  // no una revisión más del que se copió.
  const duplicateAsNew = async (spec) => {
    const rows = await fetchSpecItems(spec.id);
    setDocMeta((d) => ({
      ...d, title: spec.title, project: spec.project, client: spec.client || "",
      docNumber: "", revision: "0", company: spec.company,
      confidential: spec.confidential, serviceCoding: spec.service_coding,
      date: new Date().toLocaleDateString("es-AR"),
      preparedBy: "", preparedDate: "", checkedBy: "", checkedDate: "", approvedBy: "", approvedDate: "",
      clientLogoUrl: spec.client_logo_url || "", changeNote: "",
    }));
    applyRows(rows);
    setCurrentSpecId(null);
    setShowSaved(false);
    showToast("Copiado como base — completá el N° de documento y guardá para crear el nuevo.");
  };

  const removeSaved = async (id) => {
    await deleteSpec(id);
    setSavedSpecs((s) => s.filter((x) => x.id !== id));
  };

  /* ═══════════════════════ Plantillas de selección ═══════════════════════ */
  const openTemplates = async () => {
    setShowTemplates(true);
    if (templates === null) {
      try { setTemplates(await fetchTemplates()); } catch { setTemplates([]); }
    }
  };
  const useTemplate = async (tpl) => {
    const rows = await fetchTemplateItems(tpl.id);
    setSelected(rows.map((c) => {
      const plant = plants.find((p) => p.classes.some((k) => k.id === c.id));
      return { plantId: plant?.id || "—", plantName: plant?.name || "—", item: c };
    }));
    setShowTemplates(false);
  };
  const removeTemplate = async (id) => {
    await deleteTemplate(id);
    setTemplates((t) => t.filter((x) => x.id !== id));
  };
  const confirmSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await saveTemplate(templateName.trim(), "", selected);
      setShowTemplateForm(false);
      setTemplateName("");
      setTemplates(null); // fuerza recarga la próxima vez que se abra la lista
      showToast("Plantilla guardada.");
    } catch (e) {
      showToast("No se pudo guardar la plantilla: " + e.message, "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  /* ═══════════════════════ Logo del cliente ═══════════════════════════════ */
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadClientLogo(file);
      setDocMeta((d) => ({ ...d, clientLogoUrl: url }));
    } catch (err) {
      showToast("No se pudo subir el logo: " + err.message, "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };


  if (mode === "print") {
    return (
      <div className="bg-white">
        <div className="print:hidden sticky top-0 z-10 bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setMode("build")} className="flex items-center gap-1.5 text-[13px] hover:text-slate-300">
            <ArrowLeft size={15} /> Volver a editar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[13px] bg-[#00589E] hover:bg-[#00406E] px-3 py-1.5 rounded-md font-medium">
            <Printer size={15} /> Imprimir / Guardar como PDF
          </button>
        </div>
        <div className="max-w-[850px] mx-auto py-6 print:py-0 print:max-w-none">
          <PrintCoverPage docMeta={docMeta} items={selected} qrDataUrl={qrDataUrl} revisionHistory={revisionHistory} />
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

  if (!ready) return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 animate-pulse">
      <div className="space-y-5">
        <div className="h-6 w-56 bg-slate-200 rounded" />
        <div className="h-9 w-full bg-slate-200 rounded-md" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-3">
              <div className="h-14 bg-slate-200 rounded-md" />
              <div className="h-14 bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-64 bg-slate-200 rounded-md" />
        <div className="h-40 bg-slate-200 rounded-md" />
      </div>
    </div>
  );

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <FileStack size={20} className="text-[#00589E]" />
              <div>
                <h2 className="font-display text-[22px] font-bold uppercase tracking-wide text-[#113044] leading-none">Armar especificación</h2>
                <div className="h-[3px] w-10 bg-[#00589E] mt-2" />
              </div>
            </div>
            <button onClick={openSavedList} className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-[#00406E]">
              <FolderOpen size={14} /> Specs guardadas
            </button>
          </div>
          <p className="text-[13px] text-slate-500 mb-5">
            Elegí clases de cualquiera de los proyectos cargados para armar un documento nuevo. Se puede combinar EPF y La Calera en la misma spec.
          </p>

          <div className="rounded-md border border-slate-200 bg-white shadow-sm p-4 mb-5">
            <StepBadge n={1} title="Paso 1 · Elegí las clases" desc="Buscá por código, servicio o material, y tildá una por una o un grupo entero de una vez." />
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar clase, servicio o material…"
                className="w-full pl-8 pr-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none bg-white" />
            </div>
          </div>
          {plants.map((p) => (
            <PlantColumn key={p.id} plant={p} selectedIds={selectedIds} onToggle={toggle} onToggleGroup={toggleGroup} q={q} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white shadow-sm p-4">
            <StepBadge n={2} title="Paso 2 · Completá los datos del documento" desc="Título, cliente y N° de documento — es lo que va a aparecer en la portada del PDF." connector />
            <div className="space-y-2">
              {[
                ["title", "Título"], ["project", "Proyecto"],
                ["docNumber", "N° de documento"], ["revision", "Revisión"], ["company", "Empresa"], ["date", "Fecha"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400">{label}</label>
                  <input value={docMeta[key]} onChange={(e) => setDocMeta({ ...docMeta, [key]: e.target.value })}
                    className="w-full text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                  {key === "docNumber" && (
                    <div className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                      Si este N° de documento ya existe entre las specs guardadas, "Guardar" agrega una revisión nueva — no pisa la anterior.
                      {revisionHistory.length > 0 && <span> Ya tiene {revisionHistory.length} {revisionHistory.length === 1 ? "revisión guardada" : "revisiones guardadas"}.</span>}
                    </div>
                  )}
                </div>
              ))}
              {revisionHistory.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400">Motivo de esta revisión</label>
                  <input value={docMeta.changeNote} onChange={(e) => setDocMeta({ ...docMeta, changeNote: e.target.value })} placeholder="Ej: se agrega clase de agua contra incendio"
                    className="w-full text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400">Cliente destinatario</label>
                  <button onClick={openClientProfiles} className="text-[10.5px] text-[#00589E] hover:text-[#00406E] flex items-center gap-1"><Users size={11} /> Perfiles</button>
                </div>
                <div className="flex gap-1.5">
                  <input value={docMeta.client} onChange={(e) => setDocMeta({ ...docMeta, client: e.target.value })}
                    className="flex-1 text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                  <button onClick={confirmSaveClientProfile} disabled={!docMeta.client.trim() || savingClientProfile} title="Guardar como perfil de cliente reutilizable"
                    className="text-[12px] px-2 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:border-[#00589E] disabled:opacity-40">
                    {savingClientProfile ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={docMeta.serviceCoding} onChange={(e) => setDocMeta({ ...docMeta, serviceCoding: e.target.checked })} className="accent-[#00589E]" />
                Agregar índice de servicios codificado al final del PDF
              </label>

              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] uppercase tracking-wider text-slate-400">Logo del cliente (portada)</label>
                {docMeta.clientLogoUrl ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={docMeta.clientLogoUrl} alt="Logo cliente" className="h-8 object-contain border border-slate-200 rounded px-1" />
                    <button onClick={() => setDocMeta({ ...docMeta, clientLogoUrl: "" })} className="text-[11px] text-slate-400 hover:text-red-500">Quitar</button>
                  </div>
                ) : (
                  <label className="mt-1 flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md border border-dashed border-slate-300 text-slate-500 hover:border-[#4DA8DC] cursor-pointer w-fit">
                    {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                    {uploadingLogo ? "Subiendo…" : "Subir logo"}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                  </label>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Firmas del documento</div>
                {[
                  ["preparedBy", "preparedDate", "Preparado por"],
                  ["checkedBy", "checkedDate", "Revisado por"],
                  ["approvedBy", "approvedDate", "Aprobado por"],
                ].map(([nameKey, dateKey, label]) => (
                  <div key={nameKey} className="grid grid-cols-[1fr_100px] gap-1.5">
                    <input value={docMeta[nameKey]} onChange={(e) => setDocMeta({ ...docMeta, [nameKey]: e.target.value })}
                      placeholder={label} className="text-[12.5px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                    <input value={docMeta[dateKey]} onChange={(e) => setDocMeta({ ...docMeta, [dateKey]: e.target.value })}
                      placeholder="Fecha" className="text-[12.5px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">Atajo opcional · Plantillas</span>
              <button onClick={openTemplates} className="flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-[#00406E]">
                <LayoutTemplate size={14} /> Usar plantilla
              </button>
            </div>
            {!showTemplateForm ? (
              <button
                disabled={selected.length === 0}
                onClick={() => setShowTemplateForm(true)}
                className="w-full flex items-center justify-center gap-1.5 text-[12.5px] px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:border-[#4DA8DC] disabled:opacity-50"
              >
                <Save size={13} /> Guardar esta selección como plantilla
              </button>
            ) : (
              <div className="flex gap-1.5">
                <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nombre de la plantilla…" autoFocus
                  className="flex-1 text-[12.5px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                <button onClick={confirmSaveTemplate} disabled={savingTemplate || !templateName.trim()} className="px-2.5 py-1.5 rounded-md bg-[#00589E] text-white disabled:opacity-50">
                  {savingTemplate ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                </button>
                <button onClick={() => { setShowTemplateForm(false); setTemplateName(""); }} className="px-2 text-slate-400 hover:text-red-500"><X size={14} /></button>
              </div>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-sm p-4">
            <StepBadge n={3} title="Paso 3 · Revisá y generá" desc="Confirmá qué clases quedaron y descargá el documento — en PDF, en Excel, o guardalo para compartir." />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-slate-700">Borrador ({selected.length})</span>
              <span className="text-[10.5px] text-slate-400 flex items-center gap-1"><ShieldAlert size={11} /> tocá el escudo para marcar revisada</span>
            </div>
            {selected.length > 0 && (
              <div className="flex gap-1.5 mb-3">
                <input value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} placeholder="Nota para todas las clases del documento…"
                  className="flex-1 text-[12px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
                <button onClick={applyBulkNote} disabled={!bulkNote.trim()} className="text-[12px] px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:border-[#00589E] disabled:opacity-40 whitespace-nowrap">Agregar a todas</button>
              </div>
            )}
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
                          <button onClick={() => setEditingFullFor(s.item.id)} title="Editar para este documento" className="text-slate-300 hover:text-[#00589E]">
                            <Pencil size={13} />
                          </button>
                        )}
                        <button onClick={() => setReplacingId(replacingId === s.item.id ? null : s.item.id)} title="Cambiar por otra clase" className={replacingId === s.item.id ? "text-[#00589E]" : "text-slate-300 hover:text-[#00589E]"}>
                          <Repeat size={13} />
                        </button>
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
                    {replacingId === s.item.id && (
                      <ReplacePicker plants={plants} onCancel={() => setReplacingId(null)} onPick={(plant, cls) => replaceItem(s.item.id, plant, cls)} />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                disabled={selected.length === 0 || saving}
                onClick={handleSave}
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:border-[#4DA8DC] disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
              </button>
              <button
                disabled={selected.length === 0}
                onClick={() => setMode("print")}
                className="flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md bg-[#00589E] text-white hover:bg-[#00406E] disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Printer size={14} /> Ver documento
              </button>
              <button
                disabled={selected.length === 0}
                onClick={downloadExcel}
                className="col-span-2 flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:border-[#4DA8DC] disabled:opacity-50"
              >
                <FileSpreadsheet size={14} /> Descargar Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setShowSaved(false)}>
          <div className="bg-white rounded-md shadow-lg border border-slate-200 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                          <button onClick={() => copyShareLink(s.id)} title="Copiar link para compartir (solo lectura)" className="text-slate-300 hover:text-[#00589E] shrink-0">
                            {copiedId === s.id ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
                          </button>
                          <button onClick={() => duplicateAsNew(s)} title="Usar como base para un documento nuevo" className="text-slate-300 hover:text-[#00589E] shrink-0">
                            <Copy size={14} />
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

      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-md shadow-lg border border-slate-200 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-slate-800">Plantillas guardadas</span>
              <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-3 space-y-1.5">
              {templates === null ? (
                <div className="text-[13px] text-slate-400 flex items-center gap-2 px-2 py-3"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
              ) : templates.length === 0 ? (
                <div className="text-[13px] text-slate-400 px-2 py-3">Todavía no guardaste ninguna plantilla. Elegí algunas clases y usá "Guardar esta selección como plantilla".</div>
              ) : (
                templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-slate-50">
                    <button onClick={() => useTemplate(t)} className="text-left min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-slate-800 truncate">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{new Date(t.created_at).toLocaleDateString("es-AR")} · {t.created_by}</div>
                    </button>
                    <button onClick={() => removeTemplate(t.id)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showClientProfiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setShowClientProfiles(false)}>
          <div className="bg-white rounded-md shadow-lg border border-slate-200 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-slate-800">Perfiles de cliente</span>
              <button onClick={() => setShowClientProfiles(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-3 space-y-1.5">
              {clientProfiles === null ? (
                <div className="text-[13px] text-slate-400 flex items-center gap-2 px-2 py-3"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
              ) : clientProfiles.length === 0 ? (
                <div className="text-[13px] text-slate-400 px-2 py-3">Todavía no guardaste ningún perfil. Completá "Cliente destinatario" (y opcionalmente el logo) y tocá el ícono de guardar al lado del campo.</div>
              ) : (
                clientProfiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-slate-50">
                    <button onClick={() => useClientProfile(p)} className="flex items-center gap-2 text-left min-w-0 flex-1">
                      {p.logo_url ? <img src={p.logo_url} alt={p.name} className="h-6 w-auto object-contain" /> : <Users size={16} className="text-slate-300" />}
                      <span className="text-[13px] font-medium text-slate-800 truncate">{p.name}</span>
                    </button>
                    <button onClick={() => removeClientProfile(p.id)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {editingFullFor && (() => {
        const entry = selected.find((s) => s.item.id === editingFullFor);
        return entry ? (
          <EditForDocPanel
            item={entry.item}
            onChange={(newItem) => updateSelectedItem(editingFullFor, newItem)}
            onClose={() => setEditingFullFor(null)}
            onRestore={() => restoreItem(editingFullFor)}
          />
        ) : null;
      })()}
      <Toast toast={toast} />
    </div>
  );
}
