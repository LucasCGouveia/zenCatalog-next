// modulos/chat/components/ChatInterface.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInterface = ({ messages, onSendMessage, isLoading }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Faz scroll automático para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    // CHAMA A FUNÇÃO QUE ESTÁ NA PAGE.TSX
    onSendMessage(input);
    
    // LIMPA O CAMPO APÓS ENVIAR
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Área de Mensagens */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-1000">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Sparkles className="text-blue-500" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Olá, sou o ChatZen</h3>
              <p className="text-slate-400 max-w-[250px]">Pergunte-me qualquer coisa sobre o seu acervo de vídeos.</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-3 items-center text-slate-400 text-xs font-bold">
              <Loader2 className="animate-spin" size={14} />
              O ChatZen está a consultar o seu acervo...
            </div>
          </div>
        )}
      </div>

      {/* Input de Texto */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Pergunte sobre os seus vídeos..."
            className="flex-1 bg-transparent border-none outline-none p-3 text-slate-700 text-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};