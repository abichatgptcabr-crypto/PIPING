import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardList, PackageCheck, Flame, Wrench, Gauge, Droplets, PaintBucket,
  Thermometer, ClipboardCheck, ShieldCheck, ChevronDown, ChevronUp, RotateCcw,
} from "lucide-react";

const STORAGE_KEY = "hytech-tools-checklist-obra";

// Mismo contenido del checklist de obra (piping, mirada Owner) que ya armamos
// como doc — acá vive como data para poder tildar y calcular % de avance.
const CHECKLIST_DATA = [
  {
    id: "pre-obra",
    title: "Pre-movilización",
    icon: ClipboardList,
    accent: "#113044",
    items: [
      "Isométricos y P&IDs AFC vigentes, sin mezcla de revisiones",
      "Piping class de cada línea confirmada contra el line list",
      "WPS aprobados y vigentes para materiales/espesores de la obra",
      "WPQ de soldadores vigente",
      "ITP aprobado con hold points definidos",
      "MTO aprobado vs. lo comprado",
      "Certificados de materiales (MTR) disponibles",
      "Procedimiento de manejo y almacenaje definido",
    ],
  },
  {
    id: "recepcion",
    title: "Recepción de materiales",
    icon: PackageCheck,
    accent: "#00589E",
    items: [
      "Heat number verificado contra certificado",
      "Inspección visual de daños de transporte",
      "Almacenaje segregado por spec y diámetro",
      "Válvulas protegidas y en posición correcta",
      "Bulonería y juntas bajo techo",
    ],
  },
  {
    id: "prefab",
    title: "Prefabricación / fit-up",
    icon: Wrench,
    accent: "#00406E",
    items: [
      "Corte y biselado según WPS",
      "Alineación y gap de raíz dentro de tolerancia",
      "Spool identificado y trazable al isométrico",
      "Soldador identificado en cada junta",
      "Precalentamiento registrado cuando aplica",
    ],
  },
  {
    id: "soldadura",
    title: "Soldadura y NDE",
    icon: Flame,
    accent: "#4DA8DC",
    items: [
      "VT de cada junta antes de NDE",
      "% de RT/UT según spec cumplido",
      "Reportes de NDE firmados, sin rechazos pendientes",
      "Repair map actualizado",
      "PWHT con carta de registro, cuando aplica",
    ],
  },
  {
    id: "montaje",
    title: "Montaje e izaje",
    icon: ShieldCheck,
    accent: "#113044",
    items: [
      "Soportería instalada según isométrico",
      "Guías y anclajes verificados",
      "Flexibilidad de línea respetada",
      "Torque de bulonería según tabla",
      "Juntas correctas por spec",
    ],
  },
  {
    id: "hidraulica",
    title: "Prueba hidráulica",
    icon: Gauge,
    accent: "#00589E",
    items: [
      "Procedimiento de prueba aprobado",
      "Manómetros calibrados",
      "Líneas aisladas correctamente",
      "Venteo de aire completo antes de presurizar",
      "Registro de prueba firmado, sin caída",
      "Punch list de fugas cerrado",
    ],
  },
  {
    id: "limpieza",
    title: "Limpieza y flushing",
    icon: Droplets,
    accent: "#00406E",
    items: [
      "Método de limpieza definido por servicio",
      "Velocidad de flushing según spec",
      "Elementos sensibles removidos o bypaseados",
      "Criterio de aceptación verificado",
    ],
  },
  {
    id: "pintura",
    title: "Pintura y recubrimiento",
    icon: PaintBucket,
    accent: "#4DA8DC",
    items: [
      "Preparación de superficie según spec",
      "Condiciones ambientales dentro de rango",
      "DFT medido y registrado por capa",
      "Daños reparados antes de aislar",
    ],
  },
  {
    id: "aislacion",
    title: "Aislación",
    icon: Thermometer,
    accent: "#113044",
    items: [
      "Espesor según cálculo térmico o de protección",
      "Barrera de vapor sellada en líneas frías",
      "Terminación sin filtraciones de agua",
      "Puntos de venteo/drenaje no aislados sin criterio",
    ],
  },
  {
    id: "punchlist",
    title: "Walkdown / punch list",
    icon: ClipboardCheck,
    accent: "#00589E",
    items: [
      "Recorrido físico contra isométrico as-built",
      "Identificación (tags, flujo) instalada y legible",
      "Punch list categorizado A/B/C",
      "Fotos de respaldo de cada punto",
    ],
  },
  {
    id: "completion",
    title: "Mechanical completion",
    icon: ShieldCheck,
    accent: "#00406E",
    items: [
      "Dossier de calidad completo",
      "Planos as-built entregados",
      "Punch list categoría A cerrada al 100%",
      "Acta de mechanical completion firmada",
    ],
  },
];

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function ChecklistObra() {
  const [obra, setObra] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [checked, setChecked] = useState({});
  const [openSection, setOpenSection] = useState(CHECKLIST_DATA[0].id);
  const [loaded, setLoaded] = useState(false);

  // Carga lo guardado en este dispositivo (celu/PC) — cada uno guarda su
  // propio avance localmente, no hay backend compartido para esto todavía.
  useEffect(() => {
    const stored = readStored();
    setObra(stored.obra || "");
    setProyecto(stored.proyecto || "");
    setChecked(stored.checked || {});
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return; // no pisar lo guardado con el estado inicial vacío
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ obra, proyecto, checked }));
  }, [obra, proyecto, checked, loaded]);

  const totalItems = useMemo(() => CHECKLIST_DATA.reduce((s, sec) => s + sec.items.length, 0), []);
  const totalChecked = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const progressPct = totalItems ? Math.round((totalChecked / totalItems) * 100) : 0;

  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));

  const resetAll = () => {
    if (!window.confirm("¿Reiniciar el checklist completo? Se pierden todos los tildes (obra y N° de proyecto se mantienen).")) return;
    setChecked({});
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Obra asignada / N° de proyecto */}
      <div className="rounded-md bg-[#113044] p-5 sm:p-6 mb-6">
        <div className="text-[11px] font-display uppercase tracking-[0.2em] text-[#4DA8DC] mb-3">Checklist de obra · Piping</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/50 mb-1">Obra asignada</label>
            <input
              value={obra}
              onChange={(e) => setObra(e.target.value)}
              placeholder="Ej: Sal de Vida — IB Repulping"
              className="w-full px-3 py-2 text-[14px] rounded-md bg-white/10 placeholder-white/30 text-white focus:outline-none focus:bg-white/15"
            />
          </div>
          <div>
            <label className="block text-[11px] text-white/50 mb-1">N° de proyecto</label>
            <input
              value={proyecto}
              onChange={(e) => setProyecto(e.target.value)}
              placeholder="Ej: SDV1-2300-HYT"
              className="w-full px-3 py-2 text-[14px] rounded-md bg-white/10 placeholder-white/30 text-white focus:outline-none focus:bg-white/15"
            />
          </div>
        </div>
      </div>

      {/* Avance general */}
      <div className="rounded-md border border-slate-200 bg-white shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-slate-600">Avance general</span>
          <span className="text-[20px] font-display font-bold text-[#00589E]">{progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-[#00589E] transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{totalChecked} de {totalItems} puntos verificados</span>
          <button onClick={resetAll} className="flex items-center gap-1 hover:text-red-500">
            <RotateCcw size={11} /> Reiniciar
          </button>
        </div>
      </div>

      {/* Botonera de secciones — cada una con ícono, % propio, y se despliega
          para tildar sus puntos */}
      <div className="grid sm:grid-cols-2 gap-3">
        {CHECKLIST_DATA.map((sec) => {
          const Icon = sec.icon;
          const doneInSec = sec.items.filter((_, i) => checked[`${sec.id}-${i}`]).length;
          const secPct = Math.round((doneInSec / sec.items.length) * 100);
          const open = openSection === sec.id;
          return (
            <div key={sec.id} className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenSection(open ? null : sec.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50"
              >
                <div className="w-11 h-11 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: sec.accent }}>
                  <Icon size={20} className="text-[#4DA8DC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#113044] truncate">{sec.title}</div>
                  <div className="text-[11px] text-slate-400">{doneInSec} / {sec.items.length} · {secPct}%</div>
                </div>
                {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>
              {open && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                  {sec.items.map((item, i) => {
                    const key = `${sec.id}-${i}`;
                    return (
                      <label key={key} className="flex items-start gap-2.5 text-[13px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!checked[key]}
                          onChange={() => toggle(key)}
                          className="mt-0.5 accent-[#00589E] w-4 h-4 shrink-0"
                        />
                        <span className={checked[key] ? "line-through text-slate-300" : ""}>{item}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
