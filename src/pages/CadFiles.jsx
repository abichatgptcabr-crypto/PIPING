import React, { useState, useEffect } from "react";
import { FolderCog, Loader2, Upload, Download, Trash2, FileCode } from "lucide-react";
import { fetchCadFiles, uploadCadFile, deleteCadFile } from "../lib/api";
import { useToast, Toast } from "../components/Toast";

export default function CadFiles() {
  const [files, setFiles] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [picked, setPicked] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, showToast] = useToast();

  const load = () => fetchCadFiles().then(setFiles).catch(() => setFiles([]));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!picked || !name.trim()) return;
    setUploading(true);
    try {
      await uploadCadFile(picked, name.trim(), description.trim());
      setName(""); setDescription(""); setPicked(null);
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
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qué hace, en una o dos líneas…" rows={2}
            className="w-full text-[13px] px-2.5 py-2 border border-slate-200 rounded-md focus:border-[#00589E] focus:outline-none" />
          <div className="flex items-center gap-2">
            <input type="file" onChange={(e) => setPicked(e.target.files?.[0] || null)}
              className="flex-1 text-[12.5px] file:mr-2 file:px-2.5 file:py-1.5 file:rounded-md file:border-0 file:bg-[#EAF3FB] file:text-[#00589E] file:text-[12.5px]" />
            <button type="submit" disabled={uploading || !picked || !name.trim()}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-md bg-[#00589E] text-white hover:bg-[#00406E] disabled:opacity-50 shrink-0">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Subir
            </button>
          </div>
        </form>

        {files === null ? (
          <div className="text-[13px] text-slate-400 flex items-center gap-2 py-6 justify-center"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
        ) : files.length === 0 ? (
          <div className="text-[13px] text-slate-400 text-center py-6">Todavía no se subió ningún archivo.</div>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
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
