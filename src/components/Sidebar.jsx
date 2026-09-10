import React, { useState, useMemo } from "react";
import {
  Home, Settings, FileStack, Droplets, HardDrive, Search, ChevronRight, Menu, X, HelpCircle,
} from "lucide-react";

const PAGES = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "generador", label: "Generador de piping class", icon: Settings },
  { id: "spec-builder", label: "Armar especificación", icon: FileStack },
  { id: "service-catalog", label: "Catálogo de servicios", icon: Droplets },
  { id: "cadworx-export", label: "Generar SPEC CADWorx", icon: HardDrive },
  { id: "help", label: "Ayuda", icon: HelpCircle },
];

// Funciones buscables — no todas tienen página propia, así que cada una
// apunta a la página donde vive y explica en una línea dónde encontrarla.
const FEATURES = [
  { q: "comparar clase comparar spec", title: "Comparar clases", desc: "Botón \"Comparar clases\" arriba a la derecha, dentro del Generador — elegís dos clases y las ves lado a lado.", page: "generador" },
  { q: "revisar revisado marcar revision", title: "Marcar clase como revisada", desc: "Ícono de escudo en cada tarjeta del Generador, o en el borrador de Armar especificación.", page: "generador" },
  { q: "editar clase detalle", title: "Editar una clase", desc: "Abrí cualquier clase del Generador y tocá \"Editar\".", page: "generador" },
  { q: "nueva planta proyecto", title: "Crear un proyecto nuevo", desc: "Botón \"+\" al lado de las pestañas de proyecto, arriba del Generador.", page: "generador" },
  { q: "plantilla selección reutilizable", title: "Plantillas de selección", desc: "En Armar especificación, guardá un conjunto de clases elegidas para reutilizarlo en otra spec.", page: "spec-builder" },
  { q: "perfil cliente logo", title: "Perfiles de cliente", desc: "Botón \"Perfiles\" al lado de \"Cliente destinatario\", en Armar especificación.", page: "spec-builder" },
  { q: "firma preparado revisado aprobado", title: "Firmas del documento", desc: "Campos de Preparado/Revisado/Aprobado por, en el formulario de Armar especificación.", page: "spec-builder" },
  { q: "historial revision cambios", title: "Historial de revisiones", desc: "Aparece en la portada del PDF cuando el N° de documento ya tiene revisiones guardadas — se completa desde Armar especificación.", page: "spec-builder" },
  { q: "compartir link qr", title: "Compartir por link / QR", desc: "En \"Specs guardadas\", ícono de link al lado de cada revisión.", page: "spec-builder" },
  { q: "agrupar servicio proyecto", title: "Agrupar por servicio o por proyecto", desc: "Botones arriba del buscador de clases, en Armar especificación.", page: "spec-builder" },
  { q: "excel exportar descargar", title: "Descargar Excel", desc: "Botón \"Descargar Excel\" en el Borrador de Armar especificación.", page: "spec-builder" },
  { q: "codigo servicio catalogo", title: "Código de un servicio", desc: "Cada servicio tiene un código estable, visible en el Catálogo de servicios.", page: "service-catalog" },
  { q: "cadworx spec 3d", title: "Generar SPEC para CADWorx", desc: "Elegí una spec guardada y generá un borrador de catálogo con componentes confirmados.", page: "cadworx-export" },
];

export default function Sidebar({ currentPage, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return FEATURES.filter((f) => (f.q + " " + f.title + " " + f.desc).toLowerCase().includes(needle)).slice(0, 6);
  }, [q]);

  const show = open || pinned;

  return (
    <>
      {/* franja invisible a la izquierda: pasar el mouse ahí abre el menú */}
      <div
        className="fixed left-0 top-0 h-full w-3 z-50 hidden sm:block"
        onMouseEnter={() => setOpen(true)}
      />
      {/* pestañita siempre visible, para tocar en mobile */}
      <button
        onClick={() => setPinned((p) => !p)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-[#00589E] text-white rounded-r-md p-1.5 shadow-md sm:hidden"
        aria-label="Abrir menú"
      >
        {pinned ? <X size={16} /> : <Menu size={16} />}
      </button>

      {show && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => { setOpen(false); setPinned(false); }}
        >
          <div
            className="absolute left-0 top-0 h-full w-[300px] bg-[#113044] text-white shadow-2xl flex flex-col"
            onMouseLeave={() => setOpen(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-white/40" />
                <input
                  value={q} onChange={(e) => setQ(e.target.value)}
                  placeholder="¿Qué puedo hacer? (ej: comparar clases)"
                  className="w-full pl-8 pr-2 py-1.5 text-[12.5px] rounded-md bg-white/10 placeholder-white/40 text-white focus:outline-none focus:bg-white/15"
                />
              </div>
              {results.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.map((r) => (
                    <button
                      key={r.title}
                      onClick={() => { onNavigate(r.page); setQ(""); setOpen(false); setPinned(false); }}
                      className="w-full text-left px-2.5 py-2 rounded-md bg-white/5 hover:bg-white/10"
                    >
                      <div className="text-[12.5px] font-medium flex items-center gap-1">{r.title} <ChevronRight size={11} className="text-white/40" /></div>
                      <div className="text-[11px] text-white/60 mt-0.5 leading-snug">{r.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="flex-1 py-2">
              {PAGES.map((p) => {
                const Icon = p.icon;
                const active = currentPage === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { onNavigate(p.id); setOpen(false); setPinned(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] ${active ? "bg-white/10 text-white font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    <Icon size={15} /> {p.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
