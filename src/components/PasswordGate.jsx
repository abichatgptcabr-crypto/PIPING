import React, { useState, createContext, useContext } from "react";
import { Lock, Loader2 } from "lucide-react";
import { logAccess } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import hytechLogo from "../assets/hytech-logo.png";

const STORAGE_KEY = "hytech-tools-access";

const AccessContext = createContext({ name: "equipo", signOut: () => {} });
export const useAccess = () => useContext(AccessContext);

function readStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

export default function PasswordGate({ children }) {
  const [access, setAccess] = useState(readStored);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Ingresá tu nombre."); return; }
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-password", { body: { password } });
      if (fnError) throw fnError;
      if (!data?.ok) { setError("Contraseña incorrecta."); return; }
      const entry = { name: name.trim() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
      setAccess(entry);
      logAccess(entry.name).catch(() => {}); // registro en segundo plano, no bloquea el ingreso
    } catch (err) {
      setError("No se pudo verificar la contraseña: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <img src={hytechLogo} alt="Hytech" className="h-9 w-auto" />
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={15} className="text-[#00589E]" />
              <span className="text-[15px] font-semibold text-slate-800">Hytech Tools</span>
            </div>
            <div className="text-[13px] text-slate-500 mb-4">Acceso restringido al equipo de Hytech.</div>
            <form onSubmit={submit} className="space-y-2.5">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoFocus
                className="w-full px-2.5 py-2 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña del equipo"
                className="w-full px-2.5 py-2 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
              {error && <div className="text-[12px] text-red-600">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2.5 rounded-md bg-[#00589E] text-white hover:bg-[#00406E] disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : null} Entrar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessContext.Provider value={{ name: access.name, signOut: () => { localStorage.removeItem(STORAGE_KEY); setAccess(null); } }}>
      {children}
    </AccessContext.Provider>
  );
}
