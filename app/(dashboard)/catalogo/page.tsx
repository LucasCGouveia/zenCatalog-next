"use client";

import React, { useState } from 'react';
import { Upload, FileText, Loader2, MessageSquare, CheckCircle2, Sparkles, X, Film } from 'lucide-react';
import Link from 'next/link';

export default function CatalogoPage() {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  // Helper para converter o vídeo em Base64 para enviar ao Gemini
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove o prefixo data:video/mp4;base64,
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCatalog = async () => {
    if (!description && !selectedFile) {
      alert("Por favor, adicione um vídeo ou uma descrição.");
      return;
    }

    setIsAnalyzing(true);

    try {
      let duration = "00:00";
      let fileData = null;

      if (selectedFile) {
        duration = await getVideoDuration(selectedFile);
        const base64 = await fileToBase64(selectedFile);
        fileData = {
          base64,
          mimeType: selectedFile.type,
          name: selectedFile.name
        };
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
        alert("✅ Catalogado com sucesso! A IA analisou o conteúdo do vídeo.");
        setDescription('');
        setSelectedFile(null);
      } else {
        throw new Error(data.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro no processamento:", error);
      alert("❌ Erro: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-10 py-6 animate-in fade-in duration-700">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em]">
            <Sparkles size={14} />
            Treinamento de IA
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Novo Conhecimento</h1>
          <p className="text-gray-500 text-lg">Alimente seu catálogo com vídeos ou transcrições manuais.</p>
        </div>

        <Link href="/">
          <button className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 px-6 py-3 rounded-2xl transition-all group">
            <MessageSquare size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-gray-200">Voltar para o Chat</span>
          </button>
        </Link>
      </div>

      {/* Grid de Upload */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Dropzone - Ocupa 5 colunas */}
        <div className={`lg:col-span-5 group relative border-2 border-dashed transition-all duration-500 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center backdrop-blur-sm ${selectedFile ? 'border-blue-500/60 bg-blue-500/[0.05]' : 'border-white/5 hover:border-blue-500/40 hover:bg-blue-500/[0.02] bg-gray-900/20'
          }`}>
          {selectedFile ? (
            <>
              <div className="w-24 h-24 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mb-6 ring-1 ring-blue-500/30">
                <Film className="text-blue-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 px-4">{selectedFile.name}</h3>
              <p className="text-blue-400 text-sm font-bold mb-4">Pronto para catalogar</p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X size={14} /> Remover arquivo
              </button>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-white/[0.03] rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600/10 transition-all duration-500 ring-1 ring-white/5">
                <Upload className="text-blue-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Arquivo de Vídeo</h3>
              <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">
                Clique ou arraste seu vídeo aqui para extração automática de insights.
              </p>
            </>
          )}
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {/* Formulário - Ocupa 7 colunas */}
        <div className="lg:col-span-7 bg-gray-900/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-md space-y-8 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Descrição ou Transcrição</label>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold uppercase">Ajuda a IA</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-56 bg-gray-950/50 border border-white/5 rounded-[2rem] p-8 text-gray-200 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all placeholder:text-gray-700 text-lg leading-relaxed"
              placeholder="Ex: Palestra focada em atitude positiva e renovação espiritual..."
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCatalog}
              disabled={isAnalyzing}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[1.5rem] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Analisando Vídeo com Gemini...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  Catalogar com Gemini
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}