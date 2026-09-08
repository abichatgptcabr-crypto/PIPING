import React, { useState, useEffect, useMemo } from "react";
import { HardDrive, Loader2, CheckCircle2, AlertTriangle, Download, ChevronRight } from "lucide-react";
import { fetchSpecs, fetchSpecItems } from "../lib/api";
import { matchRows } from "../lib/cadworxMatch";

function buildCadworxXml(docMeta, items) {
  const esc = (s) => (s || "").toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const specs = items.map((it) => {
    const d = it.item.detail;
    const rows = d ? [...d.comps, ...d.valves] : [];
    const comps = matchRows(rows).map(({ row: r, match }) => {
      if (match) {
        return `      <Component Name="${esc(match.name)}" LongDesc="${esc(match.long)}" Type="${match.type}" CategoryType="${match.category}" ProgramCode="${match.programCode}" SourceRow="${esc(r.join(" | "))}"/>`;
      }
      return `      <Component Name="SIN_DEFINIR" NeedsManualDefinition="true" SourceRow="${esc(r.join(" | "))}"/>`;
    }).join("\n");
    return `  <Specification Name="${esc(it.item.code)}" NominalRating="${esc(it.item.rating)}" Material="${esc(it.item.mat)}" CorrosionAllowance="${esc(it.item.corr)}" DesignConditions="${esc(it.item.design)}">
    <Components>
${comps || '      <!-- sin detalle cargado para esta clase -->'}
    </Components>
  </Specification>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Borrador de catálogo CADWorx generado por Hytech Tools a partir de "${esc(docMeta.title)}" (${esc(docMeta.docNumber)}).
     Los componentes con Type/CategoryType/ProgramCode fueron confirmados cruzando catálogos reales de CADWorx.
     Los marcados NeedsManualDefinition="true" no tienen coincidencia confirmada — hay que definirlos a mano en el Spec Editor. -->
<Project Name="${esc(docMeta.title)}" GeneratedBy="Hytech Tools">
${specs}
</Project>
`;
}

export default function CadworxExport() {
  const [specs, setSpecs] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => { fetchSpecs().then(setSpecs).catch(() => setSpecs([])); }, []);

  const groupedSpecs = useMemo(() => {
    if (!specs) return [];
    const map = new Map();
    for (const s of specs) {
      const key = (s.doc_number && s.doc_number.trim()) || `${s.title}::${s.project}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()]
      .map(([key, list]) => ({ key, items: list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }))
      .sort((a, b) => new Date(b.items[0].created_at) - new Date(a.items[0].created_at));
  }, [specs]);

  const openSpec = async (spec) => {
    setSelectedId(spec.id);
    setLoadingItems(true);
    try {
      const rows = await fetchSpecItems(spec.id);
      setItems(rows.map((r) => (r.plantName ? r : { plantName: "—", item: r.item })));
    } finally {
      setLoadingItems(false);
    }
  };

  const selectedSpec = specs?.find((s) => s.id === selectedId);

  const coverage = useMemo(() => {
    if (!items) return null;
    let matched = 0, unmatched = 0, noDetail = 0;
    items.forEach((it) => {
      const d = it.item.detail;
      if (!d) { noDetail++; return; }
      matchRows([...d.comps, ...d.valves]).forEach(({ match }) => {
        if (match) matched++; else unmatched++;
      });
    });
    return { matched, unmatched, noDetail };
  }, [items]);

  const download = () => {
    const xml = buildCadworxXml(
      { title: selectedSpec.title, docNumber: selectedSpec.doc_number },
      items
    );
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(selectedSpec.doc_number || selectedSpec.title || "spec").replace(/[\\/:*?"<>|]/g, "-")}-cadworx.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <HardDrive size={20} className="text-[#00589E]" />
          <div>
            <h2 className="font-display text-[22px] font-bold uppercase tracking-wide text-[#113044] leading-none">Generar SPEC CADWorx</h2>
            <div className="h-[3px] w-10 bg-[#00589E] mt-2" />
          </div>
        </div>
        <p className="text-[13px] text-slate-500 mb-2 max-w-2xl">
          Elegí una especificación ya guardada en "Armar especificación" y generá un borrador de catálogo para CADWorx.
          Los componentes con coincidencia confirmada llevan el código real del programa; los que no, quedan marcados
          para definir a mano en el Spec Editor — no se inventa ningún código.
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 mb-5 text-[12px] text-amber-800 max-w-2xl">
          <b>Importante:</b> "confirmado" acá significa que el tipo de componente (caño, brida, válvula) es real y verificado.
          Todavía no incluye la tabla dimensional (tamaños/geometría 3D) de cada componente — eso vive en los catálogos de
          CADWorx y hay que completarlo ahí antes de dar por terminada la especificación.
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-md border border-slate-200 bg-white shadow-sm p-3 space-y-1 max-h-[60vh] overflow-y-auto">
            {specs === null ? (
              <div className="text-[13px] text-slate-400 flex items-center gap-2 px-2 py-3"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
            ) : groupedSpecs.length === 0 ? (
              <div className="text-[13px] text-slate-400 px-2 py-3">Todavía no hay specs guardadas.</div>
            ) : (
              groupedSpecs.map((g) => {
                const latest = g.items[0];
                return (
                  <button key={g.key} onClick={() => openSpec(latest)}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-[12.5px] flex items-center justify-between gap-1 ${selectedId === latest.id ? "bg-[#EAF3FB] text-[#00406E]" : "hover:bg-slate-50 text-slate-700"}`}>
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{latest.project || latest.title}</span>
                      <span className="block text-[11px] text-slate-400 truncate">{latest.doc_number || "sin N° de documento"} · Rev. {latest.revision}</span>
                    </span>
                    <ChevronRight size={13} className="shrink-0 text-slate-300" />
                  </button>
                );
              })
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white shadow-sm p-4">
            {!selectedId ? (
              <div className="text-[13px] text-slate-400 py-10 text-center">Elegí una spec de la lista para ver su cobertura.</div>
            ) : loadingItems ? (
              <div className="text-[13px] text-slate-400 flex items-center gap-2 py-10 justify-center"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
            ) : (
              <>
                <div className="text-[14px] font-semibold text-slate-800 mb-1">{selectedSpec.title}</div>
                <div className="text-[12px] text-slate-500 mb-4">{selectedSpec.doc_number || "sin N° de documento"} · Rev. {selectedSpec.revision} · {items.length} clases</div>

                {coverage && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
                      <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium"><CheckCircle2 size={12} /> confirmados</div>
                      <div className="text-[20px] font-bold text-emerald-700">{coverage.matched}</div>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                      <div className="flex items-center gap-1 text-amber-700 text-[11px] font-medium"><AlertTriangle size={12} /> sin definir</div>
                      <div className="text-[20px] font-bold text-amber-700">{coverage.unmatched}</div>
                    </div>
                    <div className="rounded-md bg-slate-100 border border-slate-200 px-3 py-2">
                      <div className="text-slate-500 text-[11px] font-medium">sin detalle</div>
                      <div className="text-[20px] font-bold text-slate-500">{coverage.noDetail} clases</div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
                  {items.map((it) => {
                    const d = it.item.detail;
                    const rows = d ? [...d.comps, ...d.valves] : [];
                    const m = matchRows(rows).filter((x) => x.match).length;
                    return (
                      <div key={it.item.id} className="flex items-center justify-between text-[12px] px-2 py-1.5 rounded bg-slate-50">
                        <span className="font-mono font-medium">{it.item.code}</span>
                        <span className="text-slate-500">{d ? `${m}/${rows.length} confirmados` : "sin detalle"}</span>
                      </div>
                    );
                  })}
                </div>

                <button onClick={download} className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md bg-[#00589E] text-white hover:bg-[#00406E]">
                  <Download size={14} /> Descargar borrador CADWorx
                </button>
                <div className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Esto no es un catálogo terminado — trae los componentes confirmados con su código real, y deja marcados los que faltan definir a mano en el Spec Editor de CADWorx.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
