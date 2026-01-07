"use client";

import React, { useState, useEffect } from 'react';
import { HistoryList } from '@/modulos/catalogo/components/HistoryList';
import { ChatInterface } from '@/modulos/chat/components/ChatInterface';
import { CatalogItem } from '@/modulos/catalogo/types';
import { Sparkles, Library } from 'lucide-react';
// IMPORTANTE: Adicionei o getChatHistory aqui na importação
import { askChatZen, getChatHistory } from '@/modulos/chat/actions/chatActions';

export default function Page() {
  const [history, setHistory] = useState<CatalogItem[]>([]);
  // O estado de mensagens começa vazio, mas será preenchido pelo useEffect abaixo
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Carrega o histórico de arquivos recentes (Catálogo)
  useEffect(() => {
    fetch('/api/catalogo')
      .then(res => res.json())
      .then(data => setHistory(Array.isArray(data) ? data : []));
  }, []);

  // 2. NOVO: Carrega o histórico de CONVERSAS (Chat) assim que o Dashboard abre
  useEffect(() => {
    const loadChatMessages = async () => {
      try {
        const previousMessages = await getChatHistory();
        // Só atualiza se houver mensagens para mostrar
        if (previousMessages && previousMessages.length > 0) {
          setMessages(previousMessages);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico do chat:", error);
      }
    };
    loadChatMessages();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Adiciona a mensagem do usuário na tela imediatamente
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Chama a IA (que agora também salva no banco automaticamente)
      const response = await askChatZen(text);

      if (response.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant' as const, 
          content: response.answer || "Não encontrei informações sobre isso no acervo." 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant' as const, 
          content: "Ops, tive um erro ao consultar o banco: " + response.error 
        }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Hero Section */}
      <div className="relative p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-600/20 overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            O que vamos aprender hoje, Admin?
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl">
            Seu assistente está pronto para analisar seu acervo e sugerir o melhor caminho baseado nos seus vídeos.
          </p>
        </div>
        <Sparkles className="absolute right-[-20px] top-[-20px] text-white/10 w-64 h-64 -rotate-12" />
      </div>

      {/* Layout Grid principal */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Lado Esquerdo: Chat (8 colunas) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] h-[600px] overflow-hidden shadow-2xl">
            <ChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
            />
          </div>
        </section>

        {/* Lado Direito: Histórico Recente (4 colunas) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Library size={20} className="text-blue-500" />
              Recentes
            </h3>
            <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {history.length} Itens
            </span>
          </div>
          
          <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-6 max-h-[530px] overflow-y-auto custom-scrollbar backdrop-blur-sm">
            <HistoryList 
              items={history} 
              onDelete={(id) => setHistory(prev => prev.filter(h => h.id !== id))} 
            />
          </div>
        </section>

      </div>
    </div >
  );
}