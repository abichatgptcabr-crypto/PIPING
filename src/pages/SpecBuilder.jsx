import React, { useState, useMemo } from "react";
import {
  FileStack, Search, X, Printer, ArrowLeft, Building2,
  CheckSquare, Square, FileWarning,
} from "lucide-react";
import { SEED_PLANTS, FAMILIES, ratingLevel, COMP_COLS, VALVE_COLS } from "../data/plants";

/* ═══════════════════════════ Selector cross-planta ═══════════════════════ */
function PlantColumn({ plant, selectedCodes, onToggle, q }) {
  const filtered = plant.classes.filter((k) => {
    if (!q) return true;
    const hay = (k.code + " " + k.services.join(" ") + " " + k.mat).toLowerCase();
    return hay.includes(q.toLowerCase());
  });
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
        <div className="grid sm:grid-cols-2 gap-1.5">
          {filtered.map((k) => {
            const id = plant.id + "::" + k.code;
            const checked = selectedCodes.has(id);
            return (
              <button
                key={id}
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
                </span>
              </button>
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

function PrintClassPage({ item, plantName, docMeta, index, total }) {
  const d = item.detail;
  return (
    <section className="print-page">
      <header className="flex justify-between items-start border-b-2 border-black pb-2 mb-3">
        <div>
          <div className="text-[15px] font-bold uppercase">{docMeta.title || "Piping Class"}</div>
          <div className="text-[10px] text-slate-600">Technical Specification</div>
        </div>
        <div className="text-right text-[9px] font-mono">
          <div>DOCUMENTO Nº: {docMeta.docNumber || "—"}</div>
          <div>REVISIÓN: {docMeta.revision || "0"}</div>
          <div>Clase {index + 1} de {total}</div>
        </div>
      </header>

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
      <div className="text-[9px] mb-3"><b>SERVICE:</b> {item.services.join(" / ")}</div>
      <div className="text-[9px] mb-3 text-slate-500">Origen: {plantName} · clase {item.code}{item.page ? ` · pág. ${item.page} doc. fuente` : ""}</div>

      {!d ? (
        <div className="border border-black p-3 text-[10px] flex items-start gap-2">
          <FileWarning size={14} className="shrink-0 mt-0.5" />
          Esta clase no tiene el detalle de componentes/válvulas/ramificaciones transcripto todavía —
          sólo se incluye el resumen. Consultar el documento fuente para el detalle completo.
        </div>
      ) : (
        <>
          <div className="bg-black text-white text-[10px] font-bold px-2 py-1 mb-1">PIPING CLASS COMPONENTS</div>
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
    </section>
  );
}

function PrintCoverPage({ docMeta, items }) {
  return (
    <section className="print-page">
      <div className="border-2 border-black h-full flex flex-col">
        <div className="border-b-2 border-black p-6 text-center">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">{docMeta.company || "Hytech"}</div>
          <div className="text-[26px] font-bold uppercase mb-1">{docMeta.title || "Piping Class"}</div>
          <div className="text-[13px] text-slate-600">Technical Specification</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-[9px] text-slate-400 border-t border-black">
          Documento armado con el Generador de piping class de Hytech Tools — combina clases de más de un proyecto/estándar base. Verificar compatibilidad de códigos y condiciones de diseño antes de emitir para construcción.
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════ Página principal ═══════════════════════ */
export default function SpecBuilder() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]); // [{ plantId, plantName, item }]
  const [mode, setMode] = useState("build"); // 'build' | 'print'
  const [docMeta, setDocMeta] = useState({
    title: "Piping Class", project: "", docNumber: "", revision: "0",
    company: "Hytech", date: new Date().toLocaleDateString("es-AR"),
  });

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.plantId + "::" + s.item.code)), [selected]);

  const toggle = (plant, item) => {
    const id = plant.id + "::" + item.code;
    setSelected((sel) =>
      sel.some((s) => s.plantId + "::" + s.item.code === id)
        ? sel.filter((s) => s.plantId + "::" + s.item.code !== id)
        : [...sel, { plantId: plant.id, plantName: plant.name, item }]
    );
  };
  const remove = (plantId, code) =>
    setSelected((sel) => sel.filter((s) => !(s.plantId === plantId && s.item.code === code)));

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
            <PrintClassPage key={s.plantId + s.item.code} item={s.item} plantName={s.plantName} docMeta={docMeta} index={i} total={selected.length} />
          ))}
        </div>
        <style>{`
          @media print {
            @page { size: letter; margin: 14mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          .print-page { page-break-after: always; padding: 4mm; }
          .print-page:last-child { page-break-after: auto; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileStack size={18} className="text-[#2C568E]" />
            <h2 className="text-[16px] font-semibold text-slate-900">Armar especificación</h2>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">
            Elegí clases de cualquiera de los proyectos cargados para armar un documento nuevo. Se puede combinar EPF y La Calera en la misma spec.
          </p>
          <div className="relative mb-5">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar clase, servicio o material…"
              className="w-full pl-8 pr-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:border-[#2C568E] focus:outline-none bg-white" />
          </div>
          {SEED_PLANTS.map((p) => (
            <PlantColumn key={p.id} plant={p} selectedCodes={selectedIds} onToggle={toggle} q={q} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[12px] font-semibold text-slate-700 mb-3">Datos del documento</div>
            <div className="space-y-2">
              {[
                ["title", "Título"], ["project", "Proyecto"], ["docNumber", "N° de documento"],
                ["revision", "Revisión"], ["company", "Empresa"], ["date", "Fecha"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400">{label}</label>
                  <input value={docMeta[key]} onChange={(e) => setDocMeta({ ...docMeta, [key]: e.target.value })}
                    className="w-full text-[13px] px-2 py-1.5 border border-slate-200 rounded-md focus:border-[#2C568E] focus:outline-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-slate-700">Borrador ({selected.length})</span>
            </div>
            {selected.length === 0 ? (
              <div className="text-[12px] text-slate-400">Todavía no elegiste ninguna clase.</div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {selected.map((s) => (
                  <div key={s.plantId + s.item.code} className="flex items-center justify-between gap-2 text-[12px] px-2 py-1.5 rounded-md bg-slate-50">
                    <span className="min-w-0 truncate"><span className="font-mono font-semibold">{s.item.code}</span> <span className="text-slate-400">· {s.plantName.split(" · ")[0]}</span></span>
                    <button onClick={() => remove(s.plantId, s.item.code)} className="text-slate-300 hover:text-red-500 shrink-0"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            <button
              disabled={selected.length === 0}
              onClick={() => setMode("print")}
              className="w-full mt-4 flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E] disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Printer size={14} /> Generar vista de documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
