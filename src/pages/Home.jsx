import React, { useState, useEffect } from "react";
import { Layers, FileStack, Droplets, Building2, ChevronLeft, Settings, HardDrive, ChevronRight } from "lucide-react";
import { fetchStats } from "../lib/api";

const TAGLINES = [
  "Generá clases de cañería en minutos, no en horas.",
  "Compará dos clases lado a lado y encontrá la diferencia al toque.",
  "Armá una spec para un cliente nuevo con plantillas ya cargadas.",
  "Cada revisión guardada queda congelada — nunca cambia sola.",
  "Un solo catálogo de servicios para todos los proyectos.",
];

const TOOLS = [
  { id: "generador", title: "Generador de piping class", desc: "Registro completo de clases, edición, comparador y control de revisión.", icon: Settings, accent: "#113044" },
  { id: "spec-builder", title: "Armar especificación", desc: "Elegí clases de cualquier proyecto y armá el documento para el cliente.", icon: FileStack, accent: "#00589E" },
  { id: "service-catalog", title: "Catálogo de servicios", desc: "Todos los servicios, agrupados y codificados para los documentos.", icon: Droplets, accent: "#00406E" },
  { id: "cadworx-export", title: "Generar SPEC CADWorx", desc: "Convertí una especificación guardada en un borrador de catálogo para CADWorx.", icon: HardDrive, accent: "#4DA8DC" },
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
    <div className="bg-white text-slate-900">
      {/* Hero de punta a punta, oscuro, con textura técnica sutil */}
      <div className="relative bg-[#113044] overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#00589E] opacity-20 blur-3xl" />

        <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
          <div className="text-[12px] font-display uppercase tracking-[0.25em] text-[#4DA8DC] mb-4">Hytech Tools</div>
          <h1 className="font-display text-[2.8rem] sm:text-[4.5rem] leading-[1.02] font-bold text-white max-w-4xl">
            Gestor de Especificaciones Técnicas
          </h1>
          <p className="mt-5 max-w-lg text-[15px] text-white/70 leading-relaxed">
            Herramientas centralizadas para el diseño, configuración y emisión de especificaciones de proyecto.
          </p>

          <div className="mt-5 h-6 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4DA8DC] shrink-0" />
            <p className={`max-w-lg text-[13px] font-medium text-[#4DA8DC] transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}>
              {TAGLINES[tagIndex]}
            </p>
          </div>

          <div className="mt-12 flex items-center gap-2 text-[13px] text-white/50 animate-pulse">
            <ChevronLeft size={16} className="text-[#4DA8DC]" />
            Elegí una herramienta en el menú del borde izquierdo
          </div>
        </div>
      </div>

      {/* Cuadrados grandes para elegir herramienta */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onOpen(t.id)}
                style={{ borderTopColor: t.accent }}
                className="group text-left aspect-square sm:aspect-[4/3] rounded-md border border-t-[4px] border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-6 flex flex-col justify-between"
              >
                <div className="w-14 h-14 rounded-md flex items-center justify-center transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: t.accent }}>
                  <Icon size={26} className="text-[#4DA8DC]" />
                </div>
                <div>
                  <h3 className="font-display text-[20px] font-bold uppercase tracking-wide text-[#113044]">{t.title}</h3>
                  <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">{t.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold uppercase tracking-wide" style={{ color: t.accent }}>
                    Abrir <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Estadísticas en vivo */}
      {stats && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              [Layers, "Clases cargadas", stats.classCount],
              [FileStack, "Specs armadas", stats.specCount],
              [Droplets, "Servicios en catálogo", stats.serviceCount],
              [Building2, "Proyectos", stats.plantCount],
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white shadow-md px-4 py-4 flex items-center gap-3">
                <Icon size={18} className="text-[#00589E] shrink-0" />
                <div className="text-left">
                  <div className="font-display text-[22px] font-bold leading-none text-[#113044]"><CountUp target={value} /></div>
                  <div className="text-[10.5px] text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
