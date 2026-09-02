import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Layers, ChevronDown, ChevronRight, X, Table2, CircleDot, GitBranch, StickyNote,
  Gauge, Search, Info, FileWarning, Plus, Pencil, Copy, Trash2, Building2, RotateCcw,
  CheckSquare, Square, Check, Save, ShieldCheck, ShieldAlert, History, LogOut, Loader2, Filter, FileStack,
} from "lucide-react";
import {
  FAMILIES, COMP_COLS, VALVE_COLS, SEED_PLANTS, ratingLevel, clone, uid,
  seedClasses, seedLaCalera, EPF_CODE_CONVENTION, FREEFORM_CODE_CONVENTION,
} from "../data/plants";
import {
  fetchAllPlants, syncFromSeed, insertClass, updateClassWithRevision, toggleClassIncluded,
  deleteClass, markReviewed, clearReviewed, createPlant, renamePlant as apiRenamePlant,
  deletePlant as apiDeletePlant, fetchRevisions, bulkInsertClasses, resetPlantClasses,
  fetchSpecsForClass,
} from "../lib/api";
import { useAuth } from "../components/AuthGate";

/* ═══════════════════════════════ UI ════════════════════════════════════ */
function Gauge5({ level }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-4" title={`Rating ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-[3px] rounded-sm ${i <= level ? "bg-[#2C568E]" : "bg-slate-200"}`}
          style={{ height: `${5 + i * 2}px` }} />
      ))}
    </span>
  );
}

function SpecTable({ cols, rows }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-[11.5px] font-mono">
        <thead><tr className="bg-slate-100 text-slate-600">
          {cols.map((h) => <th key={h} className="text-left font-semibold px-2.5 py-1.5 whitespace-nowrap border-b border-slate-200">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length} className="px-3 py-4 text-slate-400">Sin filas cargadas.</td></tr>}
          {rows.map((r, i) => {
            const isCont = r[0] === "";
            return (
              <tr key={i} className={i % 2 && !isCont ? "bg-slate-50/60" : "bg-white"}>
                {r.map((cell, j) => (
                  <td key={j} className={`px-2.5 py-1 align-top whitespace-nowrap border-t border-slate-100 ${j === 0 ? "font-semibold text-slate-800" : "text-slate-600"}`}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditTable({ cols, rows, onChange }) {
  const upd = (i, j, val) => { const n = rows.map((r) => r.slice()); n[i][j] = val; onChange(n); };
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="text-[11px] font-mono min-w-full">
          <thead><tr className="bg-slate-100">
            {cols.map((h) => <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>)}
            <th className="border-b border-slate-200 w-8"></th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                {r.map((cell, j) => (
                  <td key={j} className="p-0.5">
                    <input value={cell} onChange={(e) => upd(i, j, e.target.value)}
                      className="w-full min-w-[64px] px-1.5 py-1 text-[11px] rounded border border-transparent hover:border-slate-200 focus:border-[#3F72AC] focus:outline-none bg-transparent" />
                  </td>
                ))}
                <td className="px-1 text-center">
                  <button onClick={() => onChange(rows.filter((_, k) => k !== i))} className="text-slate-300 hover:text-red-500"><X size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => onChange([...rows, cols.map(() => "")])}
        className="text-[12px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={13} /> Agregar fila</button>
    </div>
  );
}

function BranchMatrix({ data }) {
  if (!data || !data.sizes || data.sizes.length === 0)
    return <div className="text-[13px] text-slate-400">Sin tabla de ramificaciones cargada.</div>;
  const { sizes, m, legend, note } = data;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200 rounded-lg inline-block max-w-full">
        <table className="text-[11px] font-mono border-collapse">
          <thead><tr>
            <th className="bg-[#1D3A63] text-slate-100 px-2 py-1.5 text-[10px]">RAMA \ RUN</th>
            {sizes.map((s) => <th key={s} className="bg-slate-100 text-slate-600 px-2 py-1.5 font-semibold border-l border-slate-200">{s}</th>)}
          </tr></thead>
          <tbody>
            {sizes.map((br) => (
              <tr key={br}>
                <td className="bg-slate-50 text-slate-700 font-semibold px-2 py-1 border-t border-slate-200">{br}</td>
                {sizes.map((run) => {
                  const val = m[br] && m[br][run];
                  return <td key={run} className={`text-center px-2 py-1 border-t border-l border-slate-100 ${val ? "text-slate-800 font-semibold" : "text-slate-200"}`}>{val || "·"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Referencias</div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {legend.map((l, i) => (
            <div key={i} className="flex gap-2 text-[12px] text-slate-600"><span className="font-mono font-semibold text-slate-800 w-4">{i + 1}</span><span>{l}</span></div>
          ))}
        </div>
        {note && <div className="mt-3 text-[11px] text-slate-400 italic">{note}</div>}
      </div>
    </div>
  );
}

const TABS = [
  { id: "cond", label: "Condiciones", icon: Gauge }, { id: "comp", label: "Componentes", icon: Table2 },
  { id: "valv", label: "Válvulas", icon: CircleDot }, { id: "branch", label: "Ramificaciones", icon: GitBranch },
  { id: "notes", label: "Notas", icon: StickyNote }, { id: "hist", label: "Historial", icon: History },
  { id: "specs", label: "Specs", icon: FileStack },
];
const emptyDetail = () => ({ designT: [""], designP: [""], comps: [], valves: [], branch: { legend: [], sizes: [], m: {}, note: "" }, notes: [] });

function RevisionHistory({ classId }) {
  const [revs, setRevs] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchRevisions(classId).then((r) => { if (alive) setRevs(r); }).catch(() => setRevs([]));
    return () => { alive = false; };
  }, [classId]);
  if (revs === null) return <div className="text-[13px] text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando historial…</div>;
  if (revs.length === 0) return <div className="text-[13px] text-slate-400">Todavía no hay ediciones guardadas para esta clase.</div>;
  return (
    <div className="space-y-2">
      {revs.map((r) => (
        <div key={r.id} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-slate-800">{r.edited_by}</span>
            <span className="text-slate-400 font-mono">{new Date(r.edited_at).toLocaleString("es-AR")}</span>
          </div>
          {r.note && <div className="text-[12px] text-slate-500 mt-0.5">{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function SpecTraceability({ classId }) {
  const [specs, setSpecs] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchSpecsForClass(classId).then((s) => { if (alive) setSpecs(s); }).catch(() => setSpecs([]));
    return () => { alive = false; };
  }, [classId]);
  if (specs === null) return <div className="text-[13px] text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  if (specs.length === 0) return <div className="text-[13px] text-slate-400">Esta clase todavía no se usó en ninguna especificación guardada (ver "Armar especificación").</div>;
  return (
    <div className="space-y-2">
      {specs.map((s) => (
        <div key={s.id} className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <div className="text-[13px] font-medium text-slate-800">{s.project || "sin proyecto"}{s.doc_number ? ` · ${s.doc_number}` : ""}</div>
          <div className="text-[12px] text-slate-500">{s.title} · Rev. {s.revision}{s.client ? ` · para ${s.client}` : ""}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(s.created_at).toLocaleString("es-AR")} · {s.created_by}</div>
        </div>
      ))}
    </div>
  );
}

function ReviewPanel({ item, onMark, onClear }) {
  const [against, setAgainst] = useState(item.reviewedAgainst || "");
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        {item.reviewedBy ? (
          <div className="text-[13px] text-slate-700">
            <span className="text-emerald-700 font-medium flex items-center gap-1.5"><ShieldCheck size={14} /> Revisado por {item.reviewedBy}</span>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {new Date(item.reviewedAt).toLocaleString("es-AR")}{item.reviewedAgainst ? ` · contra ${item.reviewedAgainst}` : ""}
            </div>
          </div>
        ) : (
          <div className="text-[13px] text-slate-500 flex items-center gap-1.5"><ShieldAlert size={14} className="text-amber-500" /> Todavía no fue marcada como revisada.</div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input value={against} onChange={(e) => setAgainst(e.target.value)} placeholder="ej. ASME B31.3-2024"
          className="text-[12px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#3F72AC] focus:outline-none w-40" />
        <button onClick={() => onMark(against)} className="text-[12px] px-2.5 py-1.5 rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E]">Marcar como revisado</button>
        {item.reviewedBy && <button onClick={onClear} className="text-[12px] px-2.5 py-1.5 rounded-md text-slate-500 hover:bg-slate-100">Quitar</button>}
      </div>
    </div>
  );
}

function DetailPanel({ item, onClose, onSave, onMarkReviewed, onClearReviewed }) {
  const [tab, setTab] = useState("cond");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const idRef = useRef(item.id);

  useEffect(() => { idRef.current = item.id; setEditing(false); setTab("cond"); }, [item]);
  useEffect(() => {
    if (editing) setDraft(clone({ ...item, detail: item.detail || emptyDetail() }));
  }, [editing, item]);

  const view = editing && draft ? draft : item;
  const d = view.detail;
  const lvl = ratingLevel(view.rating);
  const setD = (patch) => setDraft((dr) => ({ ...dr, detail: { ...dr.detail, ...patch } }));
  const save = async () => {
    setSaving(true);
    try { await onSave(idRef.current, draft); setEditing(false); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-3xl h-full bg-slate-50 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {editing ? (
                <input value={draft?.code || ""} onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                  className="font-mono text-2xl font-bold text-slate-900 w-28 border-b border-[#7FC4EE] focus:outline-none" />
              ) : (
                <span className="font-mono text-2xl font-bold text-slate-900">{view.code}</span>
              )}
              <Gauge5 level={lvl} />
            </div>
            {editing ? (
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                <label className="col-span-3 text-[10px] uppercase tracking-wider text-slate-400">Servicios (uno por línea)</label>
                <textarea value={(draft.services || []).join("\n")} onChange={(e) => setDraft({ ...draft, services: e.target.value.split("\n") })}
                  rows={3} className="col-span-3 font-mono text-[12px] px-2 py-1.5 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
                <input value={draft.mat} onChange={(e) => setDraft({ ...draft, mat: e.target.value })} placeholder="Material" className="px-2 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
                <input value={draft.corr} onChange={(e) => setDraft({ ...draft, corr: e.target.value })} placeholder="Corrosión" className="px-2 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
                <input value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })} placeholder="Rating" className="px-2 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
              </div>
            ) : (
              <>
                <div className="mt-1 text-[13px] text-slate-600">{view.mat} · corrosión {view.corr} · rating {view.rating}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{(view.services || []).join(" · ")}</div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={save} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E] disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                </button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[13px] rounded-md text-slate-500 hover:bg-slate-100">Cancelar</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE]"><Pencil size={13} /> Editar</button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
          </div>
        </div>

        {!editing && (
          <div className="px-5 pt-3 bg-white">
            <ReviewPanel item={item} onMark={(against) => onMarkReviewed(item.id, against)} onClear={() => onClearReviewed(item.id)} />
          </div>
        )}

        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-t-md whitespace-nowrap border-b-2 ${active ? "border-[#2C568E] text-slate-900 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "hist" ? (
            <RevisionHistory classId={item.id} />
          ) : tab === "specs" ? (
            <SpecTraceability classId={item.id} />
          ) : !d && !editing ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
              <FileWarning size={32} className="text-slate-300 mb-3" />
              <div className="text-sm font-medium text-slate-700 mb-1">Detalle todavía sin cargar</div>
              <div className="text-[13px] max-w-sm">Esta clase tiene su servicio, material y rating, pero las tablas de componentes/válvulas/ramificaciones aún no fueron transcritas. Tocá <b>Editar</b> para cargarlas.</div>
            </div>
          ) : (
            <>
              {tab === "cond" && (editing ? (
                <DesignEdit T={d.designT} P={d.designP} onChange={(T, P) => setD({ designT: T, designP: P })} rating={view.rating} />
              ) : (
                <DesignView T={d.designT} P={d.designP} rating={view.rating} />
              ))}
              {tab === "comp" && (editing ? <EditTable cols={COMP_COLS} rows={d.comps} onChange={(rows) => setD({ comps: rows })} /> : <SpecTable cols={COMP_COLS} rows={d.comps} />)}
              {tab === "valv" && (editing ? <EditTable cols={VALVE_COLS} rows={d.valves} onChange={(rows) => setD({ valves: rows })} /> : <SpecTable cols={VALVE_COLS} rows={d.valves} />)}
              {tab === "branch" && (
                editing ? (
                  <div className="text-[13px] text-slate-500 bg-white border border-slate-200 rounded-lg p-4">
                    La edición de la matriz de ramificaciones se agrega en la próxima iteración. Por ahora se conserva la tabla cargada; se muestra abajo.
                    <div className="mt-4"><BranchMatrix data={d.branch} /></div>
                  </div>
                ) : <BranchMatrix data={d.branch} />
              )}
              {tab === "notes" && (editing ? <NotesEdit notes={d.notes} onChange={(n) => setD({ notes: n })} /> : (
                d.notes && d.notes.length ? (
                  <ol className="space-y-2">
                    {d.notes.map((n, i) => <li key={i} className="flex gap-2.5 text-[13px] text-slate-700"><span className="font-mono text-slate-400 shrink-0">{i + 1}.</span><span>{n}</span></li>)}
                  </ol>
                ) : <div className="text-[13px] text-slate-400">Sin notas cargadas.</div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DesignView({ T, P, rating }) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">Presión de diseño vs. temperatura</div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg inline-block">
        <table className="text-[12px] font-mono">
          <thead><tr className="bg-slate-100 text-slate-600">
            <th className="text-left px-3 py-1.5 border-b border-slate-200">Temp. °C</th>
            {T.map((t, i) => <th key={i} className="px-3 py-1.5 border-b border-l border-slate-200">{t}</th>)}
          </tr></thead>
          <tbody><tr>
            <td className="px-3 py-1.5 text-slate-700 font-semibold">Presión kg/cm²</td>
            {P.map((p, i) => <td key={i} className="px-3 py-1.5 text-center text-slate-800 border-l border-slate-100">{p}</td>)}
          </tr></tbody>
        </table>
      </div>
      <div className="text-[12px] text-slate-500">La presión admisible desrata con la temperatura. Rating de bridas: {rating}.</div>
    </div>
  );
}
function DesignEdit({ T, P, onChange, rating }) {
  const setT = (i, val) => { const t = T.slice(); t[i] = val; onChange(t, P); };
  const setP = (i, val) => { const p = P.slice(); p[i] = val; onChange(T, p); };
  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">Presión de diseño vs. temperatura (rating {rating})</div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="text-[12px] font-mono">
          <tbody>
            <tr>
              <td className="px-2 py-1 text-slate-500 font-semibold whitespace-nowrap border-b border-slate-100">Temp. °C</td>
              {T.map((t, i) => (
                <td key={i} className="p-0.5 border-b border-l border-slate-100">
                  <input value={t} onChange={(e) => setT(i, e.target.value)} className="w-20 px-1.5 py-1 text-center rounded border border-transparent hover:border-slate-200 focus:border-[#3F72AC] focus:outline-none bg-transparent" />
                </td>
              ))}
              <td className="border-b border-slate-100"></td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-slate-500 font-semibold whitespace-nowrap">Pres. kg/cm²</td>
              {P.map((p, i) => (
                <td key={i} className="p-0.5 border-l border-slate-100">
                  <input value={p} onChange={(e) => setP(i, e.target.value)} className="w-20 px-1.5 py-1 text-center rounded border border-transparent hover:border-slate-200 focus:border-[#3F72AC] focus:outline-none bg-transparent" />
                </td>
              ))}
              <td className="px-1 text-center align-middle">
                <button onClick={() => onChange(T.filter((_, k) => k !== T.length - 1), P.filter((_, k) => k !== P.length - 1))}
                  disabled={T.length <= 1} className="text-slate-300 hover:text-red-500 disabled:opacity-30" title="Quitar última columna"><X size={13} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={() => onChange([...T, ""], [...P, ""])} className="text-[12px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={13} /> Agregar columna (temperatura)</button>
    </div>
  );
}
function NotesEdit({ notes, onChange }) {
  const upd = (i, val) => { const n = notes.slice(); n[i] = val; onChange(n); };
  return (
    <div className="space-y-2">
      {notes.map((n, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="font-mono text-[12px] text-slate-400 mt-2">{i + 1}.</span>
          <textarea value={n} onChange={(e) => upd(i, e.target.value)} rows={2} className="flex-1 text-[13px] px-2 py-1.5 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
          <button onClick={() => onChange(notes.filter((_, k) => k !== i))} className="text-slate-300 hover:text-red-500 mt-2"><X size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...notes, ""])} className="text-[12px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={13} /> Agregar nota</button>
    </div>
  );
}

function CodeStamp({ sel, setSel, classes, slots }) {
  const assembled = slots.map((s) => sel[s.slot] || "·").join("");
  const match = classes.find((k) => k.code === assembled);
  return (
    <div className="rounded-xl bg-[#122542] text-slate-100 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8FAFD6] mb-4"><Layers size={13} /> Ensamblador de clase</div>
      <div className="flex items-baseline justify-center gap-1 mb-4 flex-wrap">
        {slots.map((s) => (
          <span key={s.slot} className="flex flex-col items-center">
            <span className={`font-mono text-4xl leading-none ${sel[s.slot] ? "text-[#7FC4EE]" : "text-[#3C567F]"}`}>{sel[s.slot] || "·"}</span>
            <span className="mt-2 text-[10px] tracking-widest text-[#7291BB]">{s.slot}</span>
          </span>
        ))}
      </div>
      <div className="text-center text-[13px] mb-4">
        {match ? <span className="text-emerald-300">Coincide con <span className="font-mono font-semibold">{match.code}</span></span>
          : assembled !== "·".repeat(slots.length) ? <span className="text-[#8FAFD6]">Sin clase en este registro</span>
          : <span className="text-[#7291BB]">Ensamblá cada segmento</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {slots.map((s) => (
          <div key={s.slot}>
            <div className="text-[10px] uppercase tracking-wider text-[#7291BB] mb-1">{s.slot} · {s.label}</div>
            <select value={sel[s.slot] || ""} onChange={(e) => setSel({ ...sel, [s.slot]: e.target.value })}
              className="w-full bg-[#1D3A63] text-slate-100 text-[13px] rounded-md px-2 py-1.5 border border-[#2C4C7C] focus:border-[#3F72AC] focus:outline-none">
              <option value="">—</option>
              {s.rows.map((r) => <option key={r.code} value={r.code}>{r.code} · {r.value}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
function Convention({ slots }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800"><Info size={15} className="text-slate-400" /> Convención de códigos</span>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {slots.map((s) => (
            <div key={s.slot}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5"><span className="font-mono font-semibold text-[#1F3F6E]">{s.slot}</span> · {s.label}</div>
              <div className="border border-slate-200 rounded-md overflow-hidden">
                {s.rows.map((r, i) => (
                  <div key={r.code} className={`flex text-[12px] ${i % 2 ? "bg-slate-50" : "bg-white"}`}>
                    <div className="w-10 shrink-0 font-mono font-semibold text-slate-700 px-2 py-1 border-r border-slate-100">{r.code}</div>
                    <div className="px-2 py-1 text-slate-600">{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewBadge({ item }) {
  if (!item.reviewedBy) return <span className="text-[10.5px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded flex items-center gap-1"><ShieldAlert size={11} /> sin revisar</span>;
  const date = new Date(item.reviewedAt).toLocaleDateString("es-AR");
  return (
    <span className="text-[10.5px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1" title={`Revisado por ${item.reviewedBy} el ${date}${item.reviewedAgainst ? " contra " + item.reviewedAgainst : ""}`}>
      <ShieldCheck size={11} /> revisado {date}
    </span>
  );
}

function RegisterCard({ item, onOpen, onToggle, onDuplicate, onRemove }) {
  const lvl = ratingLevel(item.rating);
  return (
    <div className={`group relative rounded-lg border bg-white transition p-3.5 ${item.on ? "border-slate-200 hover:border-[#7FC4EE] hover:shadow-sm" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(item)} title={item.on ? "Incluida en el proyecto" : "Excluida del proyecto"}>
            {item.on ? <CheckSquare size={16} className="text-[#2C568E]" /> : <Square size={16} className="text-slate-300" />}
          </button>
          <button onClick={() => onOpen(item)} className="font-mono text-lg font-bold text-slate-900 hover:text-[#1F3F6E]">{item.code}</button>
        </div>
        <Gauge5 level={lvl} />
      </div>
      <button onClick={() => onOpen(item)} className="text-left w-full">
        <div className="text-[12px] text-slate-600 leading-snug mb-2 h-8 overflow-hidden">{item.services.filter((s) => !s.startsWith("(")).join(" · ")}</div>
        <div className="flex flex-wrap gap-1.5 text-[10.5px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.rating}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.mat}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">CA {item.corr}</span>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          {item.detail ? <span className="text-[10.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">detalle completo</span>
            : <span className="text-[10.5px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">sólo resumen</span>}
          <ReviewBadge item={item} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onDuplicate(item)} title="Duplicar" className="p-1 text-slate-400 hover:text-slate-700"><Copy size={13} /></button>
          <button onClick={() => onRemove(item)} title="Eliminar" className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function PlantBar({ plants, activeId, setActiveId, onNew, onRename, onDelete }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const active = plants.find((p) => p.id === activeId);
  const [name, setName] = useState(active?.name || "");
  useEffect(() => { setName(active?.name || ""); setRenaming(false); }, [activeId]);
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400"><Building2 size={16} /><span className="text-[12px] uppercase tracking-wider">Tipo de planta</span></div>
        <select value={activeId} onChange={(e) => setActiveId(e.target.value)}
          className="text-[14px] font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:border-[#3F72AC] focus:outline-none">
          {plants.map((p) => <option key={p.id} value={p.id}>{p.name}{p.seeded ? "  ✓ cargada" : "  · plantilla"}</option>)}
        </select>
        {renaming ? (
          <span className="flex items-center gap-1">
            <input value={name} onChange={(e) => setName(e.target.value)} className="text-[14px] px-2 py-1 border border-[#7FC4EE] rounded focus:outline-none" />
            <button onClick={() => { onRename(activeId, name); setRenaming(false); }} className="p-1.5 text-[#1F3F6E]"><Check size={15} /></button>
          </span>
        ) : (
          <button onClick={() => setRenaming(true)} className="p-1.5 text-slate-400 hover:text-slate-700" title="Renombrar"><Pencil size={14} /></button>
        )}
        {plants.length > 1 && <button onClick={() => onDelete(activeId)} className="p-1.5 text-slate-400 hover:text-red-500" title="Eliminar tipo de planta"><Trash2 size={14} /></button>}
        <div className="relative ml-auto">
          <button onClick={() => setMenu(!menu)} className="flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE]"><Plus size={14} /> Nuevo tipo de planta</button>
          {menu && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-[13px]">
              <button onClick={() => { onNew("dup"); setMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-[#EAF3FB]">
                <div className="font-medium text-slate-800">Duplicar estándar EPF</div>
                <div className="text-[11px] text-slate-500">Arranca con las clases de EPF pre-cargadas para editar</div>
              </button>
              <button onClick={() => { onNew("blank-abcd"); setMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-[#EAF3FB]">
                <div className="font-medium text-slate-800">En blanco · convención A-B-C-D</div>
                <div className="text-[11px] text-slate-500">Registro vacío, código segmentado tipo EPF</div>
              </button>
              <button onClick={() => { onNew("blank-freeform"); setMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-[#EAF3FB]">
                <div className="font-medium text-slate-800">En blanco · código propio</div>
                <div className="text-[11px] text-slate-500">Registro vacío, cada clase con su propio código (tipo La Calera)</div>
              </button>
            </div>
          )}
        </div>
      </div>
      {active && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 -mt-1">
          <span className="text-[12px] text-slate-500">{active.kind}</span>
          {active.ref !== "—" && <span className="text-[11px] font-mono text-slate-400"> · {active.ref} · {active.code}</span>}
        </div>
      )}
    </div>
  );
}

function FacetGroup({ label, options, selected, onToggle }) {
  if (options.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.has(opt);
          return (
            <button key={opt} onClick={() => onToggle(opt)}
              className={`text-[11.5px] px-2 py-1 rounded-md border font-mono transition ${
                active ? "bg-[#2C568E] border-[#2C568E] text-white" : "bg-white border-slate-200 text-slate-600 hover:border-[#7FC4EE]"
              }`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TriToggle({ label, value, onChange, options }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">{label}</div>
      <div className="flex gap-1.5">
        {options.map(([val, text]) => (
          <button key={val} onClick={() => onChange(val)}
            className={`text-[11.5px] px-2 py-1 rounded-md border transition ${
              value === val ? "bg-[#2C568E] border-[#2C568E] text-white" : "bg-white border-slate-200 text-slate-600 hover:border-[#7FC4EE]"
            }`}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Generador() {
  const { email, signOut } = useAuth();
  const [plants, setPlants] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState(null);
  const [asm, setAsm] = useState({});
  const [q, setQ] = useState("");
  const [onlyIncluded, setOnlyIncluded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fMat, setFMat] = useState(new Set());
  const [fRating, setFRating] = useState(new Set());
  const [fCorr, setFCorr] = useState(new Set());
  const [fDetail, setFDetail] = useState("all");
  const [fReviewed, setFReviewed] = useState("all");
  const toggleInSet = (setter) => (val) => setter((prev) => {
    const next = new Set(prev);
    next.has(val) ? next.delete(val) : next.add(val);
    return next;
  });
  const clearFilters = () => {
    setFMat(new Set()); setFRating(new Set()); setFCorr(new Set());
    setFDetail("all"); setFReviewed("all");
  };
  useEffect(() => { clearFilters(); setQ(""); }, [activeId]);

  const reload = async () => {
    const data = await fetchAllPlants();
    setPlants(data);
    setActiveId((cur) => (data.find((p) => p.id === cur) ? cur : data[0]?.id));
  };

  useEffect(() => {
    (async () => {
      try {
        await syncFromSeed(SEED_PLANTS);
        await reload();
      } catch (e) {
        setErr(e.message || "No se pudo conectar con la base de datos.");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const active = plants.find((p) => p.id === activeId) || plants[0];

  // Actualiza una clase en el estado local sin recargar todo (evita parpadeos).
  const patchClassInState = (classId, patch) =>
    setPlants((ps) => ps.map((p) => ({
      ...p,
      classes: p.classes.map((k) => (k.id === classId ? { ...k, ...patch } : k)),
    })));
  const removeClassFromState = (classId) =>
    setPlants((ps) => ps.map((p) => ({ ...p, classes: p.classes.filter((k) => k.id !== classId) })));
  const addClassToState = (plantId, cls) =>
    setPlants((ps) => ps.map((p) => (p.id !== plantId ? p : { ...p, classes: [cls, ...p.classes] })));

  const uniqueCode = (base, list) => {
    let code = base, i = 2;
    while (list.find((k) => k.code === code)) code = `${base}-${i++}`;
    return code;
  };
  const openItem = active?.classes.find((k) => k.id === openId) || null;

  const handlers = {
    toggle: async (item) => {
      patchClassInState(item.id, { on: !item.on });
      try { await toggleClassIncluded(item.id, !item.on); } catch (e) { patchClassInState(item.id, { on: item.on }); }
    },
    remove: async (item) => {
      if (openId === item.id) setOpenId(null);
      removeClassFromState(item.id);
      try { await deleteClass(item.id); } catch (e) { await reload(); }
    },
    duplicate: async (item) => {
      const code = uniqueCode(item.code, active.classes);
      const created = await insertClass(active.id, { ...item, code, fam: "custom", page: null });
      addClassToState(active.id, {
        id: created.id, code: created.code, fam: created.fam, mat: created.mat, corr: created.corr,
        rating: created.rating, design: created.design, services: created.services, page: created.page,
        on: true, detail: created.detail, reviewedBy: null, reviewedAt: null, reviewedAgainst: null,
      });
    },
    addBlank: async () => {
      const code = uniqueCode("NUEVA", active.classes);
      const created = await insertClass(active.id, { code, fam: "custom", mat: "—", corr: "—", rating: "150#", services: ["Servicio nuevo"] });
      addClassToState(active.id, {
        id: created.id, code: created.code, fam: created.fam, mat: created.mat, corr: created.corr,
        rating: created.rating, design: created.design, services: created.services, page: created.page,
        on: true, detail: null, reviewedBy: null, reviewedAt: null, reviewedAgainst: null,
      });
    },
    saveClass: async (classId, draft) => {
      const updated = await updateClassWithRevision(classId, {
        code: draft.code, fam: draft.fam, mat: draft.mat, corr: draft.corr,
        rating: draft.rating, design: draft.design, services: draft.services, detail: draft.detail,
      });
      patchClassInState(classId, {
        code: updated.code, fam: updated.fam, mat: updated.mat, corr: updated.corr,
        rating: updated.rating, design: updated.design, services: updated.services, detail: updated.detail,
      });
    },
    markReviewed: async (classId, against) => {
      const updated = await markReviewed(classId, against);
      patchClassInState(classId, { reviewedBy: updated.reviewed_by, reviewedAt: updated.reviewed_at, reviewedAgainst: updated.reviewed_against });
    },
    clearReviewed: async (classId) => {
      await clearReviewed(classId);
      patchClassInState(classId, { reviewedBy: null, reviewedAt: null, reviewedAgainst: null });
    },
    resetStandard: async () => {
      const seedSource = active.id === "lacal-pluspetrol" ? seedLaCalera() : seedClasses();
      await resetPlantClasses(active.id, seedSource);
      await reload();
    },
    newPlant: async (mode) => {
      const id = uid();
      const isDup = mode === "dup";
      const convention = mode === "blank-freeform" ? FREEFORM_CODE_CONVENTION : EPF_CODE_CONVENTION;
      const plant = await createPlant({
        id,
        name: isDup ? "EPF (copia) — editar" : "Nueva planta",
        kind: isDup ? "Duplicado del estándar EPF" : "Plantilla en blanco",
        ref: "—", code: "ASME B31.3",
        codeConvention: convention,
      });
      if (isDup) await bulkInsertClasses(id, seedClasses());
      await reload();
      setActiveId(id);
    },
    renamePlant: async (id, name) => { await apiRenamePlant(id, name); setPlants((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p))); },
    deletePlant: async (id) => {
      await apiDeletePlant(id);
      const next = plants.filter((p) => p.id !== id);
      setPlants(next);
      if (activeId === id && next.length) setActiveId(next[0].id);
    },
  };

  const facetOptions = useMemo(() => {
    if (!active) return { mats: [], ratings: [], corrs: [] };
    const mats = new Set(), ratings = new Set(), corrs = new Set();
    active.classes.forEach((k) => {
      if (k.mat) mats.add(k.mat);
      if (k.rating) ratings.add(k.rating);
      if (k.corr) corrs.add(k.corr);
    });
    return { mats: [...mats].sort(), ratings: [...ratings].sort(), corrs: [...corrs].sort() };
  }, [active]);
  const activeFilterCount = fMat.size + fRating.size + fCorr.size + (fDetail !== "all" ? 1 : 0) + (fReviewed !== "all" ? 1 : 0);

  const fams = useMemo(() => {
    if (!active) return {};
    const g = {};
    active.classes.forEach((k) => {
      if (onlyIncluded && !k.on) return;
      const hay = (k.code + " " + k.services.join(" ") + " " + k.mat).toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return;
      if (fMat.size && !fMat.has(k.mat)) return;
      if (fRating.size && !fRating.has(k.rating)) return;
      if (fCorr.size && !fCorr.has(k.corr)) return;
      if (fDetail === "complete" && !k.detail) return;
      if (fDetail === "summary" && k.detail) return;
      if (fReviewed === "reviewed" && !k.reviewedBy) return;
      if (fReviewed === "unreviewed" && k.reviewedBy) return;
      (g[k.fam] ||= []).push(k);
    });
    return g;
  }, [active, q, onlyIncluded, fMat, fRating, fCorr, fDetail, fReviewed]);
  const includedCount = active ? active.classes.filter((k) => k.on).length : 0;

  if (!ready)
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm gap-2 flex items-center"><Loader2 size={16} className="animate-spin" /> Cargando registro…</div>;
  if (err)
    return <div className="min-h-[60vh] flex items-center justify-center text-red-500 text-sm px-6 text-center">{err}</div>;
  if (!active)
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">No hay plantas cargadas todavía.</div>;

  const slots = active.codeConvention?.type === "segmented" ? active.codeConvention.slots : null;

  return (
    <div className="bg-slate-100 text-slate-900" style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <PlantBar plants={plants} activeId={activeId} setActiveId={setActiveId}
        onNew={handlers.newPlant} onRename={handlers.renamePlant} onDelete={handlers.deletePlant} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-5 order-2 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Registro de clases
              <span className="ml-2 text-[12px] font-normal text-slate-500">{includedCount} de {active.classes.length} en el proyecto</span>
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={handlers.addBlank} className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-md bg-[#132A4C] text-white hover:bg-[#1F3F6E]"><Plus size={13} /> Agregar clase</button>
              {active.seeded && <button onClick={handlers.resetStandard} className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:border-[#7FC4EE]" title="Volver a las clases del documento original"><RotateCcw size={13} /> Restaurar estándar</button>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicio, código o material…"
                className="w-full pl-8 pr-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:border-[#3F72AC] focus:outline-none bg-white" />
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={onlyIncluded} onChange={(e) => setOnlyIncluded(e.target.checked)} className="accent-[#2C568E]" />
              Sólo las del proyecto
            </label>
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1.5 rounded-md border ${
                activeFilterCount > 0 ? "border-[#2C568E] text-[#1F3F6E] bg-[#EAF3FB]" : "border-slate-200 text-slate-600 hover:border-[#7FC4EE]"
              }`}>
              <Filter size={13} /> Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              {filtersOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>

          {filtersOpen && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <FacetGroup label="Material" options={facetOptions.mats} selected={fMat} onToggle={toggleInSet(setFMat)} />
                <FacetGroup label="Rating" options={facetOptions.ratings} selected={fRating} onToggle={toggleInSet(setFRating)} />
                <FacetGroup label="Corrosión" options={facetOptions.corrs} selected={fCorr} onToggle={toggleInSet(setFCorr)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
                <TriToggle label="Detalle" value={fDetail} onChange={setFDetail}
                  options={[["all", "Todas"], ["complete", "Completas"], ["summary", "Sólo resumen"]]} />
                <TriToggle label="Revisión" value={fReviewed} onChange={setFReviewed}
                  options={[["all", "Todas"], ["reviewed", "Revisadas"], ["unreviewed", "Sin revisar"]]} />
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-[12px] text-slate-500 hover:text-red-500">Limpiar filtros</button>
              )}
            </div>
          )}

          {active.classes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-5 py-12 text-center">
              <Building2 size={26} className="text-slate-300 mx-auto mb-3" />
              <div className="text-[14px] font-medium text-slate-600">Plantilla vacía</div>
              <div className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">Este tipo de planta todavía no tiene clases. Duplicá el estándar EPF como base desde "Nuevo tipo de planta", o cargá tus clases con "Agregar clase".</div>
            </div>
          ) : (
            Object.entries(fams).map(([fam, list]) => (
              <div key={fam}>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">{FAMILIES[fam] || fam}</div>
                <div className="grid sm:grid-cols-2 gap-3 mb-1">
                  {list.map((k) => <RegisterCard key={k.id} item={k} onOpen={(it) => setOpenId(it.id)} onToggle={handlers.toggle} onDuplicate={handlers.duplicate} onRemove={handlers.remove} />)}
                </div>
              </div>
            ))
          )}
          {active.classes.length > 0 && Object.keys(fams).length === 0 && (
            <div className="text-[13px] text-slate-400 py-6">Sin resultados para el filtro actual.</div>
          )}
        </div>

        <div className="order-1 lg:order-2 space-y-4">
          {slots ? (
            <>
              <CodeStamp sel={asm} setSel={setAsm} classes={active.classes} slots={slots} />
              <Convention slots={slots} />
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-600 leading-relaxed">
              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-1.5"><Info size={15} className="text-slate-400" /> Código propio por clase</div>
              Este proyecto no usa una convención segmentada: cada clase tiene su propio código de documento (ej. B10A, A10R). El ensamblador de la izquierda no aplica acá — buscá por código directamente en el registro o con la barra de búsqueda.
            </div>
          )}
          <div className="text-[11px] text-slate-400 leading-relaxed px-1">
            Los cambios se guardan en la base de datos compartida — los ve todo el equipo, al instante.
          </div>
        </div>
      </main>

      {openItem && (
        <DetailPanel
          item={openItem}
          onClose={() => setOpenId(null)}
          onSave={handlers.saveClass}
          onMarkReviewed={handlers.markReviewed}
          onClearReviewed={handlers.clearReviewed}
        />
      )}
    </div>
  );
}
