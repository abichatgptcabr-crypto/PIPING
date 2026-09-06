import React from "react";
import { Settings, FileStack, Droplets, ChevronRight } from "lucide-react";

const TOOLS = [
  {
    id: "generador",
    status: "activo",
    title: "Generador de piping class",
    desc: "Configuración y ensamblaje de clases de cañería y componentes pre-cargados según normativas vigentes (ASME B31.3).",
    icon: Settings,
  },
  {
    id: "spec-builder",
    status: "activo",
    title: "Armar especificación",
    desc: "Consolidación de clases de más de un proyecto para exportación y emisión de especificaciones en PDF.",
    icon: FileStack,
  },
  {
    id: "service-catalog",
    status: "activo",
    title: "Catálogo de servicios",
    desc: "Todos los servicios cargados, de cualquier proyecto, agrupados por tipo, con descripción y codificación para documentos.",
    icon: Droplets,
  },
];

const lastUpdated = new Date().toLocaleDateString("es-AR");

export default function Home({ onOpen }) {
  return (
    <div className="bg-[#F4F7FA] text-slate-900">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <h1 className="font-display text-[2.6rem] sm:text-[3.4rem] leading-[1.02] font-bold text-[#113044]">
              Gestor de Especificaciones Técnicas
            </h1>
            <p className="mt-4 max-w-lg text-[15px] text-slate-600 leading-relaxed">
              Herramientas centralizadas para el diseño, configuración y emisión de especificaciones de proyecto.
            </p>
          </div>

          <div className="text-[12.5px] border border-slate-300 bg-white self-start w-full max-w-[300px] lg:w-[300px] rounded-md overflow-hidden">
            <div className="flex justify-between px-4 py-2.5 border-b border-slate-200">
              <span className="text-slate-400">VERSIÓN DEL SISTEMA:</span>
              <span className="font-medium text-slate-800">1.0</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-400">ÚLTIMA ACTUALIZACIÓN:</span>
              <span className="font-medium text-slate-800">{lastUpdated}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-[12px] font-display uppercase tracking-[0.12em] text-slate-500 mb-4">Herramientas clave</div>

        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => {
            const active = t.status === "activo";
            const Icon = t.icon;
            return (
              <div key={t.id} className={`rounded-md border p-5 transition ${active ? "border-slate-200 bg-white hover:border-[#00589E]" : "border-slate-200 bg-white/60"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-[#113044]" : "bg-slate-200"}`}>
                    <Icon size={18} className={active ? "text-[#4DA8DC]" : "text-slate-400"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-[15px] font-semibold ${active ? "text-slate-900" : "text-slate-500"}`}>{t.title}</h3>
                    <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">{t.desc}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {t.status}
                      </span>
                      <button
                        disabled={!active}
                        onClick={() => active && onOpen(t.id)}
                        className={`flex items-center gap-0.5 text-[12.5px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded border ${
                          active ? "border-[#00589E] text-[#00589E] hover:bg-[#00589E] hover:text-white" : "border-slate-200 text-slate-300 cursor-default"
                        }`}
                      >
                        Abrir <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
