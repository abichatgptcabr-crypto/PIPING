import React, { useState, useEffect } from "react";
import { Layers, FileStack, Droplets, Building2, ChevronLeft, Settings, Calculator, ClipboardCheck, ChevronRight } from "lucide-react";
import { fetchStats } from "../lib/api";

const TAGLINES = [
  "Generá clases de cañería en minutos, no en horas.",
  "Compará dos clases lado a lado y encontrá la diferencia al toque.",
  "Armá una spec para un cliente nuevo con plantillas ya cargadas.",
  "Cada revisión guardada queda congelada — nunca cambia sola.",
  "Un solo catálogo de servicios para todos los proyectos.",
];

// statKey referencia una clave de fetchStats() — la tarjeta le suma un
// número en vivo al costado para que no quede vacía, cuando ese dato existe.
const TOOLS = [
  { id: "generador", title: "Generador de piping class", desc: "Registro completo de clases, edición, comparador y control de revisión.", icon: Settings, accent: "#113044", statKey: "classCount", statLabel: "Clases" },
  { id: "spec-builder", title: "Armar especificación", desc: "Elegí clases de cualquier proyecto y armá el documento para el cliente.", icon: FileStack, accent: "#00589E", statKey: "specCount", statLabel: "Specs" },
  { id: "service-catalog", title: "Catálogo de servicios", desc: "Todos los servicios, agrupados y codificados para los documentos.", icon: Droplets, accent: "#00406E", statKey: "serviceCount", statLabel: "Servicios" },
  { id: "mto-builder", title: "Generar MTO", desc: "Subí el crudo exportado de CADWorx y armá el MTO consolidado, clasificado y traducido a la nomenclatura de Hytech.", icon: Calculator, accent: "#4DA8DC" },
  { id: "checklist-obra", title: "Checklist de obra", desc: "Obra asignada, N° de proyecto, y el checklist de piping por etapa con % de avance en vivo.", icon: ClipboardCheck, accent: "#00589E" },
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
      {/* Hero de punta a punta — grilla técnica + dos manchas de color para
          que no quede un bloque plano vacío, y las estadísticas metidas
          adentro (no como una fila suelta más abajo) */}
      <div className="relative bg-[#113044] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#00589E] opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#4DA8DC] opacity-10 blur-3xl" />

        <div className="relative flex flex-col items-center justify-center text-center px-4 pt-16 pb-10">
          <div className="text-[12px] font-display uppercase tracking-[0.25em] text-[#4DA8DC] mb-4">Hytech Tools</div>
          <h1 className="font-display text-[2.4rem] sm:text-[3.8rem] leading-[1.02] font-bold text-white max-w-4xl">
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

          <div className="mt-8 flex items-center gap-2 text-[13px] text-white/50 animate-pulse">
            <ChevronLeft size={16} className="text-[#4DA8DC]" />
            Elegí una herramienta en el menú del borde izquierdo
          </div>
        </div>

        {/* Estadísticas en vivo, dentro del hero — llenan el espacio y se ven
            de un vistazo apenas entrás */}
        {stats && (
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [Layers, "Clases cargadas", stats.classCount],
                [FileStack, "Specs armadas", stats.specCount],
                [Droplets, "Servicios en catálogo", stats.serviceCount],
                [Building2, "Proyectos", stats.plantCount],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-md bg-white/[0.06] border border-white/10 px-4 py-3.5 flex items-center gap-3">
                  <Icon size={18} className="text-[#4DA8DC] shrink-0" />
                  <div className="text-left">
                    <div className="font-display text-[22px] font-bold leading-none text-white"><CountUp target={value} /></div>
                    <div className="text-[10.5px] text-white/50">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botonera de herramientas — tarjetas horizontales densas (ícono +
          texto + número en vivo cuando hay dato), sin espacio muerto */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const statValue = t.statKey && stats ? stats[t.statKey] : null;
            return (
              <button
                key={t.id}
                onClick={() => onOpen(t.id)}
                className="group relative text-left rounded-md border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 pl-5 pr-4 py-4 flex items-center gap-4 overflow-hidden"
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: t.accent }} />
                <div className="w-[52px] h-[52px] rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: t.accent }}>
                  <Icon size={24} className="text-[#4DA8DC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[15.5px] font-bold uppercase tracking-wide text-[#113044]">{t.title}</h3>
                  <p className="mt-0.5 text-[12.5px] text-slate-500 leading-snug">{t.desc}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: t.accent }}>
                    Abrir <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
                {statValue != null && (
                  <div className="hidden sm:flex flex-col items-center justify-center shrink-0 pl-4 ml-1 border-l border-slate-100 min-w-[64px]">
                    <div className="font-display text-[22px] font-bold text-[#113044] leading-none"><CountUp target={statValue} /></div>
                    <div className="text-[9.5px] text-slate-400 uppercase tracking-wide mt-1 whitespace-nowrap">{t.statLabel}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}