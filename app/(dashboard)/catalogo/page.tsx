"use client";

import React, { useState } from 'react';
import { Upload, FileText, Loader2, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CatalogoPage() {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        <div className="lg:col-span-5 group relative border-2 border-dashed border-white/5 hover:border-blue-500/40 hover:bg-blue-500/[0.02] transition-all duration-500 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center bg-gray-900/20 backdrop-blur-sm">
          <div className="w-24 h-24 bg-white/[0.03] rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600/10 transition-all duration-500 ring-1 ring-white/5">
            <Upload className="text-blue-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Arquivo de Vídeo</h3>
          <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">
            Arraste seu vídeo aqui para extração automática de insights.
          </p>
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        {/* Formulário - Ocupa 7 colunas */}
        <div className="lg:col-span-7 bg-gray-900/40 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-md space-y-8 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Descrição ou Transcrição</label>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold">RECOMENDADO</span>
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
              disabled={isAnalyzing}
              className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[1.5rem] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={22} />}
              Catalogar com Gemini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}