import React, { useState, useEffect } from "react";
import { Settings, FileStack, Droplets, HardDrive, ChevronRight, Layers, Building2 } from "lucide-react";
import { fetchStats } from "../lib/api";

const TAGLINES = [
  "Generá clases de cañería en minutos, no en horas.",
  "Compará dos clases lado a lado y encontrá la diferencia al toque.",
  "Armá una spec para un cliente nuevo con plantillas ya cargadas.",
  "Cada revisión guardada queda congelada — nunca cambia sola.",
  "Un solo catálogo de servicios para todos los proyectos.",
];

function CountUp({ target }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) { setN(0); return; }
    const duration = 700;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); // ease-out
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{n}</>;
}

const TOOLS = [
  {
    id: "generador",
    status: "activo",
    title: "Generador de piping class",
    desc: "Configuración y ensamblaje de clases de cañería y componentes pre-cargados según normativas vigentes (ASME B31.3).",
    icon: Settings,
    accent: "#113044",
  },
  {
    id: "spec-builder",
    status: "activo",
    title: "Armar especificación",
    desc: "Consolidación de clases de más de un proyecto para exportación y emisión de especificaciones en PDF.",
    icon: FileStack,
    accent: "#00589E",
  },
  {
    id: "service-catalog",
    status: "activo",
    title: "Catálogo de servicios",
    desc: "Todos los servicios cargados, de cualquier proyecto, agrupados por tipo, con descripción y codificación para documentos.",
    icon: Droplets,
    accent: "#00406E",
  },
  {
    id: "cadworx-export",
    status: "activo",
    title: "Generar SPEC CADWorx",
    desc: "Elegí una especificación ya guardada y generá un borrador de catálogo para CADWorx, con los componentes confirmados contra catálogos reales.",
    icon: HardDrive,
    accent: "#4DA8DC",
  },
];

const lastUpdated = new Date().toLocaleDateString("es-AR");

export default function Home({ onOpen }) {
  const [tagIndex, setTagIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTagIndex((i) => (i + 1) % TAGLINES.length);
        setFade(true);
      }, 350);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

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
            <div className="mt-3 h-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00589E] shrink-0" />
              <p className={`max-w-lg text-[13px] font-medium text-[#00589E] transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
                {TAGLINES[tagIndex]}
              </p>
            </div>
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

      {stats && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              [Layers, "Clases cargadas", stats.classCount],
              [FileStack, "Specs armadas", stats.specCount],
              [Droplets, "Servicios en catálogo", stats.serviceCount],
              [Building2, "Proyectos", stats.plantCount],
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                <Icon size={18} className="text-[#00589E] shrink-0" />
                <div>
                  <div className="font-display text-[22px] font-bold leading-none text-[#113044]"><CountUp target={value} /></div>
                  <div className="text-[11px] text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-[12px] font-display uppercase tracking-[0.12em] text-slate-500 mb-4">Herramientas clave</div>

        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => {
            const active = t.status === "activo";
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                disabled={!active}
                onClick={() => active && onOpen(t.id)}
                style={active ? { borderTopColor: t.accent } : undefined}
                className={`group relative text-left rounded-md border border-t-[3px] p-5 transition-all duration-200 ${
                  active
                    ? "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                    : "border-slate-200 bg-white/60 cursor-default"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 ${active ? "group-hover:scale-105" : "bg-slate-200"}`}
                    style={active ? { backgroundColor: t.accent } : undefined}
                  >
                    <Icon size={20} className={active ? "text-[#4DA8DC]" : "text-slate-400"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-[15px] font-semibold ${active ? "text-slate-900" : "text-slate-500"}`}>{t.title}</h3>
                    <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">{t.desc}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {t.status}
                      </span>
                      {active && (
                        <span className="flex items-center gap-0.5 text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: t.accent }}>
                          Abrir <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
