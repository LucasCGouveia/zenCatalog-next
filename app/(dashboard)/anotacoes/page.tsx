"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  Maximize2,
  Minimize2,
  Minus,
  Loader2,
  PanelLeft,
  Pen,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getFolders,
  updateNotesOrder,
  updateNote,
} from "@/src/anotacoes/actions/anotacoesActions";

type NoteType = { id: string; title: string; content: string; folderId: string; position: number };
type FolderType = { id: string; name: string; notes: NoteType[] };

function NoteButton({
  note,
  selected,
  onSelect,
  overlay = false,
}: {
  note: NoteType;
  selected: boolean;
  onSelect?: () => void;
  overlay?: boolean;
}) {
  const draggable = useDraggable({
    id: `note:${note.id}`,
    disabled: overlay,
  });
  const droppable = useDroppable({
    id: `over-note:${note.id}`,
    disabled: overlay,
  });
  const setNodeRef = (node: HTMLElement | null) => {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  };

  const style = overlay
    ? undefined
    : {
        transform: draggable.transform
          ? `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`
          : undefined,
      };

  return (
    <button
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : draggable.listeners)}
      {...(overlay ? {} : draggable.attributes)}
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
        overlay
          ? "bg-white font-semibold text-blue-700 shadow-xl"
          : selected
            ? "bg-white font-semibold text-blue-700 shadow-sm"
            : "text-slate-600 hover:bg-white hover:text-blue-600"
      } ${draggable.isDragging ? "opacity-30" : ""}`}
    >
      <FileText size={14} className="shrink-0" />
      <span className="truncate">{note.title}</span>
    </button>
  );
}

function FolderHeader({
  folder,
  isOpen,
  onToggle,
  onDelete,
}: {
  folder: FolderType;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `folder:${folder.id}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-12 cursor-pointer items-center justify-between p-3 transition-colors ${
        isOver
          ? "bg-blue-100 text-blue-800 ring-2 ring-inset ring-blue-300"
          : isOpen
            ? "bg-blue-50 text-blue-700"
            : "text-slate-700 hover:bg-slate-50"
      }`}
      onClick={onToggle}
    >
      <div className="flex min-w-0 items-center gap-2 font-medium">
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Folder size={18} className="shrink-0" />
        <span className="truncate">{folder.name}</span>
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
        aria-label={`Excluir pasta ${folder.name}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function FolderDropArea({
  folder,
  selectedNoteId,
  onSelectNote,
  onNewNote,
}: {
  folder: FolderType;
  selectedNoteId?: string;
  onSelectNote: (note: NoteType) => void;
  onNewNote: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `folder:${folder.id}` });

  return (
    <div
      ref={setNodeRef}
      className={`ml-4 space-y-1 border-l-2 py-2 pl-5 pr-2 transition ${
        isOver
          ? "border-blue-400 bg-blue-50"
          : "border-blue-100 bg-slate-50/50"
      }`}
    >
      {folder.notes.length === 0 && (
        <p className="px-2 py-2 text-xs italic text-slate-400">Solte uma nota aqui.</p>
      )}

      {folder.notes.map((note) => (
        <NoteButton
          key={note.id}
          note={note}
          selected={selectedNoteId === note.id}
          onSelect={() => onSelectNote(note)}
        />
      ))}

      <button
        onClick={onNewNote}
        className="mt-2 flex min-h-11 w-full items-center gap-1 rounded-lg px-2 py-2 text-left text-xs font-bold text-blue-600 hover:bg-blue-50"
      >
        <Plus size={14} /> Nova nota
      </button>
    </div>
  );
}

export default function AnotacoesPage() {
  const searchParams = useSearchParams();
  const linkedNoteId = searchParams.get("note");
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [readingSize, setReadingSize] = useState(18);
  const [isExporting, setIsExporting] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [draggedNote, setDraggedNote] = useState<NoteType | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const loadData = useCallback(async () => {
    const data = (await getFolders()) as FolderType[];
    setFolders(data);

    if (linkedNoteId) {
      for (const folder of data) {
        const note = folder.notes.find((item) => item.id === linkedNoteId);
        if (note) {
          setSelectedFolder(folder.id);
          setSelectedNote(note);
          setEditorTitle(note.title);
          setEditorContent(note.content);
          setIsPreview(true);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
          break;
        }
      }
    }

    setLoading(false);
  }, [linkedNoteId]);

  async function handleCreateFolder(event: React.FormEvent) {
    event.preventDefault();
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName);
    setNewFolderName("");
    setIsCreatingFolder(false);
    toast.success("Pasta criada!");
    await loadData();
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Tem certeza? Todas as notas dentro serão apagadas.")) return;

    await deleteFolder(id);
    if (selectedFolder === id) {
      setSelectedFolder(null);
      setSelectedNote(null);
    }
    toast.success("Pasta removida.");
    await loadData();
  }

  function handleNewNote() {
    if (!selectedFolder) {
      toast.error("Selecione uma pasta primeiro.");
      return;
    }

    setSelectedNote({ id: "new", title: "", content: "", folderId: selectedFolder, position: 0 });
    setEditorTitle("");
    setEditorContent("");
    setIsPreview(false);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }

  async function handleSaveNote() {
    if (!selectedFolder || !editorTitle.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }

    const isNewNote = selectedNote?.id === "new";

    try {
      if (isNewNote) {
        await createNote(selectedFolder, editorTitle, editorContent);
        toast.success("Nota criada!");
      } else if (selectedNote?.id) {
        await updateNote(selectedNote.id, editorTitle, editorContent);
        toast.success("Nota atualizada!");
      }

      const updatedFolders = (await getFolders()) as FolderType[];
      setFolders(updatedFolders);
      const currentFolder = updatedFolders.find((folder) => folder.id === selectedFolder);
      const noteToSelect = isNewNote
        ? currentFolder?.notes.filter((note) => note.title === editorTitle).pop()
        : currentFolder?.notes.find((note) => note.id === selectedNote?.id);

      if (noteToSelect) {
        setSelectedNote(noteToSelect);
        setIsPreview(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar nota.");
    }
  }

  async function handleDeleteNote(id: string) {
    if (!confirm("Apagar esta nota?")) return;

    await deleteNote(id);
    setSelectedNote(null);
    setEditorTitle("");
    setEditorContent("");
    await loadData();
  }

  async function handleImportNote(file: File | undefined) {
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);
    if (selectedFolder) payload.append("folderId", selectedFolder);
    setIsImporting(true);

    try {
      const response = await fetch("/api/anotacoes/import", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao importar anotação");
      }

      const importedNote = result.note as NoteType;
      const updatedFolders = (await getFolders()) as FolderType[];
      setFolders(updatedFolders);
      setSelectedFolder(importedNote.folderId);
      setSelectedNote(importedNote);
      setEditorTitle(importedNote.title);
      setEditorContent(importedNote.content);
      setIsPreview(true);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      toast.success("Anotação importada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar anotação");
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  function selectNote(note: NoteType) {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setIsPreview(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }

  function persistFoldersOrder(nextFolders: FolderType[]) {
    return updateNotesOrder(
      nextFolders.map((folder) => ({
        folderId: folder.id,
        noteIds: folder.notes.map((note) => note.id),
      })),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedNote(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!activeId.startsWith("note:") || !overId) return;

    const noteId = activeId.replace("note:", "");
    const sourceFolder = folders.find((folder) =>
      folder.notes.some((note) => note.id === noteId),
    );
    const movingNote = sourceFolder?.notes.find((note) => note.id === noteId);
    if (!sourceFolder || !movingNote) return;

    let targetFolderId = "";
    let targetIndex = -1;

    if (overId.startsWith("folder:")) {
      targetFolderId = overId.replace("folder:", "");
    } else if (overId.startsWith("over-note:")) {
      const overNoteId = overId.replace("over-note:", "");
      const targetFolder = folders.find((folder) =>
        folder.notes.some((note) => note.id === overNoteId),
      );
      if (!targetFolder) return;
      targetFolderId = targetFolder.id;
      targetIndex = targetFolder.notes.findIndex((note) => note.id === overNoteId);
    }

    if (!targetFolderId) return;

    const previousFolders = folders;
    const sourceIndex = sourceFolder.notes.findIndex((note) => note.id === noteId);
    const nextFolders = folders.map((folder) => ({
      ...folder,
      notes: folder.notes.filter((note) => note.id !== noteId),
    }));
    const targetFolderIndex = nextFolders.findIndex((folder) => folder.id === targetFolderId);
    if (targetFolderIndex < 0) return;

    const noteForTarget = { ...movingNote, folderId: targetFolderId };
    const targetNotes = [...nextFolders[targetFolderIndex].notes];
    const insertAt =
      targetIndex >= 0
        ? targetFolderId === sourceFolder.id && targetIndex > sourceIndex
          ? targetIndex - 1
          : targetIndex
        : targetNotes.length;
    targetNotes.splice(Math.min(insertAt, targetNotes.length), 0, noteForTarget);
    nextFolders[targetFolderIndex] = {
      ...nextFolders[targetFolderIndex],
      notes: targetNotes.map((note, position) => ({ ...note, position })),
    };

    const normalizedFolders = nextFolders.map((folder) => ({
      ...folder,
      notes: folder.notes.map((note, position) => ({ ...note, position })),
    }));

    setFolders(normalizedFolders);
    setSelectedFolder(targetFolderId);
    if (selectedNote?.id === noteId) {
      setSelectedNote(
        normalizedFolders
          .flatMap((folder) => folder.notes)
          .find((note) => note.id === noteId) ?? noteForTarget,
      );
    }

    void persistFoldersOrder(normalizedFolders).catch((error) => {
      setFolders(previousFolders);
      toast.error(error instanceof Error ? error.message : "Não foi possível mover a nota");
    });
  }

  async function handleExportPdf() {
    if (!editorTitle.trim()) {
      toast.error("Adicione um título antes de exportar.");
      return;
    }

    setIsExporting(true);

    try {
      const { exportNoteToPdf } = await import("@/src/anotacoes/utils/exportNoteToPdf");
      const folderName = folders.find((folder) => folder.id === selectedFolder)?.name;

      await exportNoteToPdf({
        title: editorTitle,
        content: editorContent,
        folderName,
      });
      toast.success("PDF exportado!");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const syncSidebar = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSidebarOpen(event.matches);
    };

    syncSidebar(desktopQuery);
    desktopQuery.addEventListener("change", syncSidebar);
    return () => desktopQuery.removeEventListener("change", syncSidebar);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPresenting(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div
      className={`relative flex min-h-0 gap-3 transition-all md:gap-5 ${
        isPresenting
          ? "fixed inset-0 z-[100] h-dvh bg-slate-100"
          : "h-full min-h-0"
      }`}
    >
      <aside
        className={`flex flex-col overflow-hidden bg-white shadow-sm transition-all duration-300 ease-in-out ${
          isPresenting ? "hidden" : "rounded-2xl"
        } ${
          isSidebarOpen
            ? "absolute inset-0 z-30 h-full w-full border border-slate-200 lg:relative lg:inset-auto lg:w-[22rem] lg:shrink-0"
            : "pointer-events-none hidden w-0 border-none opacity-0 lg:flex"
        }`}
      >
        <div className="flex min-w-[250px] items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
          <h2 className="font-bold text-slate-700">Minhas pastas</h2>
          <div className="flex gap-1">
            <input
              ref={importInputRef}
              type="file"
              accept=".txt,.md,.markdown,.docx,.pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              className="hidden"
              onChange={(event) => handleImportNote(event.target.files?.[0])}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
              title="Importar anotação"
              aria-label="Importar anotação"
            >
              {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            </button>
            <button
              onClick={() => setIsCreatingFolder((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200"
              title="Nova pasta"
              aria-label="Criar pasta"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200"
              aria-label="Fechar pastas"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="min-w-[250px] border-b border-blue-100 bg-blue-50 p-3">
            <input
              autoFocus
              className="w-full rounded-xl border border-blue-200 px-3 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500"
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
            />
          </form>
        )}

        <div className="min-w-[250px] flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
          {loading && <p className="p-4 text-center text-sm text-slate-400">Carregando...</p>}

          {!loading && folders.length === 0 && (
            <div className="px-4 py-10 text-center">
              <Folder className="mx-auto mb-3 text-slate-300" size={36} />
              <p className="text-sm text-slate-500">Crie uma pasta para organizar suas aulas.</p>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                Criar primeira pasta
              </button>
            </div>
          )}

          <DndContext
            sensors={sensors}
            onDragStart={(event) => {
              const noteId = String(event.active.id).replace("note:", "");
              const note =
                folders.flatMap((folder) => folder.notes).find((item) => item.id === noteId) ??
                null;
              setDraggedNote(note);
            }}
            onDragCancel={() => setDraggedNote(null)}
            onDragEnd={handleDragEnd}
          >
            {folders.map((folder) => (
              <div key={folder.id} className="overflow-hidden rounded-xl">
                <FolderHeader
                  folder={folder}
                  isOpen={selectedFolder === folder.id}
                  onToggle={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                  onDelete={() => handleDeleteFolder(folder.id)}
                />

                {selectedFolder === folder.id && (
                  <FolderDropArea
                    folder={folder}
                    selectedNoteId={selectedNote?.id}
                    onSelectNote={selectNote}
                    onNewNote={handleNewNote}
                  />
                )}
              </div>
            ))}
            <DragOverlay>
              {draggedNote ? (
                <NoteButton note={draggedNote} selected={false} overlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </aside>

      <section
        className={`relative flex min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white shadow-sm ${
          isPresenting ? "rounded-none" : "rounded-2xl"
        }`}
      >
        {!selectedNote ? (
          <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-400">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                title="Abrir pastas"
                aria-label="Abrir pastas"
              >
                <PanelLeft size={20} />
              </button>
            )}
            <FileText size={56} className="mb-4 text-slate-200" />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="mb-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Importar anotação
            </button>
            <p className="max-w-xs text-sm sm:text-base">Selecione uma pasta e abra uma nota para começar.</p>
          </div>
        ) : (
          <>
            <header className="z-10 flex flex-col gap-2 border-b border-slate-100 bg-white p-2.5 sm:p-4 lg:flex-row lg:items-center lg:gap-4 lg:p-5">
              <div className="flex min-w-0 items-center gap-2">
                {!isPresenting && (
                  <button
                    onClick={() => setIsSidebarOpen((value) => !value)}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isSidebarOpen
                        ? "text-slate-400 hover:bg-slate-100"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                    title={isSidebarOpen ? "Esconder pastas" : "Mostrar pastas"}
                    aria-label={isSidebarOpen ? "Esconder pastas" : "Mostrar pastas"}
                  >
                    <PanelLeft size={20} />
                  </button>
                )}

                <input
                  type="text"
                  value={editorTitle}
                  onChange={(event) => setEditorTitle(event.target.value)}
                  placeholder="Título da aula..."
                  readOnly={isPresenting}
                  className="min-w-0 flex-1 bg-transparent text-lg font-bold text-slate-800 outline-none placeholder:text-slate-300 sm:text-2xl"
                />
              </div>

              <div className="flex shrink-0 items-center justify-end gap-1 overflow-x-auto">
                {isPreview && (
                  <div className="mr-auto flex items-center rounded-xl bg-slate-100 p-1 lg:mr-1">
                    <button
                      onClick={() => setReadingSize((size) => Math.max(15, size - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white"
                      title="Diminuir texto"
                      aria-label="Diminuir texto"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-9 text-center text-xs font-bold text-slate-500">{readingSize}</span>
                    <button
                      onClick={() => setReadingSize((size) => Math.min(28, size + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-white"
                      title="Aumentar texto"
                      aria-label="Aumentar texto"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsPreview((value) => !value)}
                  className="flex h-11 items-center gap-2 rounded-xl px-3 text-slate-500 hover:bg-slate-100"
                  title={isPreview ? "Editar" : "Visualizar leitura"}
                >
                  {isPreview ? <Pen size={18} /> : <Eye size={18} />}
                  <span className="hidden text-sm font-medium sm:inline">{isPreview ? "Editar" : "Ler"}</span>
                </button>

                {isPreview && (
                  <button
                    onClick={() => setIsPresenting((value) => !value)}
                    className={`flex h-11 items-center gap-2 rounded-xl px-3 ${
                      isPresenting ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title={isPresenting ? "Sair da apresentação" : "Apresentar em tela cheia"}
                  >
                    {isPresenting ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    <span className="hidden text-sm font-medium sm:inline">{isPresenting ? "Sair" : "Apresentar"}</span>
                  </button>
                )}

                <button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="flex h-11 items-center gap-2 rounded-xl px-3 text-slate-500 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                  title="Exportar anotação em PDF"
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  <span className="hidden text-sm font-medium sm:inline">PDF</span>
                </button>

                {!isPresenting && selectedNote.id !== "new" && (
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-red-400 hover:bg-red-50"
                    title="Excluir nota"
                    aria-label="Excluir nota"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                {!isPresenting && (
                  <button
                    onClick={handleSaveNote}
                    className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 font-medium text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:px-4"
                  >
                    <Save size={18} />
                    <span className="hidden sm:inline">Salvar</span>
                  </button>
                )}
              </div>
            </header>

            {isPreview ? (
              <div className="custom-scrollbar w-full flex-1 overflow-y-auto overscroll-contain bg-slate-50/30 px-4 py-5 sm:p-8">
                <article
                  className="mx-auto max-w-4xl break-words pb-[max(2rem,env(safe-area-inset-bottom))] text-slate-700"
                  style={{ fontSize: `${readingSize}px` }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-5 leading-[1.75]">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                      ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 leading-relaxed">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6 leading-relaxed">{children}</ol>,
                      h1: ({ children }) => <h1 className="mb-5 mt-8 border-b border-slate-200 pb-3 text-[1.65em] font-bold leading-tight text-slate-900 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-4 mt-7 text-[1.35em] font-bold leading-tight text-slate-800">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-3 mt-6 text-[1.15em] font-bold leading-tight text-slate-800">{children}</h3>,
                      code: ({ children }) => <code className="break-words rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800">{children}</code>,
                      pre: ({ children }) => <pre className="my-5 max-w-full overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100 shadow-md">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="my-5 rounded-r-xl border-l-4 border-blue-400 bg-blue-50 py-3 pl-4 pr-3 italic text-slate-600">{children}</blockquote>,
                      a: ({ children, href }) => <a href={href} className="break-all font-medium text-blue-600 underline underline-offset-2">{children}</a>,
                      table: ({ children }) => <div className="my-5 overflow-x-auto"><table className="w-full min-w-[32rem] border-collapse text-[0.9em]">{children}</table></div>,
                      th: ({ children }) => <th className="border border-slate-300 bg-slate-100 p-2 text-left font-bold text-slate-800">{children}</th>,
                      td: ({ children }) => <td className="border border-slate-200 p-2 align-top">{children}</td>,
                    }}
                  >
                    {editorContent || "*Nenhum conteúdo ainda...*"}
                  </ReactMarkdown>
                </article>
              </div>
            ) : (
              <textarea
                value={editorContent}
                onChange={(event) => setEditorContent(event.target.value)}
                placeholder="Cole ou escreva aqui o conteúdo da aula..."
                className="w-full flex-1 resize-none bg-white p-4 font-mono text-base leading-relaxed text-slate-700 outline-none sm:p-8 sm:text-lg"
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
