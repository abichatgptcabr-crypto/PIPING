import React, { useState, useMemo } from "react";
import { HelpCircle, Search, ChevronDown, Home, Settings, FileStack, Droplets, HardDrive } from "lucide-react";

const SECTIONS = [
  {
    id: "general", title: "General", icon: Home,
    items: [
      { q: "¿Necesito usuario para entrar?", a: "Sí, una contraseña compartida del equipo más tu nombre — no es un login individual, es para que no entre cualquiera que se cruce el link." },
      { q: "¿Quién puede ver lo que cargo?", a: "Todo el equipo que tenga la contraseña ve los mismos datos, en vivo — no es privado por persona." },
      { q: "¿Cómo encuentro rápido una función?", a: "Pasá el mouse por el borde izquierdo de la pantalla (o tocá la pestañita en el celular) para abrir el menú, y usá el buscador de arriba." },
    ],
  },
  {
    id: "generador", title: "Generador de piping class", icon: Settings,
    items: [
      { q: "¿Cómo edito una clase?", a: "Abrí la clase (click en su tarjeta) y tocá \"Editar\". Podés cambiar material, condiciones, componentes, válvulas y notas." },
      { q: "¿Cómo comparo dos clases?", a: "Botón \"Comparar clases\" arriba a la derecha. Elegís dos clases (de cualquier proyecto) y las ves lado a lado, con las diferencias resaltadas." },
      { q: "¿Cómo marco una clase como revisada?", a: "Tocá el ícono de escudo en la tarjeta o en el detalle — te pide contra qué norma se revisó, y queda registrado con tu nombre y la fecha." },
      { q: "¿Qué significa \"sólo resumen\"?", a: "Que esa clase tiene código, servicio, material y condiciones cargados, pero todavía no tiene la tabla completa de componentes/válvulas transcripta." },
      { q: "¿Cómo creo un proyecto nuevo?", a: "Botón \"+\" al lado de las pestañas de proyecto, arriba. Podés arrancar en blanco o duplicar uno existente como base." },
      { q: "¿Se puede deshacer un cambio?", a: "Cada clase tiene una pestaña \"Historial\" con quién editó y cuándo, pero no hay un botón de deshacer automático — hay que corregirlo a mano." },
    ],
  },
  {
    id: "spec-builder", title: "Armar especificación", icon: FileStack,
    items: [
      { q: "¿Cómo armo una especificación?", a: "Elegí clases de cualquier proyecto (Paso 1), completá los datos del documento (Paso 2), y generá el PDF o Excel desde el Borrador (Paso 3)." },
      { q: "¿Cómo uso una plantilla?", a: "\"Usar plantilla\" carga de una un conjunto de clases ya elegido antes. \"Guardar como plantilla\" guarda la selección actual para reutilizarla después." },
      { q: "¿Cómo armo el perfil de un cliente?", a: "Completá \"Cliente destinatario\" (y subí su logo si querés), y tocá el ícono de guardar al lado del campo. La próxima vez, botón \"Perfiles\" para reutilizarlo con un click." },
      { q: "¿Qué genera el código QR?", a: "Al guardar la especificación, la portada del PDF suma un QR que lleva directo a la versión online de ese documento — para que cualquiera lo pueda verificar escaneándolo. Sólo aparece después de guardar." },
      { q: "¿Cómo agrego las firmas del documento?", a: "Completá Preparado/Revisado/Aprobado por (nombre y fecha) en el formulario — aparecen como bloque de firma real en la portada del PDF." },
      { q: "Si guardo un N° de documento que ya existe, ¿qué pasa?", a: "Se agrega como una revisión nueva de ese mismo documento — no pisa la anterior. Podés poner el motivo del cambio en \"Motivo de esta revisión\"." },
      { q: "¿Dónde veo el historial de revisiones?", a: "En la portada del PDF, automático, una vez que ese N° de documento ya tiene más de una revisión guardada." },
      { q: "¿Cómo comparto una spec sin que la puedan editar?", a: "En \"Specs guardadas\", ícono de link al lado de cada revisión — copia un link de sólo lectura." },
      { q: "¿Cómo cambio una clase por otra dentro del borrador?", a: "Ícono de flechas circulares en la clase, dentro del Borrador — abre un buscador chico y la reemplaza en el mismo lugar de la lista." },
      { q: "¿Cómo edito una clase sólo para este documento?", a: "Ícono de lápiz en la clase, dentro del Borrador — lo que cambies ahí no afecta la clase original del registro. Botón \"Restaurar original\" para deshacerlo." },
      { q: "¿Qué es la nota en bloque?", a: "Un campo arriba del Borrador para agregar la misma nota a todas las clases elegidas de una sola vez, en vez de entrar a cada una." },
      { q: "¿Puedo mezclar clases de distintos proyectos?", a: "Sí — se puede combinar EPF, La Calera y Sal de Vida en la misma especificación." },
      { q: "¿Cómo agrupo por servicio en vez de por proyecto?", a: "Botones \"Por proyecto\" / \"Por servicio\" arriba del buscador de clases (Paso 1)." },
      { q: "¿Cómo bajo el Excel?", a: "Botón \"Descargar Excel\" en el Borrador — trae portada con metadata y el registro de clases elegidas." },
      { q: "¿Aparece de qué proyecto viene cada clase en el documento final?", a: "No — se sacó a propósito, para que el PDF y el Excel se puedan entregar a un cliente sin mostrar de dónde salió cada clase." },
    ],
  },
  {
    id: "service-catalog", title: "Catálogo de servicios", icon: Droplets,
    items: [
      { q: "¿Qué es el código de servicio?", a: "Un código corto y estable (ej. AGU-03) que identifica siempre al mismo servicio — es el que aparece en el índice codificado del PDF." },
      { q: "¿Cómo edito la descripción de un servicio?", a: "Lápiz de edición al lado del servicio, en el Catálogo de servicios." },
      { q: "¿Cómo sé en qué clases se usa un servicio?", a: "Cada servicio del catálogo muestra en cuántas y cuáles clases aparece." },
    ],
  },
  {
    id: "cadworx", title: "Generar SPEC CADWorx", icon: HardDrive,
    items: [
      { q: "¿Qué hace esta herramienta?", a: "Elegís una especificación ya guardada y genera un borrador de catálogo con los componentes que se pudieron confirmar contra catálogos reales de CADWorx." },
      { q: "¿El archivo que genera sirve para importar directo, sin revisar?", a: "No todavía del todo — conviene que alguien que sepa CADWorx lo revise antes. Los componentes marcados \"sin definir\" hay que cargarlos a mano en el Spec Editor." },
    ],
  },
];

function Item({ item, forceOpen }) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 py-2.5 text-left">
        <span className="text-[13px] font-medium text-slate-800">{item.q}</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <p className="text-[12.5px] text-slate-500 leading-relaxed pb-3 pr-6">{item.a}</p>}
    </div>
  );
}

export default function Help() {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!needle) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((it) => (it.q + " " + it.a).toLowerCase().includes(needle)),
    })).filter((s) => s.items.length > 0);
  }, [needle]);

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={20} className="text-[#00589E]" />
          <div>
            <h2 className="font-display text-[22px] font-bold uppercase tracking-wide text-[#113044] leading-none">Ayuda</h2>
            <div className="h-[3px] w-10 bg-[#00589E] mt-2" />
          </div>
        </div>
        <p className="text-[13px] text-slate-500 mb-5">Buscá tu pregunta, o abrí cada tema para ver todo lo que hace la página.</p>

        <div className="relative mb-6">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribí tu pregunta… (ej: perfil de cliente, QR, comparar)"
            className="w-full pl-8 pr-2 py-2 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none bg-white" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-[13px] text-slate-400 text-center py-10">No encontré nada para "{q}". Probá con otra palabra.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.id} className="rounded-md border border-slate-200 bg-white shadow-sm px-4 py-3">
                  <div className="flex items-center gap-2 mb-1 pb-2 border-b border-slate-100">
                    <Icon size={15} className="text-[#00589E]" />
                    <span className="text-[13px] font-semibold text-slate-700">{s.title}</span>
                  </div>
                  {s.items.map((it) => (
                    <Item key={it.q} item={it} forceOpen={!!needle} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
