"use client";

import React, { useState, useEffect } from 'react';
import { HistoryList } from '@/modulos/catalogo/components/HistoryList';
import { ChatInterface } from '@/modulos/chat/components/ChatInterface';
import { CatalogItem } from '@/modulos/catalogo/types';
import { Sparkles, Library } from 'lucide-react';

export default function Page() {
  const [history, setHistory] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch('/api/catalogo').then(res => res.json()).then(setHistory);
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="relative p-10 bg-blue-600 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-600/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-100 text-sm font-bold uppercase tracking-widest mb-4">
            <Sparkles size={16} />
            Inteligência Artificial Ativa
          </div>
          <h1 className="text-4xl font-black text-white mb-2 leading-tight">O que vamos aprender <br/> hoje, Admin?</h1>
          <p className="text-blue-100/80 max-w-md text-lg">Seu assistente está pronto para analisar seu acervo espiritual e sugerir o melhor caminho.</p>
        </div>
      </div>

      {/* Chat & History Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Chat - 7 Colunas */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-gray-900/40 border border-white/5 rounded-[2rem] h-[550px] overflow-hidden backdrop-blur-md shadow-xl">
            <ChatInterface />
          </div>
        </section>

        {/* Biblioteca Rápida - 4 Colunas */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Library size={20} className="text-blue-500" />
              Recentes
            </h3>
            <span className="text-xs font-bold text-gray-500 uppercase">{history.length} Itens</span>
          </div>
          
          <div className="bg-gray-900/40 border border-white/5 rounded-[2rem] p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
            <HistoryList items={history} onDelete={() => {}} />
          </div>
        </section>
      </div>
    </div>
  );
}