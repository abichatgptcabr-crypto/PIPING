import React, { useState, useEffect, useMemo } from "react";
import { FolderCog, Loader2, Upload, Download, Trash2, FileCode, Search, Sparkles } from "lucide-react";
import { fetchCadFiles, uploadCadFile, deleteCadFile } from "../lib/api";
import { useToast, Toast } from "../components/Toast";

// Extensiones de texto plano donde tiene sentido leer el contenido para
// sugerir una descripción — los binarios (.vlx, .fas, .dll) no se pueden leer así.
const TEXT_EXTS = ["lsp", "scr", "mnl", "dvb", "py", "txt"];

function guessDescription(text) {
  const cmdMatch = text.match(/\(defun\s+c:([a-zA-Z0-9_]+)/i);
  const cmdName = cmdMatch ? cmdMatch[1].toUpperCase() : null;

  // Primer bloque de comentarios seguidos, desde donde empiece el archivo
  // (típicamente ahí la persona ya escribió qué hace la rutina).
  const lines = text.split("\n");
  const commentLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(";")) {
      const clean = trimmed.replace(/^;+/, "").trim();
      if (clean) commentLines.push(clean);
    } else if (commentLines.length > 0 || trimmed) {
      break;
    }
  }

  let guess = "";
  if (cmdName) guess += `Comando: ${cmdName}. `;
  if (commentLines.length) guess += commentLines.slice(0, 3).join(" ");
  return guess.trim();
}

export default function CadFiles() {
  const [files, setFiles] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [picked, setPicked] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [q, setQ] = useState("");
  const [toast, showToast] = useToast();

  const load = () => fetchCadFiles().then(setFiles).catch(() => setFiles([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!files) return files;
    const needle = q.trim().toLowerCase();
    if (!needle) return files;
    return files.filter((f) => (f.name + " " + f.description + " " + f.file_name).toLowerCase().includes(needle));
  }, [files, q]);

  const pickFile = (file) => {
    setPicked(file);
    setSuggested(false);
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!TEXT_EXTS.includes(ext) || file.size > 500_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      const guess = guessDescription(String(reader.result));
      if (guess) {
        setDescription((d) => (d.trim() ? d : guess));
        if (!name.trim()) {
          const base = file.name.replace(/\.[^.]+$/, "");
          setName(base);
        }
        setSuggested(true);
      }
    };
    reader.readAsText(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!picked || !name.trim()) return;
    setUploading(true);
    try {
      await uploadCadFile(picked, name.trim(), description.trim());
      setName(""); setDescription(""); setPicked(null); setSuggested(false);
      e.target.reset();
      load();
      showToast("Archivo subido.");
    } catch (err) {
      showToast("No se pudo subir: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteCadFile(id);
      setFiles((f) => f.filter((x) => x.id !== id));
    } catch (err) {
      showToast("No se pudo borrar: " + err.message, "error");
    }
  };

  return (
    <div className="bg-[#F4F7FA] min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <FolderCog size={20} className="text-[#00589E]" />
          <div>
            <h2 className="font-display text-[22px] font-bold uppercase tracking-wide text-[#113044] leading-none">Central de archivos CAD</h2>
            <div className="h-[3px] w-10 bg-[#00589E] mt-2" />
          </div>
        </div>
        <p className="text-[13px] text-slate-500 mb-5 max-w-2xl">
          Subí los comandos, rutinas o archivos que vayas armando (LISP y similares) con una breve descripción, para que
          el resto del equipo los encuentre y los baje.
        </p>

        <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white shadow-sm p-4 mb-6 space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del comando/archivo"
            className="w-full text-[13px] px-2.5 py-2 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
          <textarea value={description} onChange={(e) => { setDescription(e.target.value); setSuggested(false); }} placeholder="Qué hace, en una o dos líneas…" rows={2}
            className="w-full text-[13px] px-2.5 py-2 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
          {suggested && (
            <div className="flex items-center gap-1 text-[11px] text-[#00589E]">
              <Sparkles size={11} /> Sugerido a partir del archivo — revisalo antes de subir.
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="file" onChange={(e) => pickFile(e.target.files?.[0] || null)}
              className="flex-1 text-[12.5px] file:mr-2 file:px-2.5 file:py-1.5 file:rounded-md file:border-0 file:bg-[#EAF3FB] file:text-[#00589E] file:text-[12.5px]" />
            <button type="submit" disabled={uploading || !picked || !name.trim()}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md bg-[#00589E] text-white hover:bg-[#00406E] disabled:opacity-50 shrink-0">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Subir
            </button>
          </div>
        </form>

        {files && files.length > 0 && (
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o descripción…"
              className="w-full pl-8 pr-2 py-2 text-[13px] border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none bg-white" />
          </div>
        )}

        {files === null ? (
          <div className="text-[13px] text-slate-400 flex items-center gap-2 py-6 justify-center"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
        ) : files.length === 0 ? (
          <div className="text-[13px] text-slate-400 text-center py-6">Todavía no se subió ningún archivo.</div>
        ) : filtered.length === 0 ? (
          <div className="text-[13px] text-slate-400 text-center py-6">Sin resultados para "{q}".</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((f) => (
              <div key={f.id} className="rounded-md border border-slate-200 bg-white shadow-sm p-3.5 flex items-start gap-3">
                <FileCode size={18} className="text-[#00589E] mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-slate-800">{f.name}</div>
                  {f.description && <div className="text-[12.5px] text-slate-500 mt-0.5">{f.description}</div>}
                  <div className="text-[11px] text-slate-400 mt-1">{f.file_name} · subido por {f.uploaded_by} · {new Date(f.created_at).toLocaleDateString("es-AR")}</div>
                </div>
                <a href={f.file_url} download={f.file_name} className="shrink-0 p-1.5 text-slate-400 hover:text-[#00589E]" title="Descargar"><Download size={16} /></a>
                <button onClick={() => remove(f.id)} className="shrink-0 p-1.5 text-slate-300 hover:text-red-500" title="Eliminar"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
