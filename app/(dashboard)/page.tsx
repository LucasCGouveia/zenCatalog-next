"use client";

import React, { useState, useEffect } from 'react';
import { ChatInterface } from '@/src/chat/components/ChatInterface';
import { Sparkles, MessageSquare, Plus, Clock, Pin, Edit2, Save, X } from 'lucide-react';
// Importe as novas ações
import {
  askChatZen,
  getChatSessions,
  getSessionMessages,
  renameSessionAction,
  togglePinSessionAction
} from '@/src/chat/actions/chatActions';

type ChatSessionItem = {
  id: string;
  title: string;
  updatedAt: Date;
  isPinned: boolean; // Novo campo
};

export default function Page() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para Edição de Nome
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await getChatSessions();
    setSessions(data);
  };

  const handleSelectSession = async (sessionId: string) => {
    if (editingId) return; // Não muda de chat se estiver editando um nome
    setIsLoading(true);
    setCurrentSessionId(sessionId);
    const msgs = await getSessionMessages(sessionId);
    setMessages(msgs);
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  // --- FUNÇÕES NOVAS DE AÇÃO ---

  const handlePin = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Evita abrir o chat ao clicar no Pin
    await togglePinSessionAction(sessionId);
    loadSessions(); // Recarrega a lista para reordenar
  };

  const startEditing = (e: React.MouseEvent, session: ChatSessionItem) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    await renameSessionAction(sessionId, editTitle);
    setEditingId(null);
    loadSessions(); // Recarrega para mostrar o novo nome
  };

  // -----------------------------

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const response = await askChatZen(text, currentSessionId || undefined);

      if (response.success && response.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
        if (!currentSessionId && response.sessionId) {
          setCurrentSessionId(response.sessionId);
          loadSessions();
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Erro: " + response.error }]);
      }
    } catch (error: unknown) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Hero */}
      <div className="relative p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-600/20 overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            Sala de Aula Zen
          </h1>
          <p className="text-blue-100/80 text-lg max-w-2xl">
            Crie aulas, dinâmicas e estudos baseados no seu acervo.
          </p>
        </div>
        <Sparkles className="absolute right-[-20px] top-[-20px] text-white/10 w-64 h-64 -rotate-12" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">

        {/* Chat (Esquerda) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400" />
              {currentSessionId ? 'Em andamento' : 'Nova Conversa'}
            </h2>
            <button
              onClick={handleNewChat}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold"
            >
              <Plus size={16} /> Nova Aula
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] h-[600px] overflow-hidden shadow-2xl">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Histórico (Direita) */}
        <section className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-blue-400" />
              Histórico
            </h3>
          </div>

          <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-4 max-h-[600px] overflow-y-auto custom-scrollbar backdrop-blur-sm space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">
                Nenhuma aula salva.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border group relative cursor-pointer ${currentSessionId === session.id
                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/50'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                >
                  {/* Ícone de Pin fixo se estiver pinado */}
                  {session.isPinned && (
                    <Pin size={12} className="absolute top-2 right-2 text-yellow-400 fill-yellow-400" />
                  )}

                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className={`mt-1 shrink-0 ${currentSessionId === session.id ? 'text-white' : 'text-blue-400'
                      }`} />

                    <div className="flex-1 overflow-hidden">
                      {/* Lógica de Edição: Mostra Input OU Título */}
                      {editingId === session.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-black/20 text-white text-xs p-1 rounded outline-none border border-white/20"
                          />
                          <button onClick={(e) => saveTitle(e, session.id)} className="text-green-400 hover:text-green-300"><Save size={14} /></button>
                          <button onClick={cancelEditing} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <h4 className={`font-bold truncate text-sm pr-6 ${currentSessionId === session.id ? 'text-white' : 'text-slate-200'
                            }`}>
                            {session.title}
                          </h4>
                          <p className={`text-[10px] mt-1 ${currentSessionId === session.id ? 'text-blue-200' : 'text-slate-500'
                            }`}>
                            {new Date(session.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações Hover (Só aparecem quando passa o mouse) */}
                  {!editingId && (
                    <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handlePin(e, session.id)}
                        className="p-1.5 rounded-lg bg-black/40 text-slate-300 hover:text-yellow-400 hover:bg-black/60"
                        title={session.isPinned ? "Desafixar" : "Fixar Aula"}
                      >
                        <Pin size={12} className={session.isPinned ? "fill-yellow-400 text-yellow-400" : ""} />
                      </button>
                      <button
                        onClick={(e) => startEditing(e, session)}
                        className="p-1.5 rounded-lg bg-black/40 text-slate-300 hover:text-white hover:bg-black/60"
                        title="Renomear"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div >
  );
}