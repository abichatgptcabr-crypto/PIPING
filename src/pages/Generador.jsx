import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Layers, ChevronDown, ChevronRight, X, Table2, CircleDot, GitBranch, StickyNote,
  Gauge, Search, Info, FileWarning, Plus, Pencil, Copy, Trash2, Building2, RotateCcw,
  CheckSquare, Square, Check, Save,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   MOTOR DE NOMENCLATURA · A-B-C-D  ·  018-ABDC-00300-TI-C-0001 Rev.1 pág.3
   ═══════════════════════════════════════════════════════════════════════════ */
import {
  NAMING, FAMILIES, COMP_COLS, VALVE_COLS, CLASSES, LACAL_CLASSES,
  seedClasses, seedLaCalera, SEED_PLANTS, ratingLevel, clone, uid,
} from "../data/plants";


/* Persistencia en localStorage del navegador ─────────────────────────────── */
const STORE_KEY = "pcgen:plants:v1";
function storageLoad() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function storageSave(plants) {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(plants)); } catch (e) {}
}

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
  { id: "notes", label: "Notas", icon: StickyNote },
];
const emptyDetail = () => ({ designT: [""], designP: [""], comps: [], valves: [], branch: { legend: [], sizes: [], m: {}, note: "" }, notes: [] });

function DetailPanel({ item, onClose, onSave }) {
  const [tab, setTab] = useState("cond");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const originalCode = useRef(item.code);

  useEffect(() => { originalCode.current = item.code; setEditing(false); setTab("cond"); }, [item]);
  useEffect(() => {
    if (editing) setDraft(clone({ ...item, detail: item.detail || emptyDetail() }));
  }, [editing, item]);

  const view = editing && draft ? draft : item;
  const d = view.detail;
  const lvl = ratingLevel(view.rating);
  const setD = (patch) => setDraft((dr) => ({ ...dr, detail: { ...dr.detail, ...patch } }));
  const save = () => { onSave(originalCode.current, draft); setEditing(false); };

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
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E]"><Save size={14} /> Guardar</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[13px] rounded-md text-slate-500 hover:bg-slate-100">Cancelar</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE]"><Pencil size={13} /> Editar</button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
          </div>
        </div>

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
          {!d && !editing ? (
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

function CodeStamp({ sel, setSel, classes }) {
  const parts = ["A", "B", "C", "D"];
  const assembled = parts.map((p) => sel[p] || "·").join("");
  const match = classes.find((k) => k.code === assembled);
  return (
    <div className="rounded-xl bg-[#122542] text-slate-100 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8FAFD6] mb-4"><Layers size={13} /> Ensamblador de clase · A-B-C-D</div>
      <div className="flex items-baseline justify-center gap-1 mb-4">
        {parts.map((p) => (
          <span key={p} className="flex flex-col items-center">
            <span className={`font-mono text-4xl leading-none ${sel[p] ? "text-[#7FC4EE]" : "text-[#3C567F]"}`}>{sel[p] || "·"}</span>
            <span className="mt-2 text-[10px] tracking-widest text-[#7291BB]">{p}</span>
          </span>
        ))}
      </div>
      <div className="text-center text-[13px] mb-4">
        {match ? <span className="text-emerald-300">Coincide con <span className="font-mono font-semibold">{match.code}</span></span>
          : assembled !== "····" ? <span className="text-[#8FAFD6]">Sin clase en este registro</span>
          : <span className="text-[#7291BB]">Ensamblá cada segmento</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {parts.map((p) => (
          <div key={p}>
            <div className="text-[10px] uppercase tracking-wider text-[#7291BB] mb-1">{p} · {NAMING[p].label}</div>
            <select value={sel[p] || ""} onChange={(e) => setSel({ ...sel, [p]: e.target.value })}
              className="w-full bg-[#1D3A63] text-slate-100 text-[13px] rounded-md px-2 py-1.5 border border-[#2C4C7C] focus:border-[#3F72AC] focus:outline-none">
              <option value="">—</option>
              {NAMING[p].rows.map((r) => <option key={r.code} value={r.code}>{r.code} · {r.value}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
function Convention() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800"><Info size={15} className="text-slate-400" /> Convención A-B-C-D</span>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {Object.values(NAMING).map((t) => (
            <div key={t.slot}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5"><span className="font-mono font-semibold text-[#1F3F6E]">{t.slot}</span> · {t.label}</div>
              <div className="border border-slate-200 rounded-md overflow-hidden">
                {t.rows.map((r, i) => (
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

function RegisterCard({ item, onOpen, onToggle, onDuplicate, onRemove }) {
  const lvl = ratingLevel(item.rating);
  return (
    <div className={`group relative rounded-lg border bg-white transition p-3.5 ${item.on ? "border-slate-200 hover:border-[#7FC4EE] hover:shadow-sm" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(item.code)} title={item.on ? "Incluida en el proyecto" : "Excluida del proyecto"}>
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
      <div className="mt-2 flex items-center justify-between">
        {item.detail ? <span className="text-[10.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">detalle completo</span>
          : <span className="text-[10.5px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">sólo resumen</span>}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onDuplicate(item.code)} title="Duplicar" className="p-1 text-slate-400 hover:text-slate-700"><Copy size={13} /></button>
          <button onClick={() => onRemove(item.code)} title="Eliminar" className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
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
                <div className="text-[11px] text-slate-500">Arranca con las 23 clases pre-cargadas para editar</div>
              </button>
              <button onClick={() => { onNew("blank"); setMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-[#EAF3FB]">
                <div className="font-medium text-slate-800">Empezar en blanco</div>
                <div className="text-[11px] text-slate-500">Registro vacío, cargás tus clases</div>
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

export default function Generador() {
  const [plants, setPlants] = useState(SEED_PLANTS);
  const [activeId, setActiveId] = useState(SEED_PLANTS[0].id);
  const [ready, setReady] = useState(false);
  const [openCode, setOpenCode] = useState(null);
  const [asm, setAsm] = useState({});
  const [q, setQ] = useState("");
  const [onlyIncluded, setOnlyIncluded] = useState(false);

  useEffect(() => {
    const saved = storageLoad();
    if (saved && Array.isArray(saved) && saved.length) {
      // Adjunto cualquier planta nueva del código (SEED_PLANTS) que el usuario
      // todavía no tenga guardada, sin tocar lo que ya editó.
      const savedIds = new Set(saved.map((p) => p.id));
      const missing = SEED_PLANTS.filter((p) => !savedIds.has(p.id)).map((p) => clone(p));
      const merged = missing.length ? [...saved, ...missing] : saved;
      setPlants(merged);
      if (!merged.find((p) => p.id === activeId)) setActiveId(merged[0].id);
    }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) storageSave(plants); }, [plants, ready]);

  const active = plants.find((p) => p.id === activeId) || plants[0];
  const setActiveClasses = (fn) =>
    setPlants((ps) => ps.map((p) => (p.id !== activeId ? p : { ...p, classes: fn(p.classes) })));

  const uniqueCode = (base, list) => {
    let code = base, i = 2;
    while (list.find((k) => k.code === code)) code = `${base}-${i++}`;
    return code;
  };
  const openItem = active.classes.find((k) => k.code === openCode) || null;

  const handlers = {
    toggle: (code) => setActiveClasses((cs) => cs.map((k) => (k.code === code ? { ...k, on: !k.on } : k))),
    remove: (code) => { setActiveClasses((cs) => cs.filter((k) => k.code !== code)); if (openCode === code) setOpenCode(null); },
    duplicate: (code) => setActiveClasses((cs) => {
      const src = cs.find((k) => k.code === code); if (!src) return cs;
      const copy = clone({ ...src, code: uniqueCode(src.code, cs), fam: "custom", page: null });
      const idx = cs.findIndex((k) => k.code === code);
      return [...cs.slice(0, idx + 1), copy, ...cs.slice(idx + 1)];
    }),
    addBlank: () => setActiveClasses((cs) => [
      { code: uniqueCode("NUEVA", cs), fam: "custom", mat: "—", corr: "—", rating: "150#", page: null, on: true, services: ["Servicio nuevo"], detail: null },
      ...cs,
    ]),
    saveClass: (originalCode, nc) => setActiveClasses((cs) => cs.map((k) => (k.code === originalCode ? { ...nc, on: k.on } : k))),
    resetStandard: () => setActiveClasses(() =>
      activeId === "lacal-pluspetrol" ? seedLaCalera() : seedClasses()
    ),
    newPlant: (mode) => {
      const np = {
        id: uid(),
        name: mode === "dup" ? "EPF (copia) — editar" : "Nueva planta",
        kind: mode === "dup" ? "Duplicado del estándar EPF" : "Plantilla en blanco",
        ref: "—", code: "ASME B31.3", seeded: false, naming: NAMING,
        classes: mode === "dup" ? seedClasses() : [],
      };
      setPlants((ps) => [...ps, np]); setActiveId(np.id);
    },
    renamePlant: (id, name) => setPlants((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p))),
    deletePlant: (id) => setPlants((ps) => {
      const next = ps.filter((p) => p.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next.length ? next : ps;
    }),
  };

  const fams = useMemo(() => {
    const g = {};
    active.classes.forEach((k) => {
      if (onlyIncluded && !k.on) return;
      const hay = (k.code + " " + k.services.join(" ") + " " + k.mat).toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return;
      (g[k.fam] ||= []).push(k);
    });
    return g;
  }, [active, q, onlyIncluded]);
  const includedCount = active.classes.filter((k) => k.on).length;

  if (!ready)
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">Cargando registro…</div>;

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
          </div>

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
                  {list.map((k) => <RegisterCard key={k.code} item={k} onOpen={(it) => setOpenCode(it.code)} onToggle={handlers.toggle} onDuplicate={handlers.duplicate} onRemove={handlers.remove} />)}
                </div>
              </div>
            ))
          )}
          {active.classes.length > 0 && Object.keys(fams).length === 0 && (
            <div className="text-[13px] text-slate-400 py-6">Sin resultados para el filtro actual.</div>
          )}
        </div>

        <div className="order-1 lg:order-2 space-y-4">
          {active.codeConvention === "abcd" ? (
            <>
              <CodeStamp sel={asm} setSel={setAsm} classes={active.classes} />
              <Convention />
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-600 leading-relaxed">
              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-1.5"><Info size={15} className="text-slate-400" /> Código propio por clase</div>
              Este proyecto no usa la convención segmentada A-B-C-D: cada clase tiene su propio código de documento (ej. B10A, A10R). El ensamblador de la izquierda no aplica acá — buscá por código directamente en el registro o con la barra de búsqueda.
            </div>
          )}
          <div className="text-[11px] text-slate-400 leading-relaxed px-1">
            Los cambios se guardan en este navegador (localStorage). Otro equipo o modo incógnito no los ve — el próximo paso, cuando la lógica esté validada, es un backend compartido.
          </div>
        </div>
      </main>

      {openItem && <DetailPanel item={openItem} onClose={() => setOpenCode(null)} onSave={handlers.saveClass} />}
    </div>
  );
}
