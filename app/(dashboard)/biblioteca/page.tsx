"use client";

import {
  Check,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LibraryDocument = {
  id: string;
  name: string;
  mimeType: string;
  fileType: "PDF" | "DOCUMENT" | "SPREADSHEET" | "IMAGE" | "TEXT";
  size: number;
  summary: string | null;
  status: string;
  createdAt: string;
  _count: { chunks: number };
};

const acceptedTypes = [
  ".pdf",
  ".docx",
  ".xlsx",
  ".csv",
  ".txt",
  ".md",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
].join(",");

function documentIcon(type: LibraryDocument["fileType"]) {
  if (type === "IMAGE") return FileImage;
  if (type === "SPREADSHEET") return FileSpreadsheet;
  if (type === "PDF" || type === "DOCUMENT") return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BibliotecaPage() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const loadDocuments = useCallback(async () => {
    const response = await fetch("/api/biblioteca", { cache: "no-store" });
    if (!response.ok) return;
    setDocuments(await response.json());
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return documents;
    return documents.filter(
      (document) =>
        document.name.toLowerCase().includes(normalized) ||
        document.fileType.toLowerCase().includes(normalized) ||
        document.summary?.toLowerCase().includes(normalized),
    );
  }, [documents, query]);

  async function uploadFile(file?: File) {
    if (!file || uploading) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10 MB.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Extraindo texto e criando conhecimento...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/biblioteca", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await loadDocuments();
      toast.success("Documento vetorizado e disponível para o ChatZen.", {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível enviar.",
        { id: toastId },
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(document: LibraryDocument) {
    if (!confirm(`Excluir "${document.name}" da biblioteca?`)) return;

    const response = await fetch(`/api/biblioteca?id=${document.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      toast.error("Não foi possível excluir o documento.");
      return;
    }

    setDocuments((current) =>
      current.filter((item) => item.id !== document.id),
    );
    toast.success("Documento excluído.");
  }

  function startRenaming(document: LibraryDocument) {
    setEditingId(document.id);
    setEditingName(document.name);
  }

  function cancelRenaming() {
    setEditingId(null);
    setEditingName("");
  }

  async function renameDocument(document: LibraryDocument) {
    if (!editingName.trim() || renaming) return;

    setRenaming(true);
    try {
      const response = await fetch("/api/biblioteca", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: document.id, name: editingName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id ? { ...item, name: result.name } : item,
        ),
      );
      cancelRenaming();
      toast.success("Nome do documento atualizado.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível renomear.",
      );
    } finally {
      setRenaming(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 animate-in fade-in duration-500">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-400">
            <Sparkles size={15} /> Conhecimento do ChatZen
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Minha Biblioteca
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            PDFs, documentos, planilhas e imagens transformados em conhecimento
            pesquisável.
          </p>
        </div>
        <div className="w-fit rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <strong className="text-2xl text-blue-400">{documents.length}</strong>
          <span className="ml-2 text-xs font-black uppercase tracking-widest text-slate-400">
            documentos
          </span>
        </div>
      </header>

      <label
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          uploadFile(event.dataTransfer.files[0]);
        }}
        className={`relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-6 text-center transition sm:min-h-52 sm:p-8 ${
          dragging
            ? "border-blue-400 bg-blue-500/10"
            : "border-white/10 bg-white/[0.03] hover:border-blue-500/50 hover:bg-blue-500/5"
        }`}
      >
        <input
          type="file"
          accept={acceptedTypes}
          disabled={uploading}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => {
            uploadFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
          {uploading ? (
            <Loader2 className="animate-spin" size={28} />
          ) : (
            <Upload size={28} />
          )}
        </div>
        <h2 className="text-lg font-black text-white">
          {uploading ? "Processando documento..." : "Envie um novo documento"}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          PDF, DOCX, XLSX, CSV, TXT, Markdown ou imagem. Máximo de 10 MB.
        </p>
      </label>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <Search className="text-slate-500" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar documentos..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
        />
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] py-16 text-center text-slate-500">
          <FileText className="mx-auto mb-4 opacity-30" size={48} />
          <p>Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => {
            const Icon = documentIcon(document.fileType);
            const isEditing = editingId === document.id;

            return (
              <article
                key={document.id}
                className="group flex min-h-52 flex-col rounded-[1.75rem] border border-white/10 bg-white p-5 text-slate-900 shadow-xl transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Vetorizado
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-4">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") renameDocument(document);
                        if (event.key === "Escape") cancelRenaming();
                      }}
                      className="w-full rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500"
                      aria-label={`Novo nome para ${document.name}`}
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      A extensão será mantida se você não informá-la.
                    </p>
                  </div>
                ) : (
                  <h3 className="mt-4 line-clamp-2 font-black leading-snug">
                    {document.name}
                  </h3>
                )}

                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                  {document.summary ||
                    "Conteúdo extraído e disponível para busca."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {document.fileType} · {formatSize(document.size)} ·{" "}
                    {document._count.chunks} trechos
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => renameDocument(document)}
                          disabled={renaming}
                          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          title="Salvar nome"
                          aria-label="Salvar nome"
                        >
                          {renaming ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                        </button>
                        <button
                          onClick={cancelRenaming}
                          disabled={renaming}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                          title="Cancelar"
                          aria-label="Cancelar renomeação"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startRenaming(document)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          title="Renomear"
                          aria-label={`Renomear ${document.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <a
                          href={`/api/biblioteca/${document.id}/download`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Baixar"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={() => removeDocument(document)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
