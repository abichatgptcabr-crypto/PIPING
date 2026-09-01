import React from "react";
import { ArrowRight, Layers } from "lucide-react";

const TOOLS = [
  {
    id: "generador",
    status: "activo",
    title: "Generador de piping class",
    desc: "Seleccioná el tipo de planta, el estándar de clases viene pre-cargado y editable. Ensamblá el código A-B-C-D y llegá a componentes, válvulas y ramificaciones.",
    meta: "ASME B31.3 · 23 clases EPF cargadas",
  },
  {
    id: "placeholder-1",
    status: "próximamente",
    title: "Registro de MTO / BOM",
    desc: "Segunda herramienta de la serie: todavía sin definir alcance.",
    meta: "sin fecha",
  },
];

export default function Home({ onOpen }) {
  return (
    <div className="bg-[#F4F7FA] text-slate-900">
      {/* hero: título como sello de plano técnico */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <div>
            <div className="text-[13px] font-mono text-[#2C568E] mb-3">HYTECH · ING. DE CAÑERÍAS</div>
            <h1 className="text-[2.6rem] sm:text-[3.6rem] leading-[0.98] font-semibold tracking-tight text-slate-900">
              Herramientas internas<br />para piping
            </h1>
            <p className="mt-5 max-w-lg text-[15px] text-slate-600 leading-relaxed">
              Un lugar donde las especificaciones que ya usamos —clases de cañería,
              nomenclatura, componentes— se pueden generar, revisar y editar
              en vez de reescribirse a mano en cada proyecto.
            </p>
          </div>

          {/* title block al estilo de un plano de ingeniería */}
          <div className="font-mono text-[11px] border border-slate-300 bg-white self-end w-full max-w-[280px] lg:w-[280px]">
            <div className="grid grid-cols-2 border-b border-slate-300">
              <div className="px-3 py-2 border-r border-slate-300 text-slate-400">PROYECTO</div>
              <div className="px-3 py-2 text-slate-700">Hytech Tools</div>
            </div>
            <div className="grid grid-cols-2 border-b border-slate-300">
              <div className="px-3 py-2 border-r border-slate-300 text-slate-400">CÓDIGO</div>
              <div className="px-3 py-2 text-slate-700">HT-TOOLS-001</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="px-3 py-2 border-r border-slate-300 text-slate-400">REV.</div>
              <div className="px-3 py-2 text-slate-700">0 · en desarrollo</div>
            </div>
          </div>
        </div>
      </section>

      {/* listado de herramientas */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="border-t border-slate-300 pt-2 mb-6 flex items-baseline justify-between">
          <h2 className="text-[13px] font-mono text-slate-500">HERRAMIENTAS</h2>
          <span className="text-[12px] text-slate-400">{TOOLS.length} en el registro</span>
        </div>

        <div className="space-y-3">
          {TOOLS.map((t) => {
            const active = t.status === "activo";
            return (
              <button
                key={t.id}
                disabled={!active}
                onClick={() => active && onOpen(t.id)}
                className={`w-full text-left grid sm:grid-cols-[auto_1fr_auto] gap-4 sm:gap-8 items-start sm:items-center px-5 py-5 border transition ${
                  active
                    ? "border-slate-300 bg-white hover:border-[#3F72AC] hover:shadow-[0_1px_0_0_rgba(0,0,0,0.02)] cursor-pointer"
                    : "border-slate-200 bg-white/40 cursor-default"
                }`}
              >
                <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${active ? "bg-[#132A4C]" : "bg-slate-200"}`}>
                  <Layers size={18} className={active ? "text-[#7FC4EE]" : "text-slate-400"} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-[16px] font-medium ${active ? "text-slate-900" : "text-slate-500"}`}>{t.title}</h3>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-slate-500 max-w-xl leading-relaxed">{t.desc}</p>
                  <div className="mt-2 text-[11px] font-mono text-slate-400">{t.meta}</div>
                </div>
                {active && (
                  <div className="hidden sm:flex items-center gap-1.5 text-[13px] text-[#1F3F6E] font-medium shrink-0">
                    Abrir <ArrowRight size={15} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
