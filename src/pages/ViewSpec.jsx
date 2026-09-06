import React, { useState, useEffect, useMemo } from "react";
import { Printer, Loader2, FileWarning } from "lucide-react";
import { fetchSpecById, fetchSpecItems, fetchServiceCatalog, computeServiceCodes } from "../lib/api";
import { PrintCoverPage, PrintClassPage, ServiceIndexPage } from "./SpecBuilder";
import QRCode from "qrcode";

// Vista de sólo lectura para un link compartido (?spec=<id>) — sin login,
// sin edición, pensada para mandarle a alguien que sólo necesita ver el
// documento tal como quedó guardado.
export default function ViewSpec({ specId }) {
  const [state, setState] = useState({ loading: true, error: "", docMeta: null, items: [] });
  const [catalog, setCatalog] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    fetchServiceCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);
  const codes = useMemo(() => computeServiceCodes(catalog), [catalog]);

  useEffect(() => {
    const url = `${window.location.origin}${window.location.pathname}?spec=${specId}`;
    QRCode.toDataURL(url, { margin: 1, width: 160 }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [specId]);

  useEffect(() => {
    (async () => {
      try {
        const spec = await fetchSpecById(specId);
        const rows = await fetchSpecItems(specId);
        setState({
          loading: false, error: "",
          docMeta: {
            title: spec.title, project: spec.project, client: spec.client || "",
            docNumber: spec.doc_number, revision: spec.revision, company: spec.company,
            confidential: spec.confidential, serviceCoding: spec.service_coding, date: spec.date,
            preparedBy: spec.prepared_by || "", preparedDate: spec.prepared_date || "",
            checkedBy: spec.checked_by || "", checkedDate: spec.checked_date || "",
            approvedBy: spec.approved_by || "", approvedDate: spec.approved_date || "",
            clientLogoUrl: spec.client_logo_url || "",
          },
          items: rows.map((r) => (r.plantName ? r : { plantName: "—", item: r.item })),
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
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-[13px] bg-[#00589E] hover:bg-[#00406E] px-3 py-1.5 rounded-md font-medium">
          <Printer size={15} /> Imprimir / Guardar como PDF
        </button>
      </div>
      <div className="max-w-[850px] mx-auto py-6 print:py-0 print:max-w-none">
        <PrintCoverPage docMeta={state.docMeta} items={state.items} qrDataUrl={qrDataUrl} />
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
        .print-page { page-break-after: always; padding: 4mm; }
        .print-page:last-child { page-break-after: auto; }
        .print-page table { page-break-inside: auto; }
        .print-page tr { page-break-inside: avoid; }
      `}</style>
    </div>
  );
}
