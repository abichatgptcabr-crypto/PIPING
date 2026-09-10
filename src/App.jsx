import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Home from "./pages/Home";
import Generador from "./pages/Generador";
import SpecBuilder from "./pages/SpecBuilder";
import ServiceCatalog from "./pages/ServiceCatalog";
import CadworxExport from "./pages/CadworxExport";
import ViewSpec from "./pages/ViewSpec";
import PasswordGate from "./components/PasswordGate";
import Sidebar from "./components/Sidebar";
import hytechLogoWhite from "./assets/hytech-logo-white.png";
import { SEED_PLANTS } from "./data/plants";
import { syncFromSeed } from "./lib/api";

const PAGE_TITLES = {
  generador: "Generador de piping class",
  "spec-builder": "Armar especificación",
  "service-catalog": "Catálogo de servicios",
  "cadworx-export": "Generar SPEC CADWorx",
};

export default function App() {
  const [page, setPage] = useState("home");
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState("");

  // Link compartido de sólo lectura (?spec=<id>) — sin login, sin menú,
  // pensado para mandarle a alguien de afuera del equipo.
  const sharedSpecId = new URLSearchParams(window.location.search).get("spec");

  // Trae la base al día con lo que hay en el código — agrega plantas/clases
  // nuevas y completa el detalle de clases que quedaron en "sólo resumen"
  // en cargas anteriores. Corre en cada visita, no sólo la primera vez, y
  // nunca pisa una clase que el usuario ya editó a mano. Se salta si es un
  // link compartido: esa vista no necesita el registro completo.
  useEffect(() => {
    if (sharedSpecId) { setDbReady(true); return; }
    syncFromSeed(SEED_PLANTS)
      .then(() => setDbReady(true))
      .catch((e) => { setDbError(e.message || "No se pudo conectar con la base de datos."); setDbReady(true); });
  }, [sharedSpecId]);

  if (sharedSpecId) return <ViewSpec specId={sharedSpecId} />;

  return (
    <PasswordGate>
      <div className="min-h-screen flex flex-col">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <header className="print:hidden bg-[#00589E] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => setPage("home")} className="flex items-center gap-2 shrink-0">
            <img src={hytechLogoWhite} alt="Hytech" className="h-6 w-auto" />
          </button>
          <span className="text-white/40 text-[13px] font-display uppercase tracking-wider">/</span>
          <span className="text-white/90 text-[12px] font-display uppercase tracking-[0.12em]">Herramientas internas</span>
          {page !== "home" && (
            <>
              <span className="text-white/40">/</span>
              <button
                onClick={() => setPage("home")}
                className="flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white"
              >
                <ArrowLeft size={14} /> Inicio
              </button>
              <span className="text-white/40">/</span>
              <span className="text-[13px] font-medium text-white">{PAGE_TITLES[page]}</span>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        {!dbReady ? (
          <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-sm gap-2">
            <Loader2 size={16} className="animate-spin" /> Conectando con la base de datos…
          </div>
        ) : dbError ? (
          <div className="min-h-[70vh] flex items-center justify-center text-red-500 text-sm px-6 text-center">{dbError}</div>
        ) : (
          <>
            {page === "home" && <Home onOpen={setPage} />}
            {page === "generador" && <Generador />}
            {page === "spec-builder" && <SpecBuilder />}
            {page === "service-catalog" && <ServiceCatalog />}
            {page === "cadworx-export" && <CadworxExport />}
          </>
        )}
      </main>

      <footer className="print:hidden border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[11px] text-slate-400 font-mono">
          Hytech Tools · uso interno
        </div>
      </footer>
      </div>
    </PasswordGate>
  );
}
