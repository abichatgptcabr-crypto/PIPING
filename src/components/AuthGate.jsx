import React, { useState, useEffect, createContext, useContext } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import hytechLogo from "../assets/hytech-logo.png";

const AuthContext = createContext({
  email: "equipo@hytech.com",
  signOut: () => {},
});
export const useAuth = () => useContext(AuthContext);

// LOGIN DESACTIVADO TEMPORALMENTE — ver mensaje del chat que armó esto.
// Para volver a exigirlo: en App.jsx, envolvé <AuthGateReal> en vez de
// pasar los children directo, y corré de nuevo las policies de
// schema.sql (las que dicen auth.role() = 'authenticated') en Supabase.
export default function AuthGate({ children }) {
  return children;
}

export function AuthGateReal({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendLink = async (e) => {
    e.preventDefault();
    setErr(""); setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setSending(false);
    if (error) {
      setErr(
        error.message.includes("not authorized") || error.status === 403
          ? "Este mail no está invitado todavía. Pedile a quien administra la cuenta de Supabase que te invite desde Authentication → Users."
          : error.message
      );
    } else {
      setSent(true);
    }
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <img src={hytechLogo} alt="Hytech" className="h-9 w-auto" />
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-3" />
                <div className="text-[14px] font-medium text-slate-800 mb-1">Revisá tu mail</div>
                <div className="text-[13px] text-slate-500">Te mandamos un link a <b>{email}</b> para entrar. Puede tardar un minuto.</div>
              </div>
            ) : (
              <form onSubmit={sendLink}>
                <div className="text-[15px] font-semibold text-slate-800 mb-1">Hytech Tools</div>
                <div className="text-[13px] text-slate-500 mb-4">Entrá con tu mail — te mandamos un link, sin contraseña.</div>
                <div className="relative mb-3">
                  <Mail size={14} className="absolute left-2.5 top-3 text-slate-400" />
                  <input
                    type="email" required autoFocus value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vos@hytech.com"
                    className="w-full pl-8 pr-2 py-2.5 text-[13px] border border-slate-200 rounded-md focus:border-[#2C568E] focus:outline-none"
                  />
                </div>
                {err && <div className="text-[12px] text-red-600 mb-3">{err}</div>}
                <button
                  type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium px-3 py-2.5 rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E] disabled:opacity-60"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Mandarme el link
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ email: session.user.email, signOut: () => supabase.auth.signOut() }}>
      {children}
    </AuthContext.Provider>
  );
}
