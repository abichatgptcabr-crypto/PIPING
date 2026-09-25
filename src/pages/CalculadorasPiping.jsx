import React, { useState, useMemo } from "react";
import { Scale, Gauge, Thermometer } from "lucide-react";

const TABS = [
  { id: "peso", label: "Peso y volumen", icon: Scale },
  { id: "hidraulica", label: "Prueba hidráulica", icon: Gauge },
  { id: "dilatacion", label: "Dilatación térmica", icon: Thermometer },
];

// Densidad del acero — valor estándar de referencia para MTO/estimación de
// peso. Si trabajás con otro material, este cálculo no aplica tal cual.
const DENSIDAD_ACERO = 7850; // kg/m3

// Coeficientes de dilatación lineal PROMEDIO (1/°C) — valores de referencia
// habituales en tablas de ingeniería. No reemplazan la curva real del
// material según ASME B31.3 Apéndice C para el rango de temperatura exacto.
const MATERIALES_DILATACION = [
  { id: "acero-carbono", label: "Acero al carbono", alfa: 12.0e-6 },
  { id: "acero-baja-aleacion", label: "Acero de baja aleación (Cr-Mo)", alfa: 13.0e-6 },
  { id: "acero-inox", label: "Acero inoxidable 304/316", alfa: 17.3e-6 },
  { id: "aluminio", label: "Aluminio", alfa: 23.6e-6 },
  { id: "cobre", label: "Cobre", alfa: 17.0e-6 },
];

function numOr(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function CalculadorasPiping() {
  const [tab, setTab] = useState("peso");

  // --- Peso y volumen de cañería ---
  const [od, setOd] = useState("");
  const [esp, setEsp] = useState("");
  const [longPeso, setLongPeso] = useState("");
  const pesoResult = useMemo(() => {
    const ODm = numOr(od) / 1000;
    const espM = numOr(esp) / 1000;
    const L = numOr(longPeso);
    if (ODm <= 0 || espM <= 0 || espM * 2 >= ODm) return null;
    const ID = ODm - 2 * espM;
    const areaAcero = (Math.PI / 4) * (ODm ** 2 - ID ** 2); // m2
    const areaInterna = (Math.PI / 4) * (ID ** 2); // m2
    const pesoPorM = areaAcero * DENSIDAD_ACERO; // kg/m
    const volPorM = areaInterna * 1000; // L/m (1 m3 = 1000 L)
    return {
      idMm: ID * 1000,
      pesoPorM,
      pesoTotal: pesoPorM * L,
      volPorM,
      volTotal: volPorM * L,
    };
  }, [od, esp, longPeso]);

  // --- Presión de prueba hidráulica (ASME B31.3: Pt = 1.5 x P x St/S) ---
  const [pDiseno, setPDiseno] = useState("");
  const [sDiseno, setSDiseno] = useState("");
  const [sAmbiente, setSAmbiente] = useState("");
  const hidraulicaResult = useMemo(() => {
    const P = numOr(pDiseno);
    if (P <= 0) return null;
    const S = numOr(sDiseno);
    const St = numOr(sAmbiente);
    const usoDefault = !(S > 0 && St > 0);
    const ratioRaw = usoDefault ? 1 : St / S;
    const ratioUsed = Math.min(ratioRaw, 6.5); // B31.3: St/S no se toma > 6.5 sin criterio especial
    return { pTest: 1.5 * P * ratioUsed, ratioUsed, usoDefault };
  }, [pDiseno, sDiseno, sAmbiente]);

  // --- Dilatación térmica de un tramo (ΔL = L x α x ΔT) ---
  const [longDil, setLongDil] = useState("");
  const [tInstal, setTInstal] = useState("");
  const [tOper, setTOper] = useState("");
  const [material, setMaterial] = useState(MATERIALES_DILATACION[0].id);
  const dilatacionResult = useMemo(() => {
    const L = numOr(longDil);
    if (L <= 0 || longDil === "" || tInstal === "" || tOper === "") return null;
    const t1 = numOr(tInstal);
    const t2 = numOr(tOper);
    const mat = MATERIALES_DILATACION.find((m) => m.id === material);
    const deltaT = t2 - t1;
    const deltaL = L * mat.alfa * deltaT * 1000; // mm
    return { deltaL, deltaT, mat };
  }, [longDil, tInstal, tOper, material]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="text-[11px] font-display uppercase tracking-[0.2em] text-[#00589E] mb-1">Hytech Tools</div>
        <h1 className="font-display text-[24px] font-bold text-[#113044]">Calculadoras de piping</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Cálculos rápidos de referencia con fórmulas estándar — no reemplazan el cálculo formal ni el criterio de quien firma la ingeniería.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                active ? "border-[#00589E] text-[#00589E]" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "peso" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Field label="Diámetro externo — OD (mm)" value={od} onChange={setOd} placeholder="Ej: 168.3" />
            <Field label="Espesor de pared (mm)" value={esp} onChange={setEsp} placeholder="Ej: 7.11" />
            <Field label="Longitud del tramo (m)" value={longPeso} onChange={setLongPeso} placeholder="Ej: 25" />
            <p className="text-[11px] text-slate-400">
              OD y espesor: tomalos de tu piping class o de ASME B36.10/19. Densidad de referencia: acero {DENSIDAD_ACERO} kg/m³.
            </p>
          </div>
          <ResultCard>
            {pesoResult ? (
              <>
                <ResultRow label="Diámetro interno" value={`${pesoResult.idMm.toFixed(1)} mm`} />
                <ResultRow label="Peso lineal" value={`${pesoResult.pesoPorM.toFixed(2)} kg/m`} big />
                <ResultRow label="Peso total del tramo" value={`${pesoResult.pesoTotal.toFixed(1)} kg`} big />
                <ResultRow label="Volumen interno lineal" value={`${pesoResult.volPorM.toFixed(2)} L/m`} />
                <ResultRow label="Volumen total del tramo" value={`${pesoResult.volTotal.toFixed(1)} L`} big />
              </>
            ) : (
              <EmptyHint text="Completá OD y espesor (el espesor tiene que ser menor a la mitad del OD)." />
            )}
          </ResultCard>
        </div>
      )}

      {tab === "hidraulica" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Field label="Presión de diseño (bar)" value={pDiseno} onChange={setPDiseno} placeholder="Ej: 10" />
            <Field label="Esfuerzo admisible a temp. de diseño — S (opcional)" value={sDiseno} onChange={setSDiseno} placeholder="Tabla A-1 ASME B31.3" />
            <Field label="Esfuerzo admisible a temp. ambiente — St (opcional)" value={sAmbiente} onChange={setSAmbiente} placeholder="Tabla A-1 ASME B31.3" />
            <p className="text-[11px] text-slate-400">
              ASME B31.3: Pt = 1,5 × P × (St/S). Si no cargás S y St se calcula 1,5 × P (caso más común, cuando St ≈ S). La relación St/S nunca se toma mayor a 6,5.
            </p>
          </div>
          <ResultCard>
            {hidraulicaResult ? (
              <>
                <ResultRow label="Presión de prueba hidráulica" value={`${hidraulicaResult.pTest.toFixed(2)} bar`} big />
                <ResultRow label="Relación St/S usada" value={hidraulicaResult.usoDefault ? "1,00 (default)" : hidraulicaResult.ratioUsed.toFixed(2)} />
              </>
            ) : (
              <EmptyHint text="Completá la presión de diseño." />
            )}
          </ResultCard>
        </div>
      )}

      {tab === "dilatacion" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Field label="Longitud del tramo (m)" value={longDil} onChange={setLongDil} placeholder="Ej: 30" />
            <Field label="Temperatura de instalación (°C)" value={tInstal} onChange={setTInstal} placeholder="Ej: 20" />
            <Field label="Temperatura de operación (°C)" value={tOper} onChange={setTOper} placeholder="Ej: 180" />
            <div>
              <label className="block text-[12px] text-slate-500 mb-1">Material</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none"
              >
                {MATERIALES_DILATACION.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Coeficientes de dilatación lineal promedio de referencia — para el diseño final de loops o juntas de expansión, usar la curva real del material según ASME B31.3 Apéndice C para el rango de temperatura.
            </p>
          </div>
          <ResultCard>
            {dilatacionResult ? (
              <>
                <ResultRow label="ΔT" value={`${dilatacionResult.deltaT.toFixed(0)} °C`} />
                <ResultRow label="Elongación estimada (ΔL)" value={`${dilatacionResult.deltaL.toFixed(1)} mm`} big />
              </>
            ) : (
              <EmptyHint text="Completá longitud y las dos temperaturas." />
            )}
          </ResultCard>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[12px] text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none"
      />
    </div>
  );
}

function ResultCard({ children }) {
  return <div className="rounded-md bg-[#113044] p-5 space-y-3 h-fit">{children}</div>;
}

function ResultRow({ label, value, big }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-white/60">{label}</span>
      <span className={`font-display font-bold text-white ${big ? "text-[20px]" : "text-[14px]"}`}>{value}</span>
    </div>
  );
}

function EmptyHint({ text }) {
  return <p className="text-[12.5px] text-white/40 italic">{text}</p>;
}
