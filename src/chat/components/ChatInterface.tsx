"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Sparkles, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success("Resposta copiada!"); 
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
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
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 group`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* MUDANÇA AQUI: Adicionei pb-10 na bolha do assistente para dar espaço ao botão embaixo */}
              <div className={`relative p-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none pb-10' 
              }`}>
                
                {/* MUDANÇA AQUI: Mudei de top-2 para bottom-2 */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100"
                    title="Copiar resposta"
                  >
                    {copiedIndex === idx ? (
                      <div className="flex items-center gap-1.5 px-1">
                        <Check size={14} className="text-green-500" />
                        <span className="text-[10px] font-medium text-green-600">Copiado!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-1">
                        <Copy size={14} />
                        <span className="text-[10px] font-medium">Copiar</span>
                      </div>
                    )}
                  </button>
                )}

                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="font-bold">{children}</strong>,
                    ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({children}) => <li>{children}</li>,
                    h1: ({children}) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                    h3: ({children}) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                    code: ({children}) => (
                      <code className={`px-1 py-0.5 rounded text-xs ${
                        msg.role === 'user' ? 'bg-blue-700' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {children}
                      </code>
                    ),
                    pre: ({children}) => (
                      <pre className={`p-2 rounded-lg overflow-x-auto text-xs my-2 ${
                        msg.role === 'user' ? 'bg-blue-800' : 'bg-slate-800 text-slate-100'
                      }`}>
                        {children}
                      </pre>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className={`border-l-4 pl-3 italic my-2 ${
                         msg.role === 'user' ? 'border-blue-300' : 'border-slate-300'
                      }`}>
                        {children}
                      </blockquote>
                    )
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
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