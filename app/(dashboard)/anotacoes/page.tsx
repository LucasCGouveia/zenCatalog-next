"use client";

import React, { useState, useEffect } from "react";
import { Folder, Plus, Trash2, FileText, Save, ChevronRight, ChevronDown, Eye, Pen, PanelLeft, X } from "lucide-react";
import { getFolders, createFolder, deleteFolder, createNote, updateNote, deleteNote } from "@/src/anotacoes/actions/anotacoesActions";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Tipos
type NoteType = { id: string; title: string; content: string; folderId: string };
type FolderType = { id: string; name: string; notes: NoteType[] };

export default function AnotacoesPage() {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // <--- NOVO: Controle da Sidebar
  
  // Estado do Editor
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getFolders();
    setFolders(data as any);
    setLoading(false);
  }

  // --- Handlers de Pasta ---
  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setNewFolderName("");
    setIsCreatingFolder(false);
    toast.success("Pasta criada!");
    loadData();
  }

  async function handleDeleteFolder(id: string) {
    if (confirm("Tem certeza? Todas as notas dentro serão apagadas.")) {
      await deleteFolder(id);
      if (selectedFolder === id) setSelectedFolder(null);
      toast.success("Pasta removida.");
      loadData();
    }
  }

  // --- Handlers de Nota ---
  function handleNewNote() {
    if (!selectedFolder) return toast.error("Selecione uma pasta primeiro.");
    setSelectedNote({ id: "new", title: "", content: "", folderId: selectedFolder });
    setEditorTitle("");
    setEditorContent("");
    setIsPreview(false);
    // Se estiver em mobile ou tela pequena, você poderia fechar a sidebar aqui, mas no desktop vamos manter
  }

  async function handleSaveNote() {
    if (!selectedFolder || !editorTitle.trim()) return toast.error("Título é obrigatório");

    const isNewNote = selectedNote?.id === "new";

    try {
      if (isNewNote) {
        await createNote(selectedFolder, editorTitle, editorContent);
        toast.success("Nota criada!");
      } else if (selectedNote?.id) {
        await updateNote(selectedNote.id, editorTitle, editorContent);
        toast.success("Nota atualizada!");
      }
      
      const updatedFolders = await getFolders();
      setFolders(updatedFolders as any);

      const currentFolder = updatedFolders.find((f: any) => f.id === selectedFolder);
      
      let noteToSelect;
      if (isNewNote) {
        noteToSelect = currentFolder?.notes
          .filter((n: any) => n.title === editorTitle)
          .pop();
      } else {
        noteToSelect = currentFolder?.notes.find((n: any) => n.id === selectedNote?.id);
      }

      if (noteToSelect) {
        setSelectedNote(noteToSelect);
        setIsPreview(true);
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar nota");
    }
  }

  async function handleDeleteNote(id: string) {
    if (confirm("Apagar esta nota?")) {
      await deleteNote(id);
      setSelectedNote(null);
      loadData();
    }
  }

  function selectNoteToEdit(note: NoteType) {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setIsPreview(true);
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 p-6 transition-all">
      
      {/* SIDEBAR: Pastas e Lista de Notas (Com Animação de Largura) */}
      <div className={`
        flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-1/3 border border-slate-200' : 'w-0 border-none opacity-0 pointer-events-none'}
      `}>
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center min-w-[250px]">
          <h2 className="font-bold text-slate-700">Minhas Pastas</h2>
          <div className="flex gap-1">
             <button 
              onClick={() => setIsCreatingFolder(!isCreatingFolder)}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-600"
              title="Nova Pasta"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 lg:hidden" // Botão fechar extra para mobile
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="p-3 bg-blue-50 border-b border-blue-100 min-w-[250px]">
             {/* CORREÇÃO: Input com texto escuro */}
            <input 
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
              placeholder="Nome da pasta (ex: Semeador)"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
            />
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[250px]">
          {folders.map(folder => (
            <div key={folder.id} className="rounded-lg overflow-hidden">
              <div 
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${selectedFolder === folder.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'}`}
                onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
              >
                <div className="flex items-center gap-2 font-medium">
                  {selectedFolder === folder.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  <Folder size={18} />
                  {folder.name}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id) }} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>

              {selectedFolder === folder.id && (
                <div className="bg-slate-50/50 pl-9 pr-2 py-2 space-y-1 border-l-2 border-blue-100 ml-4">
                  {folder.notes.length === 0 && <p className="text-xs text-slate-400 italic">Nenhuma nota aqui.</p>}
                  
                  {folder.notes.map(note => (
                    <div 
                      key={note.id}
                      onClick={() => selectNoteToEdit(note)}
                      className="group flex justify-between items-center text-sm py-1.5 px-2 rounded-md hover:bg-white cursor-pointer text-slate-600 hover:text-blue-600"
                    >
                      <span className="truncate flex-1 flex gap-2 items-center">
                        <FileText size={14} /> {note.title}
                      </span>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleNewNote}
                    className="w-full text-left text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 px-2 py-1 flex items-center gap-1"
                  >
                    <Plus size={12} /> Nova Nota
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA PRINCIPAL: Editor / Visualizador */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative transition-all">
        {!selectedNote ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 relative">
             {/* Botão para abrir sidebar mesmo sem nota selecionada */}
             {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Abrir Pastas"
              >
                <PanelLeft size={20} />
              </button>
            )}
            
            <FileText size={64} className="mb-4 opacity-50" />
            <p>Selecione uma pasta e crie uma nota para começar</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex items-start gap-4 bg-white z-10">
              
              {/* BOTÃO TOGGLE SIDEBAR (Só aparece se sidebar fechada ou para toggle) */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg transition-colors shrink-0 ${isSidebarOpen ? 'text-slate-400 hover:bg-slate-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                title={isSidebarOpen ? "Esconder Pastas" : "Mostrar Pastas"}
              >
                <PanelLeft size={20} />
              </button>

              <input 
                type="text"
                value={editorTitle}
                onChange={e => setEditorTitle(e.target.value)}
                placeholder="Título da Aula / Anotação"
                className="text-2xl font-bold text-slate-800 placeholder:text-slate-300 outline-none flex-1 bg-transparent min-w-0"
              />
              
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  title={isPreview ? "Editar" : "Visualizar Leitura"}
                >
                  {isPreview ? <Pen size={18} /> : <Eye size={18} />}
                  <span className="text-sm font-medium hidden sm:inline">{isPreview ? "Editar" : "Ler"}</span>
                </button>

                <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

                {selectedNote.id !== 'new' && (
                  <button 
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir nota"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={handleSaveNote}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Save size={18} /> <span className="hidden sm:inline">Salvar</span>
                </button>
              </div>
            </div>

            {/* ÁREA DE CONTEÚDO */}
            {isPreview ? (
              <div className="flex-1 w-full p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="max-w-3xl mx-auto">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({children}) => <p className="mb-4 leading-relaxed text-slate-700">{children}</p>,
                      strong: ({children}) => <strong className="font-bold text-slate-900">{children}</strong>,
                      ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-700">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-700">{children}</ol>,
                      li: ({children}) => <li>{children}</li>,
                      h1: ({children}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-slate-900 pb-2 border-b border-slate-200">{children}</h1>,
                      h2: ({children}) => <h2 className="text-2xl font-bold mt-6 mb-3 text-slate-800">{children}</h2>,
                      h3: ({children}) => <h3 className="text-xl font-bold mt-5 mb-2 text-slate-800">{children}</h3>,
                      code: ({children}) => (
                        <code className="px-1.5 py-0.5 rounded text-sm bg-slate-100 text-slate-800 font-mono border border-slate-200">
                          {children}
                        </code>
                      ),
                      pre: ({children}) => (
                        <pre className="p-4 rounded-xl overflow-x-auto text-sm my-4 bg-slate-900 text-slate-100 shadow-md">
                          {children}
                        </pre>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 pl-4 italic my-4 text-slate-600 border-blue-400 bg-blue-50 py-2 rounded-r-lg">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {editorContent || "*Nenhum conteúdo ainda...*"}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea 
                value={editorContent}
                onChange={e => setEditorContent(e.target.value)}
                placeholder="Cole aqui o conteúdo do ChatZen..."
                className="flex-1 w-full p-8 resize-none outline-none text-slate-700 leading-relaxed text-lg font-mono"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}