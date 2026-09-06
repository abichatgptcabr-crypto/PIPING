import React, { useState, useEffect } from "react";
import { Printer, Loader2, FileWarning } from "lucide-react";
import { fetchSpecById, fetchSpecItems, fetchServiceCatalog, computeServiceCodes } from "../lib/api";
import { PrintCoverPage, PrintClassPage, ServiceIndexPage } from "./SpecBuilder";

// Vista de sólo lectura para un link compartido (?spec=<id>) — sin login,
// sin edición, pensada para mandarle a alguien que sólo necesita ver el
// documento tal como quedó guardado.
export default function ViewSpec({ specId }) {
  const [state, setState] = useState({ loading: true, error: "", docMeta: null, items: [] });
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    fetchServiceCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);
  const codes = React.useMemo(() => computeServiceCodes(catalog), [catalog]);

  useEffect(() => {
    (async () => {
      try {
        const spec = await fetchSpecById(specId);
        const classes = await fetchSpecItems(specId);
        setState({
          loading: false, error: "",
          docMeta: {
            title: spec.title, project: spec.project, client: spec.client || "",
            docNumber: spec.doc_number, revision: spec.revision, company: spec.company,
            confidential: spec.confidential, serviceCoding: spec.service_coding, date: spec.date,
          },
          items: classes.map((c) => ({ plantName: "—", item: {
            id: c.id, code: c.code, fam: c.fam, mat: c.mat, corr: c.corr, rating: c.rating,
            design: c.design, services: c.services, page: c.page, detail: c.detail,
            reviewedBy: c.reviewed_by, reviewedAt: c.reviewed_at, reviewedAgainst: c.reviewed_against,
          } })),
        });
      } catch (e) {
        setState({ loading: false, error: "No se encontró esa especificación (puede haber sido borrada, o el link está mal copiado).", docMeta: null, items: [] });
      }
    })();
  }, [specId]);

  if (state.loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm gap-2"><Loader2 size={16} className="animate-spin" /> Cargando especificación…</div>;
  }
  if (state.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 text-sm gap-2 px-6 text-center">
        <FileWarning size={28} className="text-slate-300" />
        {state.error}
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="print:hidden sticky top-0 z-10 bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
        <span className="text-[13px] text-slate-300">Vista de sólo lectura — {state.docMeta.title}</span>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[13px] bg-[#2C568E] hover:bg-[#1F3F6E] px-3 py-1.5 rounded-md font-medium">
          <Printer size={15} /> Imprimir / Guardar como PDF
        </button>
      </div>
      <div className="max-w-[850px] mx-auto py-6 print:py-0 print:max-w-none">
        <PrintCoverPage docMeta={state.docMeta} items={state.items} />
        {state.items.map((s, i) => (
          <PrintClassPage key={s.item.id} item={s.item} plantName={s.plantName} docMeta={state.docMeta} index={i} total={state.items.length} />
        ))}
        {state.docMeta.serviceCoding && <ServiceIndexPage items={state.items} catalog={catalog} codes={codes} />}
      </div>
      <style>{`
        @media print {
          @page { size: letter; margin: 14mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-page { page-break-after: always; padding: 4mm; overflow: hidden; }
        .print-page:last-child { page-break-after: auto; }
      `}</style>
    </div>
  );
}
