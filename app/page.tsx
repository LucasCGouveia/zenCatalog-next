"use client";

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Loader2, PlayCircle, History as HistoryIcon, Info } from 'lucide-react';
import Header from '@/modulos/catalogo/components/Header';
import HistoryList from '@/modulos/catalogo/components/HistoryList';
import { CatalogItem } from '@/modulos/catalogo/types';

export default function Page() {
  const [description, setDescription] = useState('');
  const [isWatchEveryDay, setIsWatchEveryDay] = useState(false);
  const [priority, setPriority] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<CatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Carregar histórico do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zencatalog_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      }
    }
  }, []);

  // Salvar histórico
  useEffect(() => {
    localStorage.setItem('zencatalog_history', JSON.stringify(history));
  }, [history]);

  const callAnalyzeAPI = async (payload: any) => {
    const response = await fetch('/api/analisar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha na análise da IA');
    }
    return response.json();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const result = await callAnalyzeAPI({
          fileBase64: base64,
          fileMimeType: file.type,
          isWatchEveryDay,
          priorityValue: priority
        });
        
        const newItem: CatalogItem = {
          ...result,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          isWatchEveryDay,
          originalName: file.name
        };

        setHistory(prev => [newItem, ...prev]);
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
      setIsAnalyzing(false);
    }
  };

  const handleManualAnalyze = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await callAnalyzeAPI({
        description,
        isWatchEveryDay,
        priorityValue: priority
      });

      const newItem: CatalogItem = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        isWatchEveryDay
      };
      setHistory(prev => [newItem, ...prev]);
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Card Principal de Input */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Catalogar Novo Vídeo</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Coluna 1: Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Upload do Vídeo/Imagem</label>
              <div className="relative group">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isAnalyzing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept="video/*,image/*"
                />
                <div className="border-2 border-dashed border-gray-200 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3 group-hover:text-indigo-500" />
                  <p className="text-sm text-gray-600 font-medium">Arraste ou clique para enviar</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, JPG, PNG suportados</p>
                </div>
              </div>
            </div>

            {/* Coluna 2: Texto */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">Ou cole a descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Palestra do autor X sobre o tema Y..."
                className="w-full h-[124px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all text-gray-700"
              />
              <button
                onClick={handleManualAnalyze}
                disabled={isAnalyzing || !description.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                Analisar Descrição
              </button>
            </div>
          </div>

          {/* Configurações Adicionais */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isWatchEveryDay}
                  onChange={(e) => setIsWatchEveryDay(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${isWatchEveryDay ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isWatchEveryDay ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                Mover para "Assistir Todo Dia"
              </span>
            </label>

            {isWatchEveryDay && (
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Prioridade:</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-16 p-1 border border-gray-300 rounded text-center font-bold text-indigo-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}
        </section>

        {/* Lista de Histórico */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-gray-500" />
              <h3 className="text-xl font-bold text-gray-800">Histórico de Catalogação</h3>
            </div>
            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {history.length} itens
            </span>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <HistoryIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium italic">Nenhum vídeo catalogado ainda.</p>
            </div>
          ) : (
            <HistoryList items={history} onDelete={handleDelete} />
          )}
        </section>
      </main>

      {/* Guia de Categorias */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-indigo-500" />
            <h4 className="font-bold text-gray-900">Guia de Padronização</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { tag: '[ESP]', label: 'Espiritual', color: 'bg-blue-50 text-blue-700' },
              { tag: '[HIST]', label: 'Histórias', color: 'bg-orange-50 text-orange-700' },
              { tag: '[FILO]', label: 'Filosofia', color: 'bg-purple-50 text-purple-700' },
              { tag: '[DICA]', label: 'Dicas/Saúde', color: 'bg-emerald-50 text-emerald-700' },
              { tag: '[POEMA]', label: 'Artes/Poesias', color: 'bg-pink-50 text-pink-700' },
            ].map((cat) => (
              <div key={cat.tag} className={`${cat.color} p-4 rounded-xl border border-transparent hover:border-current transition-all text-center`}>
                <span className="block font-black text-lg mb-1">{cat.tag}</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}