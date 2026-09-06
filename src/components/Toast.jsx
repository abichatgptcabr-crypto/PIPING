import React, { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";

// Hook chico para mostrar un toast: const [toast, showToast] = useToast();
// showToast("Guardado.") o showToast("Error al guardar", "error")
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type, key: Date.now() });
  return [toast, showToast];
}

export function Toast({ toast }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setShow(true);
    const hideTimer = setTimeout(() => setShow(false), 2700);
    return () => clearTimeout(hideTimer);
  }, [toast]);

  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div
      key={toast.key}
      className={`fixed bottom-5 right-5 z-[100] transition-all duration-300 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
    >
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-md shadow-lg border text-[13px] font-medium max-w-sm ${
        isError ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-emerald-200 text-emerald-800"
      }`}>
        {isError ? <AlertCircle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0 text-emerald-600" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
