import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Home from "./pages/Home";
import Generador from "./pages/Generador";
import SpecBuilder from "./pages/SpecBuilder";
import AuthGate from "./components/AuthGate";
import hytechLogo from "./assets/hytech-logo.png";
import { SEED_PLANTS } from "./data/plants";
import { syncFromSeed } from "./lib/api";

const PAGE_TITLES = {
  generador: "Generador de piping class",
  "spec-builder": "Armar especificación",
};

export default function App() {
  const [page, setPage] = useState("home");
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState("");

  // Trae la base al día con lo que hay en el código — agrega plantas/clases
  // nuevas y completa el detalle de clases que quedaron en "sólo resumen"
  // en cargas anteriores. Corre en cada visita, no sólo la primera vez, y
  // nunca pisa una clase que el usuario ya editó a mano.
  useEffect(() => {
    syncFromSeed(SEED_PLANTS)
      .then(() => setDbReady(true))
      .catch((e) => { setDbError(e.message || "No se pudo conectar con la base de datos."); setDbReady(true); });
  }, []);

  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col">
      <header className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => setPage("home")} className="flex items-center gap-2 shrink-0">
            <img src={hytechLogo} alt="Hytech" className="h-7 w-auto" />
          </button>
          {page !== "home" && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => setPage("home")}
                className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-[#1F3F6E]"
              >
                <ArrowLeft size={14} /> Inicio
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-[13px] font-medium text-slate-800">{PAGE_TITLES[page]}</span>
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
          </>
        )}
      </main>

      <footer className="print:hidden border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[11px] text-slate-400 font-mono">
          Hytech Tools · uso interno
        </div>
      </footer>
      </div>
    </AuthGate>
  );
}
