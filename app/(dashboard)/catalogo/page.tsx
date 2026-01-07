"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, MessageSquare, CheckCircle2, Sparkles, X, Film, Library, Youtube, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';
import { HistoryList } from "@/modulos/catalogo/components/HistoryList";
import { CatalogItem } from "@/modulos/catalogo/types";
import { processYoutubeLink } from '@/modulos/catalogo/actions/youtubeActions'; // Importe a Action

export default function CatalogoPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);

  const loadData = async () => {
    try {
      const res = await fetch("/api/catalogo");
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Funções Auxiliares (Upload)
  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const minutes = Math.floor(video.duration / 60);
        const seconds = Math.floor(video.duration % 60);
        resolve(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleCatalog = async () => {
    // Validação
    if (activeTab === 'upload' && !selectedFile && !description) {
      toast.warning("Selecione um arquivo ou digite uma descrição.");
      return;
    }
    if (activeTab === 'youtube' && !youtubeUrl) {
      toast.warning("Cole a URL do vídeo do YouTube.");
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading(
      activeTab === 'youtube' ? "Baixando legendas e analisando..." : "Processando vídeo com Gemini..."
    );

    try {
      if (activeTab === 'youtube') {
        // --- FLUXO YOUTUBE (SERVER ACTION) ---
        const result = await processYoutubeLink(youtubeUrl, description);

        if (result.success) {
          toast.success("Vídeo do YouTube catalogado!", { id: toastId });
          setYoutubeUrl('');
          setDescription('');
          loadData();
        } else {
          throw new Error(result.error);
        }

      } else {
        // --- FLUXO UPLOAD (API ROUTE) ---
        let duration = "00:00";
        let fileData = null;

        if (selectedFile) {
          duration = await getVideoDuration(selectedFile);
          const base64 = await fileToBase64(selectedFile);
          fileData = { base64, mimeType: selectedFile.type, name: selectedFile.name };
        }

        const res = await fetch('/api/analisar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            fileBase64: fileData?.base64,
            fileMimeType: fileData?.mimeType,
            fileName: fileData?.name,
            duration,
            isWatchEveryDay: false,
            priorityValue: 1
          })
        });

        const data = await res.json();
        if (res.ok) {
          toast.success("Upload catalogado com sucesso!", { id: toastId });
          setSelectedFile(null);
          setDescription('');
          loadData();
        } else {
          throw new Error(data.error);
        }
      }

    } catch (error: unknown) { // Use unknown
      console.error(error);
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Falha ao catalogar", {
        id: toastId,
        description: msg || "Verifique o vídeo e tente novamente."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 15);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-2 animate-in fade-in duration-700">
      <Toaster position="top-right" theme="dark" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            Treinamento de IA
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Novo Conhecimento</h1>
          <p className="text-gray-500 text-lg">Adicione vídeos via Upload ou Link do YouTube.</p>
        </div>
        <Link href="/">
          <button className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 px-6 py-3 rounded-2xl transition-all group">
            <MessageSquare size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-gray-200">Voltar para o Chat</span>
          </button>
        </Link>
      </div>

      {/* Grid Principal */}
      <div className="grid lg:grid-cols-12 gap-8">

        {/* Coluna Esquerda: SELETOR DE MÍDIA */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Abas de Navegação */}
          <div className="bg-gray-900/40 p-1.5 rounded-2xl border border-white/5 flex gap-1 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Upload size={16} /> Upload
            </button>
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'youtube'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Youtube size={16} /> YouTube
            </button>
          </div>

          {/* Área de Conteúdo Dinâmico */}
          <div className={`flex-1 group relative border-2 transition-all duration-500 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center backdrop-blur-sm min-h-[320px] ${(selectedFile || (activeTab === 'youtube' && youtubeUrl))
            ? (activeTab === 'youtube' ? 'border-red-500/60 bg-red-500/[0.05]' : 'border-blue-500/60 bg-blue-500/[0.05]')
            : 'border-white/5 border-dashed bg-gray-900/20'
            }`}>

            {activeTab === 'upload' ? (
              // --- UI UPLOAD ---
              <>
                {selectedFile ? (
                  <>
                    <div className="w-24 h-24 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mb-6 ring-1 ring-blue-500/30 animate-in zoom-in">
                      <Film className="text-blue-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 px-4">{selectedFile.name}</h3>
                    <p className="text-blue-400 text-sm font-bold mb-4">Pronto para envio</p>
                    <button onClick={() => setSelectedFile(null)} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
                      <X size={14} /> Trocar arquivo
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-white/[0.03] rounded-[2rem] flex items-center justify-center mb-6 ring-1 ring-white/5">
                      <Upload className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Arquivo de Vídeo</h3>
                    <p className="text-gray-500 text-sm max-w-[200px]">Arraste ou clique para selecionar.</p>
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </>
            ) : (
              // --- UI YOUTUBE ---
              <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-24 h-24 bg-red-600/10 rounded-[2rem] flex items-center justify-center mx-auto ring-1 ring-red-500/30">
                  <Youtube className="text-red-500" size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Link do YouTube</h3>
                  <p className="text-gray-500 text-sm">A IA analisará as legendas automaticamente.</p>
                </div>
                <div className="relative group/input">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-red-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Cole a URL aqui..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full bg-gray-950/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: FORMULÁRIO E AÇÃO */}
        <div className="lg:col-span-7 bg-gray-900/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-md space-y-8 shadow-2xl flex flex-col h-full">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                {activeTab === 'youtube' ? 'Contexto Adicional (Opcional)' : 'Descrição ou Contexto'}
              </label>
              <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase ${activeTab === 'youtube' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                Dica para a IA
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-full min-h-[200px] bg-gray-950/50 border border-white/5 rounded-[2rem] p-8 text-gray-200 focus:ring-2 focus:ring-white/10 outline-none resize-none transition-all placeholder:text-gray-700 text-lg leading-relaxed"
              placeholder={activeTab === 'youtube'
                ? "Ex: Este vídeo fala sobre a importância da paciência na família..."
                : "Ex: Gravação da aula sobre React Server Components..."}
            />
          </div>

          <button
            onClick={handleCatalog}
            disabled={isAnalyzing}
            className={`w-full py-5 text-white font-black rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'youtube'
              ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                {activeTab === 'youtube' ? 'Lendo Legendas...' : 'Processando...'}
              </>
            ) : (
              <>
                <CheckCircle2 size={22} />
                {activeTab === 'youtube' ? 'Catalogar Vídeo' : 'Fazer Upload'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Histórico (Igual) */}
      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Library size={24} className="text-blue-500" />
            Últimos Adicionados
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{recentItems.length} RECENTES</span>
        </div>
        <div className="bg-gray-900/20 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-sm">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-10">Seu catálogo está vazio.</div>
          ) : (
            <HistoryList
              items={recentItems}
              onDelete={async (id) => {
                await fetch(`/api/catalogo?id=${id}`, { method: 'DELETE' });
                toast.success("Item removido");
                loadData();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}