import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Home from "./pages/Home";
import Generador from "./pages/Generador";
import SpecBuilder from "./pages/SpecBuilder";
import AuthGate from "./components/AuthGate";
import hytechLogo from "./assets/hytech-logo.png";

const PAGE_TITLES = {
  generador: "Generador de piping class",
  "spec-builder": "Armar especificación",
};

export default function App() {
  const [page, setPage] = useState("home");

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
        {page === "home" && <Home onOpen={setPage} />}
        {page === "generador" && <Generador />}
        {page === "spec-builder" && <SpecBuilder />}
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
