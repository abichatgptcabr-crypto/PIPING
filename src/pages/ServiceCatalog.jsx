import React, { useState, useEffect, useMemo } from "react";
import { Droplets, Search, Loader2, Check, Pencil, Building2 } from "lucide-react";
import { fetchAllPlants, syncServiceCatalog, fetchServiceCatalog, updateService, computeServiceCodes } from "../lib/api";

const CATEGORY_ORDER = ["Agua", "Hidrocarburos", "Gas y utilitarios", "Contra incendio", "Venteos y antorcha", "Otros"];
const CATEGORY_OPTIONS = CATEGORY_ORDER;

function ServiceRow({ svc, code, usedIn, onSave }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(svc.description || "");
  const [cat, setCat] = useState(svc.category);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await onSave(svc.id, { description: desc, category: cat }); setEditing(false); }
    finally { setSaving(false); }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">{code}</span>
            <span className="text-[14px] font-medium text-slate-800">{svc.name}</span>
          </div>
          {!editing && (
            <div className="text-[12.5px] text-slate-500 mt-1">{svc.description || <span className="text-slate-300 italic">Sin descripción todavía.</span>}</div>
          )}
          {usedIn.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
              <Building2 size={11} /> usado en {usedIn.length} {usedIn.length === 1 ? "clase" : "clases"} ({usedIn.slice(0, 4).join(", ")}{usedIn.length > 4 ? "…" : ""})
            </div>
          )}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-slate-700 shrink-0"><Pencil size={14} /></button>
        )}
      </div>
      {editing && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Categoría</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}
              className="w-full text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none">
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Descripción breve</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="Qué es este servicio, en una o dos líneas…"
              className="w-full text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-md bg-[#00589E] text-white hover:bg-[#00406E] disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Guardar
            </button>
            <button onClick={() => { setEditing(false); setDesc(svc.description || ""); setCat(svc.category); }} className="text-[12px] px-2.5 py-1.5 rounded-md text-slate-500 hover:bg-slate-100">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceCatalog() {
  const [ready, setReady] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [plants, setPlants] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const allPlants = await fetchAllPlants();
      setPlants(allPlants);
      await syncServiceCatalog(allPlants);
      setCatalog(await fetchServiceCatalog());
      setReady(true);
    })();
  }, []);

  const codes = useMemo(() => computeServiceCodes(catalog), [catalog]);

  // Para cada servicio, en qué clases (código) aparece — cruzando todas las plantas.
  const usageMap = useMemo(() => {
    const map = new Map();
    plants.forEach((p) => p.classes.forEach((k) => {
      (k.services || []).forEach((s) => {
        const clean = (s || "").trim();
        if (!clean) return;
        if (!map.has(clean)) map.set(clean, []);
        map.get(clean).push(k.code);
      });
    }));
    return map;
  }, [plants]);

  const filtered = catalog.filter((s) => {
    if (!q) return true;
    return (s.name + " " + (s.description || "")).toLowerCase().includes(q.toLowerCase());
  });

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((s) => (g[s.category] ||= []).push(s));
    Object.values(g).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return g;
  }, [filtered]);

  const handleSave = async (id, patch) => {
    const updated = await updateService(id, patch);
    setCatalog((c) => c.map((s) => (s.id === id ? updated : s)));
  };

  if (!ready) return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm gap-2"><Loader2 size={16} className="animate-spin" /> Armando el catálogo…</div>;

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <Droplets size={20} className="text-[#00589E]" />
          <div>
            <h2 className="font-display text-[22px] font-bold uppercase tracking-wide text-[#113044] leading-none">Catálogo de servicios</h2>
            <div className="h-[3px] w-10 bg-[#00589E] mt-2" />
          </div>
        </div>
        <p className="text-[13px] text-slate-500 mb-4">
          Todos los servicios que aparecen en cualquier clase de cualquier proyecto, agrupados por tipo. El código
          de cada uno es el mismo que se usa en el índice codificado del PDF de "Armar especificación".
        </p>
        <div className="relative mb-5">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicio…"
            className="w-full pl-8 pr-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none bg-white" />
        </div>

        {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((cat) => (
          <div key={cat} className="mb-6">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">{cat} <span className="text-slate-400">({grouped[cat].length})</span></div>
            <div className="space-y-2">
              {grouped[cat].map((s) => (
                <ServiceRow key={s.id} svc={s} code={codes.get(s.name)} usedIn={usageMap.get(s.name) || []} onSave={handleSave} />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-[13px] text-slate-400 py-10 text-center">Sin resultados para "{q}".</div>}
      </div>
    </div>
  );
}
