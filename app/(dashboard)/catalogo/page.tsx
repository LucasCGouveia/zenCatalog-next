"use client";

import React, { useState } from 'react';
import { Upload, FileText, Loader2, PlayCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function CatalogoPage() {
  const [description, setDescription] = useState('');
  const [isWatchEveryDay, setIsWatchEveryDay] = useState(false);
  const [priority, setPriority] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulação da análise (depois conectaremos à sua API)
  const handleManualAnalyze = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      alert("Vídeo catalogado com sucesso!");
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho da Página com Botão de Voltar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalogar Novo Vídeo</h1>
          <p className="text-gray-400 text-sm">Use a IA para extrair insights do seu acervo.</p>
        </div>
        
        {/* Botão para voltar para o Chat */}
        <Link 
          href="/" 
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl border border-gray-700 transition-all text-sm font-medium"
        >
          <MessageSquare size={18} className="text-blue-400" />
          Voltar para o Chat
        </Link>
      </div>

      <section className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 shadow-xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna 1: Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-300">Upload do Vídeo/Imagem</label>
            <div className="relative group border-2 border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all rounded-xl p-8 text-center cursor-pointer">
              <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3 group-hover:text-blue-500" />
              <p className="text-sm text-gray-300 font-medium">Arraste ou clique para enviar</p>
              <p className="text-xs text-gray-500 mt-1">MP4, MOV, JPG, PNG suportados</p>
            </div>
          </div>

          {/* Coluna 2: Texto */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-300">Ou cole a descrição manual</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Palestra sobre o capítulo 5 de Jesus no Lar..."
              className="w-full h-[124px] p-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
            />
            <button
              onClick={handleManualAnalyze}
              disabled={isAnalyzing || !description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Analisar com IA
            </button>
          </div>
        </div>

        {/* Configurações Adicionais */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-wrap gap-6 items-center">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isWatchEveryDay}
              onChange={(e) => setIsWatchEveryDay(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Mover para "Assistir Todo Dia"
            </span>
          </label>

          {isWatchEveryDay && (
            <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-sm font-semibold text-gray-400">Prioridade:</span>
              <input
                type="number"
                min="1"
                max="99"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="w-16 bg-transparent border-none text-center font-bold text-blue-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}